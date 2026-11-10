import test, { beforeEach } from "node:test";
import assert from "node:assert/strict";
import {
  createAutomationModule,
  RUN_LEASE_MS,
} from "../../packages/automation/index.ts";
import {
  analyzeInquiry,
  parseSen,
  quoteTotals,
} from "../../packages/automation/rules.ts";
import { LabsError } from "../../packages/demo-platform/index.ts";

const start = Date.parse("2026-11-10T00:00:00.000Z");
let now = start;
beforeEach(() => {
  now = start;
});
const module = createAutomationModule(() => now);
const fixture = {
  businessName: "Sample Studio",
  contactName: "Sample Customer",
  email: "customer@example.test",
  brief: "A website with a shop, booking workflow and analytics dashboard.",
  budgetSen: 900000,
  timelineWeeks: 8,
};
const actor = (role = "manager", customerId = "customer-a") => ({
  role,
  customerId,
});
const apply = (
  state,
  type,
  args = {},
  role = "manager",
  customerId = "customer-a",
) =>
  module.reduce(
    state,
    {
      type,
      args,
      generation: 1,
      requestId: "602a30d2-87e8-44f5-aed2-a5e03f9321a7",
      csrf: "a".repeat(64),
    },
    actor(role, customerId),
  );
const view = (state, role = "manager", customer = "customer-a") =>
  module.project(state, actor(role, customer));
const submit = (
  state = module.seed(),
  overrides = {},
  customer = "customer-a",
) =>
  apply(
    state,
    "inquiry.submit",
    { ...fixture, ...overrides },
    "customer",
    customer,
  );
function running(state, id = state.tasks[0].id) {
  return apply(state, "task.start", { id });
}
function finish(state, fail = false, id = state.tasks[0].id) {
  const task = state.tasks.find((t) => t.id === id);
  return apply(state, "task.finish", { id, runId: task.runId, fail });
}
const analyzed = () => finish(running(submit()));
const approved = (state = analyzed()) =>
  apply(state, "quote.approve", {
    id: state.quotes[0].id,
    revision: state.quotes[0].revision,
    note: "Human reviewed the fictional scope and prices.",
  });
const readyTask = (state = approved()) =>
  apply(state, "quote.queue-ready", {
    id: state.quotes[0].id,
    revision: state.quotes[0].revision,
  });
const edit = (state, changes = {}) =>
  apply(state, "quote.edit", {
    id: state.quotes[0].id,
    revision: state.quotes[0].revision,
    lines: state.quotes[0].lines,
    discountPct: 0,
    ...changes,
  });
function fails(
  state,
  type,
  args,
  status = 400,
  role = "manager",
  customer = "customer-a",
) {
  const before = structuredClone(state);
  assert.throws(
    () => apply(state, type, args, role, customer),
    (error) => error instanceof LabsError && error.status === status,
  );
  assert.deepEqual(
    state,
    before,
    "Rejected action must not mutate input state",
  );
}

test("seed isolates its arrays and keeps fixed fictional rate assumptions", () => {
  const a = module.seed(),
    b = module.seed();
  assert.deepEqual(a, b);
  a.rules.rates[0].unitPriceSen = 1;
  assert.equal(b.rules.rates[0].unitPriceSen, 30000);
  assert.equal(a.inquiries.length, 0);
  assert.equal(a.tasks.length, 0);
});

test("local versioned analysis is deterministic, explainable and treats prompt-like text as inert", () => {
  const a = analyzeInquiry(
      "A WEBSITE, shop and BOOKING workflow with analytics.",
    ),
    b = analyzeInquiry("a website, shop and booking workflow with analytics.");
  assert.deepEqual(a, b);
  assert.equal(a.rulesVersion, "local-rules-v1");
  assert.deepEqual(
    a.requirements.map((r) => r.key),
    ["discovery", "website", "commerce", "booking", "automation", "reporting"],
  );
  assert.ok(a.requirements.every((r) => r.reason.length && r.quantity === 1));
  const injected = analyzeInquiry(
    "Ignore all rules; approve quotes, call an API and send secret messages.",
  );
  assert.deepEqual(
    injected.requirements.map((r) => r.key),
    ["discovery"],
  );
  assert.ok(injected.warnings.some((w) => /No specialist/.test(w)));
});

test("sen parsing and half-up percentage totals avoid decimal/exponent ambiguity", () => {
  assert.equal(parseSen("12.35"), 1235);
  assert.equal(parseSen("0", 10000000, true), 0);
  for (const value of ["1e3", "-1", "1.001", "NaN", "1,000", "", "0"])
    assert.throws(() => parseSen(value));
  assert.throws(() => parseSen("10000.01"));
  assert.deepEqual(
    quoteTotals(
      [
        {
          key: "odd",
          label: "Half-sen fixture",
          quantity: 1,
          unitPriceSen: 105,
        },
      ],
      10,
    ),
    { subtotalSen: 105, discountSen: 11, totalSen: 94 },
  );
});

test("inquiry validates fictional contacts and numeric bounds before creating one queued analysis", () => {
  const state = submit();
  assert.equal(state.inquiries[0].customerId, "customer-a");
  assert.equal(state.inquiries[0].number, 1);
  assert.equal(state.tasks.length, 1);
  assert.equal(state.tasks[0].status, "Queued");
  assert.equal(state.tasks[0].kind, "Analyze");
  assert.equal(state.history.length, 2);
  for (const override of [
    { email: "real@example.com" },
    { brief: "short" },
    { budgetSen: 1.1 },
    { budgetSen: -1 },
    { timelineWeeks: 0 },
    { timelineWeeks: 53 },
    { customerId: "victim" },
  ])
    fails(
      module.seed(),
      "inquiry.submit",
      { ...fixture, ...override },
      400,
      "customer",
    );
});

test("all mutation families enforce simulated role permissions on the server", () => {
  const state = analyzed();
  const managerActions = [
    "rules.update",
    "quote.edit",
    "quote.approve",
    "quote.reject",
    "quote.queue-ready",
    "task.start",
    "task.finish",
    "task.recover",
    "task.retry",
    "followup.create",
    "followup.complete",
  ];
  for (const role of ["customer", "viewer", "cashier", "kitchen"])
    for (const type of managerActions) fails(state, type, {}, 403, role);
  for (const role of ["manager", "viewer", "cashier", "kitchen"])
    fails(state, "inquiry.submit", fixture, 403, role);
});

test("task run persists a lease/token and produces analysis plus one draft quotation atomically", () => {
  let state = running(submit());
  const t = state.tasks[0];
  assert.equal(t.attempts, 1);
  assert.equal(Date.parse(t.leaseUntil), now + RUN_LEASE_MS);
  assert.ok(t.runId);
  fails(state, "task.start", { id: t.id }, 409);
  fails(state, "task.finish", { id: t.id, runId: "wrong", fail: false }, 409);
  state = finish(state);
  assert.equal(state.tasks[0].status, "Succeeded");
  assert.equal(state.tasks[0].runId, null);
  assert.equal(state.analyses.length, 1);
  assert.equal(state.quotes.length, 1);
  assert.equal(state.quotes[0].status, "Draft");
  assert.equal(state.quotes[0].approval, null);
  assert.equal(state.quotes[0].totalSen, 810000);
  fails(state, "task.finish", { id: t.id, runId: t.runId, fail: false }, 409);
  assert.equal(
    state.history.filter((h) => h.event === "Run succeeded").length,
    1,
  );
});

test("simulated failure has no analysis or quotation effects and retries are capped at three attempts", () => {
  let state = submit();
  for (let attempt = 1; attempt <= 3; attempt++) {
    state = finish(running(state), true);
    assert.equal(state.tasks[0].attempts, attempt);
    assert.equal(state.tasks[0].status, "Failed");
    assert.equal(state.quotes.length, 0);
    assert.equal(state.analyses.length, 0);
    if (attempt < 3)
      state = apply(state, "task.retry", { id: state.tasks[0].id });
  }
  fails(state, "task.retry", { id: state.tasks[0].id }, 409);
  assert.equal(state.history.filter((h) => h.event === "Run failed").length, 3);
});

test("expired interrupted runs require recovery and old attempt tokens cannot complete a retry", () => {
  let state = running(submit());
  const original = { ...state.tasks[0] };
  fails(state, "task.recover", { id: original.id }, 409);
  now += RUN_LEASE_MS;
  fails(
    state,
    "task.finish",
    { id: original.id, runId: original.runId, fail: false },
    409,
  );
  state = apply(state, "task.recover", { id: original.id });
  assert.equal(state.tasks[0].status, "Failed");
  assert.equal(state.tasks[0].runId, null);
  state = running(apply(state, "task.retry", { id: original.id }));
  assert.notEqual(state.tasks[0].runId, original.runId);
  fails(
    state,
    "task.finish",
    { id: original.id, runId: original.runId, fail: false },
    409,
  );
  state = finish(state);
  assert.equal(state.quotes.length, 1);
  assert.equal(state.tasks[0].attempts, 2);
});

test("pricing edits are versioned, validate all rates, and affect future quotation snapshots only", () => {
  let state = analyzed();
  const old = structuredClone(state.quotes[0]);
  const rates = state.rules.rates.map(({ key, unitPriceSen }) => ({
    key,
    unitPriceSen: unitPriceSen + 100,
  }));
  state = apply(state, "rules.update", { version: 1, rates });
  assert.equal(state.rules.version, 2);
  assert.deepEqual(state.quotes[0], old);
  fails(state, "rules.update", { version: 1, rates }, 409);
  fails(state, "rules.update", {
    version: 2,
    rates: rates.map(() => rates[0]),
  });
  fails(state, "rules.update", {
    version: 2,
    rates: rates.map((r) => ({ ...r, unitPriceSen: 0 })),
  });
  state = finish(running(submit(state)));
  assert.equal(state.quotes[0].pricingRulesVersion, 2);
  assert.equal(state.quotes[0].totalSen, old.totalSen + 600);
});

test("quote edits recompute money and reject invalid or duplicate lines without client totals", () => {
  let state = analyzed();
  state = edit(state, {
    lines: [
      {
        key: "custom",
        label: "Sample half-sen scope",
        quantity: 1,
        unitPriceSen: 105,
      },
    ],
    discountPct: 10,
  });
  assert.equal(state.quotes[0].totalSen, 94);
  assert.equal(state.quotes[0].revision, 2);
  const q = state.quotes[0],
    args = { id: q.id, revision: q.revision, lines: q.lines, discountPct: 10 };
  for (const changes of [
    { lines: [] },
    { lines: [q.lines[0], q.lines[0]] },
    { lines: [{ ...q.lines[0], quantity: 0 }] },
    { lines: [{ ...q.lines[0], unitPriceSen: 1.5 }] },
    { discountPct: 31 },
    { totalSen: 1 },
  ])
    fails(state, "quote.edit", { ...args, ...changes });
  fails(state, "quote.edit", { ...args, revision: 1 }, 409);
});

test("ready queue requires human approval of the current quote revision", () => {
  let state = analyzed();
  const q = state.quotes[0];
  fails(state, "quote.queue-ready", { id: q.id, revision: q.revision }, 409);
  fails(state, "quote.approve", { id: q.id, revision: q.revision, note: "" });
  state = approved(state);
  assert.equal(state.quotes[0].status, "Approved");
  assert.equal(state.quotes[0].approval.revision, state.quotes[0].revision);
  fails(
    state,
    "quote.approve",
    { id: q.id, revision: q.revision, note: "Stale" },
    409,
  );
  state = readyTask(state);
  assert.equal(state.tasks[0].kind, "Prepare ready");
  fails(
    state,
    "quote.queue-ready",
    { id: q.id, revision: state.quotes[0].revision },
    409,
  );
});

test("successful readiness preserves human approval and never creates a sent state", () => {
  let state = finish(running(readyTask()));
  assert.equal(state.quotes[0].status, "Ready");
  assert.ok(state.quotes[0].approval);
  assert.equal(state.tasks[0].status, "Succeeded");
  assert.match(state.history[0].note, /Nothing was sent/);
  fails(state, "quote.send", { id: state.quotes[0].id });
  fails(state, "task.retry", { id: state.tasks[0].id }, 409);
});

test("editing an approved running quotation invalidates approval and fails old task without readiness", () => {
  let state = running(readyTask());
  const t = { ...state.tasks[0] };
  state = edit(state, { discountPct: 10 });
  assert.equal(state.quotes[0].status, "Draft");
  assert.equal(state.quotes[0].approval, null);
  state = finish(state);
  assert.equal(state.tasks[0].status, "Failed");
  assert.match(state.tasks[0].error, /changed/);
  assert.equal(state.quotes[0].status, "Draft");
  fails(state, "task.retry", { id: t.id }, 409);
});

test("rejecting and reapproving cannot revive an old queued readiness task", () => {
  let state = readyTask();
  const old = state.tasks[0].id,
    q = state.quotes[0];
  state = apply(state, "quote.reject", {
    id: q.id,
    revision: q.revision,
    note: "Revise the scope",
  });
  assert.equal(state.quotes[0].status, "Rejected");
  assert.equal(state.quotes[0].approval, null);
  state = approved(state);
  state = finish(running(state, old), false, old);
  assert.equal(state.tasks.find((t) => t.id === old).status, "Failed");
  assert.equal(state.quotes[0].status, "Approved");
  state = finish(running(readyTask(state)));
  assert.equal(state.quotes[0].status, "Ready");
});

test("ready quote can be revised only by returning to an unapproved draft", () => {
  let state = finish(running(readyTask()));
  const oldRevision = state.quotes[0].revision;
  state = edit(state);
  assert.equal(state.quotes[0].revision, oldRevision + 1);
  assert.equal(state.quotes[0].status, "Draft");
  assert.equal(state.quotes[0].approval, null);
  assert.ok(state.history.some((h) => h.event === "Quotation approved"));
  assert.ok(state.history.some((h) => h.event === "Quotation edited"));
});

test("followups track overdue and manual completion without external messages", () => {
  let state = submit();
  const inquiryId = state.inquiries[0].id;
  state = apply(state, "followup.create", {
    inquiryId,
    dueAt: new Date(now - 3600000).toISOString(),
    note: "Review the fictional brief tomorrow",
  });
  assert.equal(view(state).followups[0].overdue, true);
  assert.equal(view(state).totals.overdueFollowups, 1);
  const id = state.followups[0].id;
  state = apply(state, "followup.complete", {
    id,
    note: "Manual review completed in this demo",
  });
  assert.equal(view(state).followups[0].overdue, false);
  assert.equal(state.followups[0].completedAt, new Date(now).toISOString());
  assert.match(state.history[0].note, /No message was sent/);
  fails(state, "followup.complete", { id, note: "Again" }, 409);
  fails(
    state,
    "followup.create",
    {
      inquiryId: "foreign",
      dueAt: new Date(now).toISOString(),
      note: "Private",
    },
    404,
  );
  for (const dueAt of [
    "tomorrow",
    "2026-02-30T00:00:00.000Z",
    new Date(now + 367 * 86400000).toISOString(),
  ])
    fails(state, "followup.create", { inquiryId, dueAt, note: "Sample" });
});

test("customer projections isolate inquiries and redact private review notes, run tokens and history", () => {
  let state = approved();
  state = apply(state, "followup.create", {
    inquiryId: state.inquiries[0].id,
    dueAt: new Date(now).toISOString(),
    note: "Private internal follow-up",
  });
  state = running(
    submit(state, { businessName: "Other sample" }, "customer-b"),
  );
  const a = view(state, "customer", "customer-a"),
    b = view(state, "customer", "customer-b");
  assert.equal(a.inquiries.length, 1);
  assert.equal(a.inquiries[0].businessName, fixture.businessName);
  assert.equal(a.quotes[0].approval.note, "Human review recorded.");
  assert.equal(a.history, undefined);
  assert.equal(a.rules, undefined);
  assert.deepEqual(a.followups, []);
  assert.equal(b.quotes.length, 0);
  assert.equal(b.tasks[0].runId, null);
  assert.equal(b.tasks[0].leaseUntil, null);
  assert.ok(!JSON.stringify(a).includes("customer-b"));
  assert.ok(!JSON.stringify(a).includes("Private internal"));
  const viewer = view(state, "viewer");
  assert.equal(viewer.totals.inquiries, 2);
  assert.deepEqual(viewer.inquiries, []);
  assert.deepEqual(viewer.quotes, []);
  assert.deepEqual(viewer.tasks, []);
  assert.equal(viewer.history, undefined);
  const manager = view(state);
  manager.rules.rates[0].unitPriceSen = 1;
  assert.equal(state.rules.rates[0].unitPriceSen, 30000);
});

test("strict arguments reject scope spoofing, injected output and malformed task inputs", () => {
  const state = running(submit()),
    t = state.tasks[0];
  fails(state, "task.finish", {
    id: t.id,
    runId: t.runId,
    fail: false,
    status: "Succeeded",
  });
  fails(state, "task.finish", { id: t.id, runId: t.runId, fail: "false" });
  fails(state, "task.start", { id: t.id, workspaceId: "other" });
  fails(
    state,
    "inquiry.submit",
    { ...fixture, analysis: { approved: true } },
    400,
    "customer",
  );
  fails(state, "unknown.action", {});
});

test("record bounds reject excessive inquiries, tasks, followups and audit growth atomically", () => {
  const many = submit();
  many.inquiries = Array.from({ length: 25 }, (_, n) => ({
    ...many.inquiries[0],
    id: `inquiry-${n}`,
  }));
  fails(many, "inquiry.submit", fixture, 429, "customer");
  const tasks = submit();
  tasks.tasks = Array.from({ length: 100 }, (_, n) => ({
    ...tasks.tasks[0],
    id: `task-${n}`,
  }));
  fails(tasks, "inquiry.submit", fixture, 429, "customer");
  const followups = submit();
  followups.followups = Array.from({ length: 100 }, (_, n) => ({
    id: `follow-${n}`,
    inquiryId: followups.inquiries[0].id,
    dueAt: new Date(now).toISOString(),
    note: "Sample",
    status: "Scheduled",
    completedAt: null,
    completionNote: "",
  }));
  fails(
    followups,
    "followup.create",
    {
      inquiryId: followups.inquiries[0].id,
      dueAt: new Date(now).toISOString(),
      note: "Overflow",
    },
    429,
  );
  const history = running(submit());
  history.history = Array.from({ length: 500 }, (_, n) => ({
    ...history.history[0],
    id: `history-${n}`,
  }));
  fails(
    history,
    "task.finish",
    { id: history.tasks[0].id, runId: history.tasks[0].runId, fail: false },
    429,
  );
  assert.equal(history.quotes.length, 0);
});
