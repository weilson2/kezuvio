import test from "node:test";
import assert from "node:assert/strict";
import {
  pageMetadata,
  jsonLd,
  privateIndexPaths,
} from "../apps/website/lib/seo.ts";
import { workflowFor } from "../packages/studio/inquiry-workflow.ts";
import {
  createDevelopmentEvent,
  readDevelopmentEvents,
  recordDevelopmentEvent,
  isDevelopmentHost,
  developmentAnalyticsKey,
  developmentAnalyticsLimit,
} from "../apps/website/lib/development-analytics.ts";
const view = () => ({
  inquiries: [{ id: "inquiry-1" }],
  analyses: [],
  quotes: [],
  followups: [],
});
const withQuote = (status = "Draft", revision = 1, approval = null) => ({
  inquiries: [{ id: "inquiry-1" }],
  analyses: [{ id: "analysis-1", inquiryId: "inquiry-1" }],
  quotes: [
    { id: "quote-1", inquiryId: "inquiry-1", status, revision, approval },
  ],
  followups: [],
});
function storage(initial = null) {
  let value = initial;
  return {
    getItem: () => value,
    setItem: (_key, next) => {
      value = next;
    },
    raw: () => value,
  };
}

test("Workflow progresses from saved inquiry through analysis and current draft to human review", () => {
  const initial = view();
  let row = workflowFor("inquiry-1", initial);
  assert.equal(row.stage, "Qualification");
  assert.equal(row.steps[0].status, "done");
  assert.equal(row.steps[1].status, "current");
  assert.equal(row.canReview, false);
  assert.equal(row.canPrepare, false);
  initial.analyses.push({ id: "a", inquiryId: "inquiry-1" });
  row = workflowFor("inquiry-1", initial);
  assert.equal(row.stage, "Quotation Draft");
  row = workflowFor("inquiry-1", withQuote());
  assert.equal(row.stage, "Human Review");
  assert.equal(row.canReview, true);
  assert.equal(row.canPrepare, false);
  assert.equal(row.steps[2].status, "done");
});
test("Stale approval and rejected or unqualified quotations cannot grant proposal/follow-up readiness", () => {
  for (const state of [
    withQuote("Approved", 2, { revision: 1 }),
    withQuote("Rejected", 1, { revision: 1 }),
    { ...withQuote("Ready", 1, { revision: 1 }), analyses: [] },
  ]) {
    state.followups.push({ id: "early", inquiryId: "inquiry-1" });
    const row = workflowFor("inquiry-1", state);
    assert.equal(row.canPrepare, false);
    assert.equal(row.canFollowUp, false);
    assert.equal(row.steps[4].status, "pending");
    assert.equal(row.steps[5].status, "pending");
  }
});
test("Current reviewed proposal gates readiness and linked follow-up progress", () => {
  let state = withQuote("Approved", 2, { revision: 2 });
  let row = workflowFor("inquiry-1", state);
  assert.equal(row.canPrepare, true);
  assert.equal(row.canFollowUp, false);
  assert.equal(row.stage, "Approved Proposal");
  state.quotes[0].status = "Ready";
  row = workflowFor("inquiry-1", state);
  assert.equal(row.canFollowUp, true);
  assert.equal(row.steps[4].status, "done");
  assert.equal(row.steps[5].status, "current");
  state.followups.push({ id: "followup", inquiryId: "inquiry-1" });
  row = workflowFor("inquiry-1", state);
  assert.equal(row.steps[5].status, "done");
});
test("Foreign and redacted inquiries produce no private workflow data", () => {
  assert.equal(workflowFor("foreign", withQuote()), null);
  assert.equal(
    workflowFor("inquiry-1", {
      inquiries: [],
      analyses: [],
      quotes: [],
      followups: [],
    }),
    null,
  );
});
test("Analytics accepts named local events and removes query/hash/contact values", () => {
  const event = createDevelopmentEvent(
    "quotation_inquiry",
    "/request-quotation?email=private%40example.test#private",
    0,
  );
  assert.deepEqual(event, {
    name: "quotation_inquiry",
    path: "/request-quotation",
    at: "1970-01-01T00:00:00.000Z",
  });
  assert.equal(JSON.stringify(event).includes("private"), false);
  for (const [name, path] of [
    ["unknown", "/pricing"],
    ["pricing_view", "https://external.test/pricing"],
    ["contact_submission", "/customer/private-person"],
    ["demo_visit", "/api/operations/session"],
  ])
    assert.equal(createDevelopmentEvent(name, path), null);
  assert.equal(
    createDevelopmentEvent("pricing_view", "/pricing", Infinity),
    null,
  );
});
test("Analytics drops malformed records and any unknown stored fields", () => {
  const good = createDevelopmentEvent("pricing_view", "/pricing", 0);
  const store = storage(
    JSON.stringify([
      good,
      { ...good, email: "private@example.test" },
      null,
      { name: "unknown", path: "/pricing", at: good.at },
    ]),
  );
  assert.deepEqual(readDevelopmentEvents(store), [good]);
  assert.deepEqual(readDevelopmentEvents(storage("{invalid")), []);
  assert.deepEqual(readDevelopmentEvents(storage("x".repeat(100001))), []);
});
test("Analytics retains bounded canonical events without network or production-host writes", () => {
  const store = storage();
  for (let i = 0; i < developmentAnalyticsLimit + 20; i++)
    recordDevelopmentEvent(
      store,
      "127.0.0.1",
      "demo_visit",
      "/demo/interior-3d?person=private",
      i,
    );
  const events = readDevelopmentEvents(store);
  assert.equal(events.length, 200);
  assert.equal(events[0].at, new Date(20).toISOString());
  assert.equal(store.raw().includes("person"), false);
  const previous = store.raw();
  assert.deepEqual(
    recordDevelopmentEvent(
      store,
      "kezuvio.example",
      "pricing_view",
      "/pricing",
    ),
    [],
  );
  assert.equal(store.raw(), previous);
  for (const hostname of ["localhost", "127.0.0.1", "::1", "[::1]"])
    assert.equal(isDevelopmentHost(hostname), true);
  assert.equal(isDevelopmentHost("localhost.evil.test"), false);
  assert.equal(developmentAnalyticsKey, "kezuvio-development-events-v1");
});
test("Unavailable storage and quota exhaustion cannot interrupt application work", () => {
  const unavailable = {
    getItem() {
      throw new Error("storage blocked");
    },
    setItem() {
      throw new Error("quota");
    },
  };
  assert.deepEqual(readDevelopmentEvents(unavailable), []);
  assert.deepEqual(
    recordDevelopmentEvent(
      unavailable,
      "localhost",
      "pricing_view",
      "/pricing",
    ),
    [],
  );
});

test("Metadata keeps canonical/social context and prevents interactive/private page indexing", () => {
  const metadata = pageMetadata(
    { title: "Website planning", description: "Fictional studio scope" },
    "/services/web-development",
  );
  assert.equal(metadata.alternates.canonical, "/services/web-development");
  assert.equal(metadata.openGraph.title, "Website planning");
  assert.equal(metadata.twitter.description, "Fictional studio scope");
  for (const path of [
    "/demo/property-crm",
    "/demo/accounting-cloud",
    "/demo/interior-3d",
    "/inquiry-workflow",
    "/operations",
  ])
    assert.deepEqual(pageMetadata({}, path).robots, {
      index: false,
      follow: false,
    });
  assert.ok(privateIndexPaths.includes("/api/"));
  assert.ok(privateIndexPaths.includes("/demo/"));
});
test("Structured data escapes script-closing text without changing the parsed content", () => {
  const value = { name: "</script><script>alert(1)</script>" };
  const safe = jsonLd(value);
  assert.equal(safe.includes("<"), false);
  assert.deepEqual(JSON.parse(safe), value);
  assert.equal(jsonLd(undefined), "null");
});
