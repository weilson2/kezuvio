import {
  test,
  expect,
  type Page,
  type APIRequestContext,
} from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import fs from "node:fs/promises";
// Interactive journeys run at the narrowest required viewport; the layout and
// accessibility matrices below explicitly set their own desktop/tablet widths.
test.use({ viewport: { width: 375, height: 900 } });
const slugs = [
  "business-website",
  "e-commerce",
  "pos",
  "booking",
  "sme-management",
];
async function ready(page: Page, slug: string) {
  await page.goto(`/demo/${slug}`);
  await expect(page.getByLabel("Demo role", { exact: true })).toBeEnabled();
  await expect(page.locator(".demo-loading")).toHaveCount(0);
}
async function session(request: APIRequestContext) {
  const res = await request.get("/api/demo/session");
  expect(res.status()).toBe(200);
  return res.json();
}
async function mutate(
  request: APIRequestContext,
  csrf: string,
  action: string,
  args: Record<string, unknown> = {},
  requestId = crypto.randomUUID(),
) {
  return request.post("/api/demo/action", {
    headers: { Origin: "http://127.0.0.1:3000" },
    data: { csrf, action, args, requestId },
  });
}
for (const width of [1920, 1440, 1366, 1024, 768, 390, 375])
  test(`demo pages fit ${width}px in both themes`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    for (const theme of ["light", "dark"]) {
      await page.addInitScript(
        (t) => localStorage.setItem("kezuvio-theme", t),
        theme,
      );
      for (const slug of slugs) {
        await ready(page, slug);
        await page.evaluate(() => document.fonts.ready);
        expect(
          await page.evaluate(
            () =>
              document.documentElement.scrollWidth <=
              document.documentElement.clientWidth + 1,
          ),
          `${slug} ${theme}`,
        ).toBeTruthy();
        await expect(page.locator("h1")).toHaveCount(1);
        await expect(page.locator(".demo-error")).toHaveCount(0);
      }
    }
  });
for (const slug of slugs)
  test(`demo accessibility ${slug}`, async ({ page }) => {
    for (const width of [1280, 375]) {
      await page.setViewportSize({ width, height: 900 });
      for (const theme of ["light", "dark"]) {
        await page.addInitScript(
          (t) => localStorage.setItem("kezuvio-theme", t),
          theme,
        );
        await ready(page, slug);
        const result = await new AxeBuilder({ page })
          .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
          .analyze();
        expect(
          result.violations,
          JSON.stringify(
            result.violations.map((v) => ({
              id: v.id,
              nodes: v.nodes.map((n) => n.target),
            })),
          ),
        ).toEqual([]);
      }
    }
  });
test("business theme and content update and reset restores the sample", async ({
  page,
}) => {
  await ready(page, "business-website");
  await page.getByLabel("Visual theme").selectOption("clay");
  await page
    .getByLabel("Hero headline")
    .fill("A fictional workshop for better ideas.");
  await page.getByRole("button", { name: "Apply to preview" }).click();
  await expect(page.locator(".sample-business")).toHaveClass(/business-clay/);
  await expect(page.locator(".sample-hero h2")).toHaveText(
    "A fictional workshop for better ideas.",
  );
  await page.getByRole("button", { name: "Prepare sample visit" }).click();
  await expect(
    page.getByText(
      "Sample visit request prepared for Sample Guest. No message was sent.",
    ),
  ).toBeVisible();
  await page.getByRole("button", { name: "Reset demos", exact: true }).click();
  await page.getByRole("button", { name: "Confirm reset" }).click();
  await expect(page.locator(".sample-hero h2")).toHaveText(
    "Space for your next good idea.",
  );
});
test("booking creates, reschedules and cancels with simulated notifications", async ({
  page,
}) => {
  await ready(page, "booking");
  await expect(
    page.getByRole("radio", { name: "10:30 · Reserved" }),
  ).toBeDisabled();
  await page.getByRole("radio", { name: "12:00", exact: true }).check();
  await page.getByRole("button", { name: "Confirm sample booking" }).click();
  await expect(page.locator(".record-list article")).toHaveCount(2);
  await expect(page.getByText("Simulated notification preview")).toBeVisible();
  await page
    .locator(".record-list article")
    .first()
    .getByRole("button", { name: "Reschedule", exact: true })
    .click();
  await page.getByRole("radio", { name: "14:00", exact: true }).check();
  await page.getByRole("button", { name: "Save rescheduled booking" }).click();
  await expect(page.locator(".record-list article").first()).toContainText(
    "14:00",
  );
  await page
    .locator(".record-list article")
    .first()
    .getByRole("button", { name: "Cancel booking", exact: true })
    .click();
  await expect(page.locator(".record-list article").first()).toContainText(
    "Cancelled",
  );
});
test("POS shift, discount, cash sale, receipt, refund and report reconcile", async ({
  page,
}) => {
  await ready(page, "pos");
  await page.getByRole("button", { name: "Open shift", exact: true }).click();
  await expect(page.locator(".shift-bar")).toContainText("Shift 1 · Open");
  await page
    .getByRole("button", { name: "Add Everyday notebook", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Increase Everyday notebook Standard" })
    .click();
  await page.getByLabel("Discount", { exact: true }).selectOption("10");
  await page.getByLabel("Cash tendered (RM)").fill("50");
  await page
    .getByRole("button", { name: "Simulate checkout", exact: true })
    .click();
  await expect(page.locator("#demo-print")).toContainText("32.40");
  await expect(page.locator("#demo-print")).toContainText("17.60");
  await fs.mkdir("tmp/qa", { recursive: true });
  await page.pdf({
    path: "tmp/qa/pos-receipt.pdf",
    format: "A4",
    printBackground: true,
  });
  await expect(page.locator(".shift-bar")).toContainText("132.40");
  await page.evaluate(() => {
    (window as any).__printed = false;
    window.print = () => {
      (window as any).__printed = true;
    };
  });
  await page.getByRole("button", { name: "Print receipt" }).click();
  expect(await page.evaluate(() => (window as any).__printed)).toBe(true);
  await page.getByRole("button", { name: "Full refund", exact: true }).click();
  await expect(page.locator("#demo-print")).toContainText("REFUNDED");
  await expect(page.locator(".shift-bar")).toContainText("100.00");
  await page.getByRole("button", { name: "Sales report", exact: true }).click();
  await expect(
    page.locator(".demo-stats").getByText("RM 0.00", { exact: true }),
  ).toHaveCount(1);
  await page.getByRole("button", { name: "Close shift", exact: true }).click();
  await expect(page.locator(".shift-bar")).toContainText("Closed");
});
test("e-commerce search, product detail, promo checkout and fulfilment", async ({
  page,
}) => {
  await ready(page, "e-commerce");
  await page.getByLabel("Search products").fill("mug");
  await expect(page.locator(".demo-product")).toHaveCount(1);
  await page.getByText("Product details", { exact: true }).click();
  await expect(page.getByText(/Item code: MUG/)).toBeVisible();
  await page
    .getByRole("button", { name: "Add Studio ceramic mug", exact: true })
    .click();
  await page.getByLabel("Sample discount code").fill("EVOLVE10");
  await page
    .getByRole("button", { name: "Simulate checkout", exact: true })
    .click();
  await expect(page.locator("#demo-print")).toContainText("28.80");
  await page.getByRole("button", { name: "Pack order", exact: true }).click();
  await page.getByRole("button", { name: "Ship order", exact: true }).click();
  await expect(page.locator(".record-list")).toContainText("Shipped");
  await page.getByRole("button", { name: "Inventory", exact: true }).click();
  await expect(
    page.getByRole("row").filter({ hasText: "Studio ceramic mug" }),
  ).toContainText("15");
});
test("SME invoice, payment, expense, contacts, stock and audit work together", async ({
  page,
}) => {
  await ready(page, "sme-management");
  await page.getByRole("button", { name: "Invoices", exact: true }).click();
  await page
    .getByRole("button", { name: "Create invoice", exact: true })
    .click();
  await expect(page.locator(".record-list")).toContainText("Unpaid");
  await page.getByRole("button", { name: "View invoice", exact: true }).click();
  await expect(page.locator("#demo-print")).toContainText("450.00");
  await fs.mkdir("tmp/qa", { recursive: true });
  await page.pdf({
    path: "tmp/qa/sample-invoice.pdf",
    format: "A4",
    printBackground: true,
  });
  await page.getByRole("button", { name: "Mark paid", exact: true }).click();
  await expect(page.locator(".demo-stats")).toContainText("1,650.00");
  await page.getByRole("button", { name: "Ledger", exact: true }).click();
  await page.getByLabel("Entry type").selectOption("Expense");
  await page.getByLabel("Amount (RM)", { exact: true }).fill("50");
  await page.getByRole("button", { name: "Add ledger entry" }).click();
  await expect(page.locator(".demo-stats")).toContainText("1,300.00");
  await page.getByRole("button", { name: "Contacts", exact: true }).click();
  await page.getByRole("button", { name: "Add sample customer" }).click();
  await expect(page.getByRole("table")).toContainText("Sample Customer 2");
  await page.getByRole("button", { name: "Stock", exact: true }).click();
  await page
    .getByLabel("New stock for Everyday notebook", { exact: true })
    .fill("8");
  await page
    .locator(".stock-grid form")
    .first()
    .getByRole("button", { name: "Update stock" })
    .click();
  await expect(page.locator(".stock-grid form").first()).toContainText(
    "Current stock: 8",
  );
  await page.getByRole("button", { name: "Audit", exact: true }).click();
  await expect(page.locator(".audit-list")).toContainText("stock to 8");
  await page.getByLabel("Demo role", { exact: true }).selectOption("viewer");
  await page.getByRole("button", { name: "Ledger", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Add ledger entry" }),
  ).toBeDisabled();
});
test("server isolation, cookie flags, CSRF, origins, roles and idempotency", async ({
  request,
  browser,
}) => {
  const a = await session(request);
  const other = await browser.newContext();
  const b = await session(other.request);
  const state = await request.storageState();
  expect(state.cookies.find((c) => c.name === "kezuvio-demo")).toMatchObject({
    httpOnly: true,
    sameSite: "Strict",
    path: "/api/demo",
  });
  expect(a.csrf).not.toBe(b.csrf);
  const id = crypto.randomUUID();
  const one = await mutate(
    request,
    a.csrf,
    "entry.add",
    {
      kind: "Income",
      amount: 1234,
      category: "Sample",
      note: "Isolation test",
    },
    id,
  );
  expect(one.status()).toBe(200);
  const duplicate = await mutate(
    request,
    a.csrf,
    "entry.add",
    {
      kind: "Income",
      amount: 1234,
      category: "Sample",
      note: "Isolation test",
    },
    id,
  );
  expect(
    (await duplicate.json()).state.entries.filter(
      (e: any) => e.note === "Isolation test",
    ),
  ).toHaveLength(1);
  expect((await session(other.request)).state.entries).toHaveLength(2);
  expect((await mutate(request, b.csrf, "reset")).status()).toBe(403);
  expect((await mutate(request, "é".repeat(48), "reset")).status()).toBe(403);
  const badOrigin = await request.post("/api/demo/action", {
    headers: { Origin: "https://unrelated.example" },
    data: {
      csrf: a.csrf,
      action: "reset",
      args: {},
      requestId: crypto.randomUUID(),
    },
  });
  expect(badOrigin.status()).toBe(403);
  await mutate(request, a.csrf, "role", { role: "viewer" });
  expect(
    (
      await mutate(request, a.csrf, "stock.adjust", { id: "mug", stock: 1 })
    ).status(),
  ).toBe(403);
  await other.close();
});
test("concurrent booking claims reserve one slot and reset is deterministic", async ({
  request,
}) => {
  const s = await session(request);
  const args = {
    service: "workspace",
    date: "2026-11-02",
    time: "09:00",
    customer: "Sample Customer C",
  };
  const results = await Promise.all([
    mutate(request, s.csrf, "booking.create", args),
    mutate(request, s.csrf, "booking.create", args),
  ]);
  expect(results.map((r) => r.status()).sort()).toEqual([200, 409]);
  const reset = await mutate(request, s.csrf, "reset");
  expect((await reset.json()).state).toEqual(s.state);
});
test("oversize, malformed and unauthenticated actions fail safely", async ({
  request,
  browser,
}) => {
  const other = await browser.newContext();
  expect((await mutate(other.request, "x", "reset")).status()).toBe(401);
  await other.close();
  const s = await session(request);
  const res = await request.post("/api/demo/action", {
    headers: {
      Origin: "http://127.0.0.1:3000",
      "Content-Type": "application/json",
    },
    data: "x".repeat(9000),
  });
  expect(res.status()).toBe(413);
  expect(
    (
      await request.post("/api/demo/action", {
        headers: {
          Origin: "http://127.0.0.1:3000",
          "Content-Type": "application/json",
        },
        data: "{",
      })
    ).status(),
  ).toBe(400);
  expect((await mutate(request, s.csrf, "does-not-exist")).status()).toBe(400);
});
test("per-session request limit returns 429 without leaking data", async ({
  request,
}) => {
  await session(request);
  let status = 200;
  for (let i = 0; i < 125; i++) {
    const res = await request.get("/api/demo/session");
    status = res.status();
    if (status === 429) break;
  }
  expect(status).toBe(429);
});
test("capture all demos at desktop and mobile", async ({ page }) => {
  await fs.mkdir("tmp/qa/demos", { recursive: true });
  for (const slug of slugs) {
    await page.setViewportSize({ width: 1440, height: 1000 });
    await ready(page, slug);
    await page.screenshot({
      path: `tmp/qa/demos/${slug}-desktop.png`,
      fullPage: true,
    });
    await page.setViewportSize({ width: 375, height: 812 });
    await page.screenshot({
      path: `tmp/qa/demos/${slug}-mobile.png`,
      fullPage: true,
    });
  }
  await page.goto("/demo");
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.screenshot({ path: "tmp/qa/demos/portal.png", fullPage: true });
});
