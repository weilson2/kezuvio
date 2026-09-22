import {
  test,
  expect,
  type Page,
  type APIRequestContext,
} from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import type { AutomationView } from "../../packages/automation/index";

const origin = "http://127.0.0.1:3100";
const api = "/api/labs/automation-hub";
const url = "/inquiry-workflow";
type Packet = {
  csrf: string;
  generation: number;
  role: string;
  state: AutomationView;
};
const sample = {
  businessName: "Sample Bunga Studio",
  contactName: "Sample Aina",
  email: "aina@example.test",
  brief: "A fictional website with an online booking workflow.",
  budgetSen: 500000,
  timelineWeeks: 6,
};
const button = (page: Page, name: string) =>
  page.getByRole("button", { name, exact: true });
const field = (page: Page, name: string) =>
  page.getByLabel(name, { exact: true });
const payload = (
  packet: Packet,
  type: string,
  args: Record<string, unknown>,
) => ({
  type,
  args,
  csrf: packet.csrf,
  generation: packet.generation,
  requestId: crypto.randomUUID(),
});
async function session(request: APIRequestContext): Promise<Packet> {
  const result = await request.get(api + "/session");
  expect(result.status()).toBe(200);
  return result.json();
}
async function post(request: APIRequestContext, data: unknown) {
  return request.post(api + "/action", { headers: { Origin: origin }, data });
}
async function action(
  request: APIRequestContext,
  packet: Packet,
  type: string,
  args: Record<string, unknown>,
): Promise<Packet> {
  const result = await post(request, payload(packet, type, args));
  expect(result.status(), await result.text()).toBe(200);
  return result.json();
}
async function role(page: Page, value: string) {
  await field(page, "Demo role").selectOption(value);
  await expect(field(page, "Demo role")).toBeEnabled();
  await expect(field(page, "Demo role")).toHaveValue(value);
}
async function submit(page: Page) {
  await page.goto(url);
  await page.getByRole("checkbox", { name: /I am using fictional/ }).check();
  await button(page, "Save fictional inquiry").click();
  await expect(page.getByTestId(/^inquiry-record-/)).toBeVisible();
}
async function qualified(request: APIRequestContext) {
  let packet = await session(request);
  packet = await action(request, packet, "inquiry.submit", sample);
  packet = await action(request, packet, "role", { role: "manager" });
  const taskId = packet.state.tasks[0].id;
  packet = await action(request, packet, "task.start", { id: taskId });
  const run = packet.state.tasks.find((task) => task.id === taskId)!;
  return action(request, packet, "task.finish", {
    id: taskId,
    runId: run.runId,
    fail: false,
  });
}

test("fictional inquiry reaches reviewed Ready proposal and a manual follow-up using saved local tasks", async ({
  page,
}) => {
  test.setTimeout(90000);
  const posts: string[] = [];
  page.on("request", (request) => {
    if (request.method() === "POST") posts.push(request.url());
  });
  await page.addInitScript(() => {
    const scope = window as unknown as { inquiryEventDetails: unknown[] };
    scope.inquiryEventDetails = [];
    window.addEventListener("kezuvio:quotation-inquiry", (event) =>
      scope.inquiryEventDetails.push((event as CustomEvent).detail),
    );
  });
  await submit(page);
  const events = await page.evaluate(
    () =>
      (window as unknown as { inquiryEventDetails: unknown[] })
        .inquiryEventDetails,
  );
  expect(events).toEqual([null]);
  let packet = await session(page.request);
  expect(packet.state.tasks[0].status).toBe("Queued");
  expect(packet.state.quotes).toEqual([]);
  await role(page, "manager");
  await expect(button(page, "Prepare approved proposal")).toHaveCount(0);
  await expect(button(page, "Schedule internal follow-up")).toHaveCount(0);
  await button(page, "Qualify and draft quotation").click();
  await expect(page.getByTestId("inquiry-quote-total")).toHaveText(
    /RM\s*4,800\.00/,
  );
  packet = await session(page.request);
  expect(packet.state.analyses).toHaveLength(1);
  expect(packet.state.analyses[0].requirements.map((item) => item.key)).toEqual(
    ["discovery", "website", "booking", "automation"],
  );
  expect(packet.state.quotes[0]).toMatchObject({
    totalSen: 480000,
    status: "Draft",
    approval: null,
  });
  expect(packet.state.tasks[0].status).toBe("Succeeded");
  await button(page, "Approve quotation").click();
  await expect(
    page.locator(".labs-workspace .inquiry-error[role='alert']"),
  ).toContainText("review note");
  await field(page, "Review note").fill(
    "Reviewed the fictional scope, assumptions and illustrative rates.",
  );
  await button(page, "Approve quotation").click();
  await expect(button(page, "Prepare approved proposal")).toBeVisible();
  await button(page, "Prepare approved proposal").click();
  await expect(page.getByTestId("inquiry-ready")).toContainText(
    "unsent demo proposal",
  );
  packet = await session(page.request);
  expect(packet.state.quotes[0].status).toBe("Ready");
  expect(packet.state.quotes[0].approval?.revision).toBe(
    packet.state.quotes[0].revision,
  );
  expect(packet.state.tasks).toHaveLength(2);
  expect(packet.state.tasks.every((task) => task.status === "Succeeded")).toBe(
    true,
  );
  expect(packet.state.totals).toMatchObject({
    readyQuotes: 1,
    approvedValueSen: 480000,
  });
  const yesterdayMyt = new Date(Date.now() + 8 * 3600000 - 86400000)
    .toISOString()
    .slice(0, 16);
  await field(page, "Follow-up due (MYT)").fill(yesterdayMyt);
  await field(page, "Internal follow-up note").fill(
    "Review the fictional proposal assumptions internally.",
  );
  await button(page, "Schedule internal follow-up").click();
  const followup = page.getByTestId(/^inquiry-followup-/);
  await expect(followup.locator(".badge")).toHaveText("Overdue");
  await field(page, "Completion note").fill(
    "Fictional internal review recorded. Nothing was sent.",
  );
  await button(page, "Complete internal follow-up").click();
  await expect(followup.locator(".badge")).toHaveText("Completed");
  await page.reload();
  await expect(page.getByTestId("inquiry-ready")).toBeVisible();
  await expect(
    page.getByRole("list", { name: "Inquiry workflow progress" }).locator("li"),
  ).toHaveCount(6);
  await role(page, "customer");
  packet = await session(page.request);
  expect(packet.state.followups).toEqual([]);
  expect(packet.state.quotes[0].approval?.note).toBe("Human review recorded.");
  expect(packet.state.tasks.every((task) => task.runId === null)).toBe(true);
  await expect(button(page, "Approve quotation")).toHaveCount(0);
  await role(page, "viewer");
  expect((await session(page.request)).state.inquiries).toEqual([]);
  await expect(
    page.getByText(/Viewer receives read-only aggregate totals/),
  ).toBeVisible();
  expect(posts.length).toBeGreaterThan(8);
  expect(posts.every((address) => address === origin + api + "/action")).toBe(
    true,
  );
});

test("a real email stays local and rejected; readiness is blocked before approval and after an edited revision", async ({
  page,
}) => {
  await page.goto(url);
  const posts: string[] = [];
  page.on("request", (request) => {
    if (request.method() === "POST") posts.push(request.url());
  });
  await field(page, "Fictional email").fill("real@example.com");
  await page.getByRole("checkbox", { name: /I am using fictional/ }).check();
  await button(page, "Save fictional inquiry").click();
  await expect(
    page.locator(".labs-workspace .inquiry-error[role='alert']"),
  ).toContainText("fictional .test");
  expect(posts).toEqual([]);
  expect((await session(page.request)).state.inquiries).toEqual([]);
  let packet = await qualified(page.request);
  let quote = packet.state.quotes[0];
  const rejected = await post(
    page.request,
    payload(packet, "quote.queue-ready", {
      id: quote.id,
      revision: quote.revision,
    }),
  );
  expect(rejected.status()).toBe(409);
  packet = await action(page.request, packet, "quote.approve", {
    id: quote.id,
    revision: quote.revision,
    note: "Reviewed fictional scope",
  });
  quote = packet.state.quotes[0];
  packet = await action(page.request, packet, "quote.edit", {
    id: quote.id,
    revision: quote.revision,
    lines: quote.lines,
    discountPct: 10,
  });
  expect(packet.state.quotes[0]).toMatchObject({
    status: "Draft",
    approval: null,
    totalSen: 432000,
  });
  const stale = await post(
    page.request,
    payload(packet, "quote.queue-ready", {
      id: quote.id,
      revision: quote.revision,
    }),
  );
  expect(stale.status()).toBe(409);
  const unapproved = await post(
    page.request,
    payload(packet, "quote.queue-ready", {
      id: quote.id,
      revision: packet.state.quotes[0].revision,
    }),
  );
  expect(unapproved.status()).toBe(409);
  await page.reload();
  await expect(page.getByTestId("inquiry-quote-total")).toHaveText(
    /RM\s*4,320\.00/,
  );
  await expect(button(page, "Prepare approved proposal")).toHaveCount(0);
  await expect(button(page, "Schedule internal follow-up")).toHaveCount(0);
});

test("controlled view shares Automation persistence while scoped reset preserves other visitors and products", async ({
  request,
  playwright,
}) => {
  let packet = await qualified(request);
  const other = await playwright.request.newContext({ baseURL: origin });
  try {
    const separate = await qualified(other);
    const property = await (
      await request.get("/api/labs/property-crm/session")
    ).json();
    expect(packet.state.quotes).toHaveLength(1);
    const stale = payload(packet, "quote.approve", {
      id: packet.state.quotes[0].id,
      revision: packet.state.quotes[0].revision,
      note: "Fictional stale review",
    });
    const foreign = await post(
      request,
      payload(packet, "quote.approve", {
        id: separate.state.quotes[0].id,
        revision: separate.state.quotes[0].revision,
        note: "Fictional foreign review",
      }),
    );
    expect(foreign.status()).toBe(404);
    packet = await action(request, packet, "reset", {});
    expect(packet.state.inquiries).toEqual([]);
    expect((await post(request, stale)).status()).toBe(409);
    expect((await session(other)).state.quotes).toEqual(separate.state.quotes);
    const propertyAfter = (
      await (await request.get("/api/labs/property-crm/session")).json()
    ).state;
    const { asOf: _before, ...beforeBusiness } = property.state;
    const { asOf: _after, ...afterBusiness } = propertyAfter;
    expect(afterBusiness).toEqual(beforeBusiness);
  } finally {
    await other.dispose();
  }
});

for (const width of [375, 768, 1440])
  for (const theme of ["light", "dark"]) {
    test(`Inquiry workflow fits ${width}px and is accessible in ${theme}`, async ({
      page,
    }) => {
      test.setTimeout(90000);
      await page.setViewportSize({ width, height: 950 });
      await page.addInitScript(
        (value) => localStorage.setItem("kezuvio-theme", value),
        theme,
      );
      await page.goto(url);
      const inspect = async (name: string) => {
        expect(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth + 1,
          ),
          name,
        ).toBe(true);
        const { violations } = await new AxeBuilder({ page })
          .include(".labs-workspace")
          .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
          .analyze();
        expect(violations, name).toEqual([]);
      };
      await expect(button(page, "Save fictional inquiry")).toBeVisible();
      await inspect("fictional intake");
      await page
        .getByRole("checkbox", { name: /I am using fictional/ })
        .check();
      await button(page, "Save fictional inquiry").click();
      await expect(page.getByTestId(/^inquiry-record-/)).toBeVisible();
      await role(page, "manager");
      await button(page, "Qualify and draft quotation").click();
      await expect(page.getByTestId("inquiry-quote-total")).toBeVisible();
      await inspect("populated human review");
      await role(page, "viewer");
      await inspect("aggregate viewer");
    });
  }
