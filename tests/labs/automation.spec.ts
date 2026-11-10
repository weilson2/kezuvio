import {
  test,
  expect,
  type Page,
  type APIRequestContext,
} from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const origin = "http://127.0.0.1:3100";
const product = "automation-hub";
const base = `/api/labs/${product}`;
const url = "/demo/automation-hub";
const sample = {
  businessName: "Sample Orchid Studio",
  contactName: "Sample Aina",
  email: "aina@example.test",
  brief: "A fictional website with online booking.",
  budgetSen: 500000,
  timelineWeeks: 6,
};
const payload = (
  packet: any,
  type: string,
  args: Record<string, unknown> = {},
) => ({
  type,
  args,
  csrf: packet.csrf,
  generation: packet.generation,
  requestId: crypto.randomUUID(),
});
const post = (request: APIRequestContext, data: unknown, name = product) =>
  request.post(`/api/labs/${name}/action`, {
    headers: { Origin: origin },
    data,
  });
async function session(request: APIRequestContext, name = product) {
  const response = await request.get(`/api/labs/${name}/session`);
  expect(response.status()).toBe(200);
  return response.json();
}
async function mutate(
  request: APIRequestContext,
  packet: any,
  type: string,
  args: Record<string, unknown> = {},
  name = product,
) {
  const response = await post(request, payload(packet, type, args), name);
  expect(response.status(), await response.text()).toBe(200);
  return response.json();
}
async function analysis(request: APIRequestContext) {
  let packet = await session(request);
  packet = await mutate(request, packet, "inquiry.submit", sample);
  packet = await mutate(request, packet, "role", { role: "manager" });
  packet = await mutate(request, packet, "task.start", {
    id: packet.state.tasks[0].id,
  });
  packet = await mutate(request, packet, "task.finish", {
    id: packet.state.tasks[0].id,
    runId: packet.state.tasks[0].runId,
    fail: false,
  });
  return packet;
}
async function role(page: Page, value: string) {
  await page.getByLabel("Demo role").selectOption(value);
  await expect(page.getByLabel("Demo role")).toBeEnabled();
  await expect(page.getByLabel("Demo role")).toHaveValue(value);
}
async function refresh(page: Page) {
  await page
    .getByRole("button", { name: "Refresh workspace", exact: true })
    .click();
  await expect(page.locator(".labs-error")).toHaveCount(0);
  await expect(page.getByLabel("Demo role")).toBeEnabled();
}

async function fillInquiry(page: Page) {
  const form = page.getByRole("form", { name: "New inquiry", exact: true });
  await form
    .getByLabel("Business name", { exact: true })
    .fill(sample.businessName);
  await form
    .getByLabel("Contact name", { exact: true })
    .fill(sample.contactName);
  await form.getByLabel("Sample email", { exact: true }).fill(sample.email);
  await form.getByLabel("Project brief", { exact: true }).fill(sample.brief);
  await form.getByLabel("Budget (RM)", { exact: true }).fill("5000");
  await form.getByLabel("Timeline (weeks)", { exact: true }).fill("6");
}

async function submitInquiry(page: Page) {
  await page.goto(url);
  await fillInquiry(page);
  await page
    .getByRole("button", { name: "Submit sample inquiry", exact: true })
    .click();
  await expect(
    page.getByRole("region", { name: "Inquiry 1", exact: true }),
  ).toContainText(sample.businessName);
  return session(page.request);
}

test("inquiry, explicit analysis, edited quotation, human approval, ready copy and follow-up persist", async ({
  page,
}) => {
  test.setTimeout(90000);
  await page.goto("/demo");
  await expect(page.locator(`a[href="${url}"]`)).toHaveCount(1);
  await page.locator(`a[href="${url}"]`).click();
  await fillInquiry(page);
  await page
    .getByRole("button", { name: "Submit sample inquiry", exact: true })
    .click();
  await expect(
    page.getByRole("region", { name: "Inquiry 1", exact: true }),
  ).toContainText(sample.businessName);
  let saved = await session(page.request);
  expect(saved.state.tasks[0].status).toBe("Queued");
  expect(saved.state.analyses).toEqual([]);
  await role(page, "manager");
  await page.getByRole("button", { name: "Workflow", exact: true }).click();
  const analyze = page.getByTestId(
    `automation-task-${saved.state.tasks[0].id}`,
  );
  await analyze
    .getByRole("button", { name: "Start task", exact: true })
    .click();
  await expect(analyze).toContainText("Running");
  await analyze.getByLabel("Simulate failed run").check();
  await analyze
    .getByRole("button", { name: "Complete run", exact: true })
    .click();
  await expect(analyze).toContainText("Failed");
  saved = await session(page.request);
  expect(saved.state.analyses).toEqual([]);
  expect(saved.state.quotes).toEqual([]);
  await analyze
    .getByRole("button", { name: "Retry task", exact: true })
    .click();
  await analyze
    .getByRole("button", { name: "Start task", exact: true })
    .click();
  await analyze.getByLabel("Simulate failed run").uncheck();
  await analyze
    .getByRole("button", { name: "Complete run", exact: true })
    .click();
  await expect(analyze).toContainText("Succeeded");
  await page.getByRole("button", { name: "Quotations", exact: true }).click();
  const quote = page.getByRole("region", {
    name: "Quotation for inquiry 1",
    exact: true,
  });
  await expect(quote).toContainText("3,300.00");
  await expect(
    quote.getByRole("button", { name: "Prepare ready copy", exact: true }),
  ).toHaveCount(0);
  await quote
    .getByRole("button", { name: "Edit quotation", exact: true })
    .click();
  await quote.getByLabel("Unit price (RM) 1", { exact: true }).fill("301.05");
  await quote.getByLabel("Discount (%)", { exact: true }).fill("10");
  await quote
    .getByRole("button", { name: "Save quotation", exact: true })
    .click();
  await expect(quote).toContainText("2,970.94");
  saved = await session(page.request);
  expect(saved.state.quotes[0]).toMatchObject({
    subtotalSen: 330105,
    discountSen: 33011,
    totalSen: 297094,
    status: "Draft",
  });
  await quote
    .getByLabel("Review note", { exact: true })
    .fill("Revise the fictional scope before approval.");
  await quote
    .getByRole("button", { name: "Reject quotation", exact: true })
    .click();
  await expect(quote).toContainText("Rejected");
  await quote
    .getByLabel("Review note", { exact: true })
    .fill("Reviewed sample scope, rates and discount.");
  await quote
    .getByRole("button", { name: "Approve quotation", exact: true })
    .click();
  await expect(quote).toContainText("Approved");
  await quote
    .getByRole("button", { name: "Prepare ready copy", exact: true })
    .click();
  saved = await session(page.request);
  const readyId = saved.state.tasks.find(
    (task: any) => task.kind === "Prepare ready",
  ).id;
  expect(saved.state.quotes[0].status).toBe("Approved");
  await page.getByRole("button", { name: "Workflow", exact: true }).click();
  const ready = page.getByTestId(`automation-task-${readyId}`);
  await ready.getByRole("button", { name: "Start task", exact: true }).click();
  await ready
    .getByRole("button", { name: "Complete run", exact: true })
    .click();
  await expect(ready).toContainText("Succeeded");
  await page.reload();
  await page.getByRole("button", { name: "Quotations", exact: true }).click();
  await expect(quote).toContainText("Ready");
  await expect(quote).toContainText("2,970.94");
  saved = await session(page.request);
  expect(saved.state.totals.readyQuotes).toBe(1);
  expect(saved.state.quotes).toHaveLength(1);

  await page.getByRole("button", { name: "Follow-ups", exact: true }).click();
  await page
    .getByLabel("Inquiry", { exact: true })
    .selectOption(saved.state.inquiries[0].id);
  const yesterdayMyt = new Date(Date.now() - 86400000 + 8 * 3600000)
    .toISOString()
    .slice(0, 16);
  await page.getByLabel("Due (MYT)", { exact: true }).fill(yesterdayMyt);
  await page
    .getByLabel("Follow-up note", { exact: true })
    .fill("Internal fictional scope review reminder");
  await page
    .getByRole("button", { name: "Schedule follow-up", exact: true })
    .click();
  const followup = page.getByRole("region", {
    name: "Follow-up for inquiry 1",
    exact: true,
  });
  await expect(followup).toContainText("Overdue");
  saved = await session(page.request);
  expect(saved.state.followups[0]).toMatchObject({
    status: "Scheduled",
    overdue: true,
  });
  await page
    .getByLabel("Completion note", { exact: true })
    .fill("Recorded a fictional review; nothing was sent.");
  await page
    .getByRole("button", { name: "Complete follow-up", exact: true })
    .click();
  await expect(followup).toContainText("Completed");
  saved = await session(page.request);
  expect(saved.state.followups[0]).toMatchObject({
    status: "Completed",
    overdue: false,
  });
  expect(saved.state.totals.overdueFollowups).toBe(0);
  await role(page, "customer");
  await page.getByRole("button", { name: "My inquiries", exact: true }).click();
  await expect(
    page.getByRole("region", { name: "Inquiry 1", exact: true }),
  ).toContainText(sample.businessName);
  expect((await session(page.request)).state.followups).toEqual([]);
  await role(page, "viewer");
  await expect(
    page.getByRole("button", { name: "Workflow", exact: true }),
  ).toHaveCount(0);
  expect((await session(page.request)).state.inquiries).toEqual([]);
});

test("lost run completion response recovers one analysis and one draft without repeating work", async ({
  page,
  context,
}) => {
  const saved = await submitInquiry(page);
  await role(page, "manager");
  await page.getByRole("button", { name: "Workflow", exact: true }).click();
  const task = page.getByTestId(`automation-task-${saved.state.tasks[0].id}`);
  await task.getByRole("button", { name: "Start task", exact: true }).click();
  await page.route(
    "**/api/labs/automation-hub/action",
    async (route) => {
      await route.fetch();
      await route.abort();
    },
    { times: 1 },
  );
  await task.getByRole("button", { name: "Complete run", exact: true }).click();
  await expect(page.locator(".labs-error")).toContainText(
    /connection|refresh/i,
  );
  await expect(
    task.getByRole("button", { name: "Complete run", exact: true }),
  ).toBeDisabled();
  await refresh(page);
  await expect(task).toContainText("Succeeded");
  const recovered = await session(page.request);
  expect(recovered.state.analyses).toHaveLength(1);
  expect(recovered.state.quotes).toHaveLength(1);
  expect(recovered.state.tasks[0].attempts).toBe(1);
  const tab = await context.newPage();
  await tab.goto(url);
  await role(tab, "customer");
  await page.bringToFront();
  await expect(page.getByLabel("Demo role")).toHaveValue("customer", {
    timeout: 12000,
  });
  await page.getByRole("button", { name: "My inquiries", exact: true }).click();
  await expect(
    page.getByRole("region", { name: "Inquiry 1", exact: true }),
  ).toContainText(sample.businessName);
});

test("Automation HTTP duplicate runs, capabilities and independent visitors are isolated", async ({
  request,
  playwright,
}) => {
  let packet = await session(request);
  const other = await playwright.request.newContext({ baseURL: origin });
  try {
    const visitor = await session(other);
    expect(visitor.workspaceId).not.toBe(packet.workspaceId);
    expect(
      (await request.storageState()).cookies.find(
        (cookie) => cookie.name === "kezuvio-labs-automation-hub",
      ),
    ).toMatchObject({ httpOnly: true, sameSite: "Strict", path: base });
    const submit = payload(packet, "inquiry.submit", sample);
    const submissions = await Promise.all([
      post(request, submit),
      post(request, submit),
    ]);
    for (const response of submissions) expect(response.status()).toBe(200);
    packet = await session(request);
    expect(packet.state.inquiries).toHaveLength(1);
    expect(packet.state.tasks).toHaveLength(1);
    expect(packet.state.tasks[0].status).toBe("Queued");
    expect(
      (
        await post(
          request,
          payload(packet, "task.start", { id: packet.state.tasks[0].id }),
        )
      ).status(),
    ).toBe(403);
    expect((await post(other, submit)).status()).toBe(403);
    expect(
      (
        await post(request, {
          ...submit,
          args: { ...sample, businessName: "Changed sample" },
        })
      ).status(),
    ).toBe(409);
    packet = await mutate(request, packet, "role", { role: "manager" });
    const start = payload(packet, "task.start", {
      id: packet.state.tasks[0].id,
    });
    for (const response of await Promise.all([
      post(request, start),
      post(request, start),
    ]))
      expect(response.status()).toBe(200);
    packet = await session(request);
    expect(packet.state.tasks[0].attempts).toBe(1);
    const finish = payload(packet, "task.finish", {
      id: packet.state.tasks[0].id,
      runId: packet.state.tasks[0].runId,
      fail: false,
    });
    for (const response of await Promise.all([
      post(request, finish),
      post(request, finish),
    ]))
      expect(response.status()).toBe(200);
    packet = await session(request);
    expect(packet.state.analyses).toHaveLength(1);
    expect(packet.state.quotes).toHaveLength(1);
    expect(packet.state.quotes[0]).toMatchObject({
      status: "Draft",
      totalSen: 330000,
    });
    expect(
      packet.state.history.filter(
        (item: any) => item.event === "Run succeeded",
      ),
    ).toHaveLength(1);
    expect((await session(other)).state.inquiries).toEqual([]);
    packet = await mutate(request, packet, "role", { role: "customer" });
    expect(packet.state.tasks[0].runId).toBeNull();
    expect(packet.state).not.toHaveProperty("rules");
    expect(packet.state).not.toHaveProperty("history");
    packet = await mutate(request, packet, "role", { role: "viewer" });
    expect(packet.state.inquiries).toEqual([]);
    expect(packet.state.quotes).toEqual([]);
    expect(packet.state.tasks).toEqual([]);
    expect(packet.state.totals.inquiries).toBe(1);
    expect(
      (await post(request, payload(packet, "inquiry.submit", sample))).status(),
    ).toBe(403);
  } finally {
    await other.dispose();
  }
});

test("approval belongs to one revision; edits invalidate a running ready task and retries apply one effect", async ({
  request,
}) => {
  let packet = await analysis(request);
  let quote = packet.state.quotes[0];
  expect(
    (
      await post(
        request,
        payload(packet, "quote.queue-ready", {
          id: quote.id,
          revision: quote.revision,
        }),
      )
    ).status(),
  ).toBe(409);
  packet = await mutate(request, packet, "quote.approve", {
    id: quote.id,
    revision: quote.revision,
    note: "Reviewed fictional scope",
  });
  quote = packet.state.quotes[0];
  packet = await mutate(request, packet, "quote.queue-ready", {
    id: quote.id,
    revision: quote.revision,
  });
  packet = await mutate(request, packet, "task.start", {
    id: packet.state.tasks[0].id,
  });
  const oldRun = packet.state.tasks[0];
  packet = await mutate(request, packet, "quote.edit", {
    id: quote.id,
    revision: quote.revision,
    lines: quote.lines,
    discountPct: 10,
  });
  expect(packet.state.quotes[0]).toMatchObject({
    status: "Draft",
    approval: null,
    totalSen: 297000,
  });
  packet = await mutate(request, packet, "task.finish", {
    id: oldRun.id,
    runId: oldRun.runId,
    fail: false,
  });
  expect(packet.state.tasks[0].status).toBe("Failed");
  expect(packet.state.quotes[0].status).toBe("Draft");
  expect(
    (
      await post(request, payload(packet, "task.retry", { id: oldRun.id }))
    ).status(),
  ).toBe(409);
  quote = packet.state.quotes[0];
  packet = await mutate(request, packet, "quote.approve", {
    id: quote.id,
    revision: quote.revision,
    note: "Reviewed revised scope",
  });
  quote = packet.state.quotes[0];
  packet = await mutate(request, packet, "quote.queue-ready", {
    id: quote.id,
    revision: quote.revision,
  });
  const taskId = packet.state.tasks[0].id;
  packet = await mutate(request, packet, "task.start", { id: taskId });
  packet = await mutate(request, packet, "task.finish", {
    id: taskId,
    runId: packet.state.tasks[0].runId,
    fail: true,
  });
  expect(packet.state.quotes[0].status).toBe("Approved");
  packet = await mutate(request, packet, "task.retry", { id: taskId });
  packet = await mutate(request, packet, "task.start", { id: taskId });
  packet = await mutate(request, packet, "task.finish", {
    id: taskId,
    runId: packet.state.tasks[0].runId,
    fail: false,
  });
  expect(packet.state.tasks[0]).toMatchObject({
    status: "Succeeded",
    attempts: 2,
  });
  expect(packet.state.quotes[0].status).toBe("Ready");
  expect(packet.state.totals.readyQuotes).toBe(1);
  expect(
    (
      await post(request, payload(packet, "task.retry", { id: taskId }))
    ).status(),
  ).toBe(409);
  expect(
    packet.state.history.find((item: any) => item.event === "Run succeeded")
      .note,
  ).toContain("Nothing was sent");
});

test("Automation reset rejects stale running completion and preserves Cafe, Commerce and another visitor", async ({
  request,
  playwright,
}) => {
  let packet = await session(request);
  packet = await mutate(request, packet, "inquiry.submit", sample);
  packet = await mutate(request, packet, "role", { role: "manager" });
  packet = await mutate(request, packet, "task.start", {
    id: packet.state.tasks[0].id,
  });
  const stale = payload(packet, "task.finish", {
    id: packet.state.tasks[0].id,
    runId: packet.state.tasks[0].runId,
    fail: false,
  });
  const other = await playwright.request.newContext({ baseURL: origin });
  try {
    let visitor = await session(other);
    visitor = await mutate(other, visitor, "inquiry.submit", {
      ...sample,
      businessName: "Independent sample",
    });
    let cafe = await session(request, "cafe-pos");
    cafe = await mutate(
      request,
      cafe,
      "order.submit",
      { table: 1, lines: [{ itemId: "kopi-iced", qty: 1 }] },
      "cafe-pos",
    );
    let commerce = await session(request, "commerce-studio");
    commerce = await mutate(
      request,
      commerce,
      "cart.set",
      { productId: "notebook", qty: 1, version: commerce.state.cart.version },
      "commerce-studio",
    );
    packet = await mutate(request, packet, "reset");
    expect((await post(request, stale)).status()).toBe(409);
    expect(
      (
        await post(request, {
          ...stale,
          generation: packet.generation,
          requestId: crypto.randomUUID(),
        })
      ).status(),
    ).toBe(404);
    expect(packet.state.tasks).toEqual([]);
    expect(packet.state.quotes).toEqual([]);
    expect((await session(other)).state.inquiries).toEqual(
      visitor.state.inquiries,
    );
    expect((await session(request, "cafe-pos")).state).toEqual(cafe.state);
    expect((await session(request, "commerce-studio")).state).toEqual(
      commerce.state,
    );
  } finally {
    await other.dispose();
  }
});

test("pricing rule edits persist and affect future quotation drafts without rewriting existing quotes", async ({
  page,
}) => {
  const original = await analysis(page.request);
  await page.goto(url);
  await page
    .getByRole("button", { name: "Pricing rules", exact: true })
    .click();
  await page
    .getByLabel("Discovery & requirements rate (RM)", { exact: true })
    .fill("301.00");
  await page
    .getByRole("button", { name: "Save pricing rules", exact: true })
    .click();
  await expect(page.locator(".labs-status")).toContainText("Pricing");
  await page.reload();
  await page
    .getByRole("button", { name: "Pricing rules", exact: true })
    .click();
  await expect(
    page.getByLabel("Discovery & requirements rate (RM)", { exact: true }),
  ).toHaveValue("301.00");
  await role(page, "customer");
  await fillInquiry(page);
  await page
    .getByRole("button", { name: "Submit sample inquiry", exact: true })
    .click();
  await expect(
    page.getByRole("region", { name: "Inquiry 2", exact: true }),
  ).toBeVisible();
  const queued = await session(page.request);
  await role(page, "manager");
  await page.getByRole("button", { name: "Workflow", exact: true }).click();
  const task = page.getByTestId(`automation-task-${queued.state.tasks[0].id}`);
  await task.getByRole("button", { name: "Start task", exact: true }).click();
  await task.getByRole("button", { name: "Complete run", exact: true }).click();
  await expect(task).toContainText("Succeeded");
  const saved = await session(page.request);
  expect(saved.state.rules.version).toBe(2);
  expect(
    saved.state.quotes.find(
      (quote: any) => quote.id === original.state.quotes[0].id,
    ),
  ).toEqual(original.state.quotes[0]);
  expect(saved.state.quotes[0]).toMatchObject({
    pricingRulesVersion: 2,
    totalSen: 330100,
  });
});

for (const width of [375, 768, 1440])
  for (const theme of ["light", "dark"]) {
    test(`Automation populated views are accessible at ${width}px in ${theme}`, async ({
      page,
    }, testInfo) => {
      test.setTimeout(90000);
      await page.setViewportSize({ width, height: 950 });
      await page.addInitScript(
        (value) => localStorage.setItem("kezuvio-theme", value),
        theme,
      );
      let packet = await analysis(page.request);
      packet = await mutate(page.request, packet, "followup.create", {
        inquiryId: packet.state.inquiries[0].id,
        dueAt: new Date(Date.now() - 86400000).toISOString(),
        note: "Fictional overdue review reminder",
      });
      await page.goto(url);
      await expect(page.getByLabel("Demo role")).toHaveValue("manager");
      const inspect = async (name: string) => {
        expect(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth + 1,
          ),
          name,
        ).toBe(true);
        expect(
          (
            await new AxeBuilder({ page })
              .include(".labs-workspace")
              .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
              .analyze()
          ).violations,
          name,
        ).toEqual([]);
      };
      for (const name of [
        "Overview",
        "Inquiries",
        "Quotations",
        "Workflow",
        "Follow-ups",
        "Pricing rules",
      ]) {
        await page.getByRole("button", { name, exact: true }).click();
        await inspect(name);
        if (name === "Quotations") {
          await page.screenshot({
            path: testInfo.outputPath("quotation.png"),
            fullPage: true,
          });
          await page
            .getByRole("button", { name: "Edit quotation", exact: true })
            .click();
          await inspect("Quotation editor");
        }
        if (name === "Overview")
          await page.screenshot({
            path: testInfo.outputPath("overview.png"),
            fullPage: true,
          });
      }
      await role(page, "customer");
      await inspect("New inquiry form");
      await page
        .getByRole("button", { name: "My inquiries", exact: true })
        .click();
      await inspect("Customer inquiry status");
      await role(page, "viewer");
      await inspect("Viewer overview");
    });
  }
