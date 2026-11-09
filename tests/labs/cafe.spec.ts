import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import sharp from "sharp";
import jsQR from "jsqr";

const base = "/api/labs/cafe-pos",
  origin = "http://127.0.0.1:3100";
async function role(page: Page, value: string) {
  await page.getByLabel("Demo role").selectOption(value);
  await expect(page.getByLabel("Demo role")).toBeEnabled();
  await expect(page.getByLabel("Demo role")).toHaveValue(value);
}
async function order(page: Page) {
  await page.goto("/demo/cafe-pos?table=4");
  await expect(page.getByLabel("Your table")).toHaveValue("4");
  await page
    .getByRole("button", { name: "Add Kopi susu Iced", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Increase Kopi susu Iced", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Place demo order", exact: true })
    .click();
  await expect(page.locator(".labs-status")).toContainText("Order accepted");
}

test("portal offers one café demo and the retired QR link redirects with its table", async ({
  page,
  request,
}) => {
  await page.goto("/demo");
  await expect(page.locator('a[href="/demo/cafe-pos"]')).toHaveCount(1);
  await expect(page.locator('a[href="/demo/qr-ordering"]')).toHaveCount(0);
  const response = await request.get("/demo/qr-ordering?table=4", {
    maxRedirects: 0,
  });
  expect(response.status()).toBe(308);
  expect(response.headers().location).toBe("/demo/cafe-pos?table=4");
  await page.goto("/demo/qr-ordering?table=4");
  await expect(page).toHaveURL(/\/demo\/cafe-pos\?table=4$/);
  await expect(page.getByLabel("Your table")).toHaveValue("4");
});

test("table ordering, kitchen lifecycle, decline, settlement, receipt, inventory, refund and reset", async ({
  page,
}, testInfo) => {
  await order(page);
  await role(page, "kitchen");
  for (const name of ["Start preparing", "Mark ready", "Mark served"])
    await page.getByRole("button", { name, exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Mark served", exact: true }),
  ).toHaveCount(0);
  await role(page, "cashier");
  await page.getByRole("button", { name: "Open shift", exact: true }).click();
  await page.getByLabel("Discount (%)").fill("10");
  await page.getByLabel("Cash tendered (RM)").fill("20");
  await expect(page.getByTestId("cafe-amount-due")).toContainText("13.50");
  await page.getByLabel("Simulate a declined payment").check();
  await page
    .getByRole("button", { name: "Settle demo payment", exact: true })
    .click();
  await expect(page.locator(".labs-error")).toContainText(/declined|failed/i);
  let packet = await (await page.request.get(`${base}/session`)).json();
  expect(
    packet.state.menu.find((i: any) => i.id === "kopi-iced"),
  ).toMatchObject({ onHand: 20, reserved: 2 });
  expect(packet.state.orders[0].paid).toBe(false);
  await page
    .getByRole("button", { name: "Refresh workspace", exact: true })
    .click();
  await expect(page.locator(".labs-error")).toHaveCount(0);
  await page.getByLabel("Simulate a declined payment").uncheck();
  await page
    .getByRole("button", { name: "Settle demo payment", exact: true })
    .click();
  const receipt = page.getByRole("region", { name: "Receipt for order 1" });
  await expect(receipt).toContainText("13.50");
  await expect(receipt).toContainText("6.50");
  await page.evaluate(() => {
    (window as any).__printed = 0;
    window.print = () => {
      (window as any).__printed++;
    };
  });
  await page
    .getByRole("button", { name: "Print receipt", exact: true })
    .click();
  expect(await page.evaluate(() => (window as any).__printed)).toBe(1);
  await page.emulateMedia({ media: "print" });
  await expect(receipt).toBeVisible();
  await expect(page.locator(".labs-toolbar")).toBeHidden();
  await expect(page.locator(".cafe-order-list")).toBeHidden();
  await page.screenshot({
    path: testInfo.outputPath("receipt-print.png"),
    fullPage: true,
  });
  await page.emulateMedia({ media: "screen" });
  await page.reload();
  await expect(receipt).toContainText("13.50");
  await role(page, "manager");
  await page.getByRole("button", { name: "Inventory", exact: true }).click();
  await expect(page.getByTestId("stock-kopi-iced")).toHaveText("18");
  await page.getByLabel("New on-hand stock · Kopi susu · Iced").fill("19");
  const note = page.getByLabel("Adjustment note · Kopi susu · Iced");
  await note.fill("Counted one additional sample unit");
  await note.press("Enter");
  await expect(page.getByTestId("stock-kopi-iced")).toHaveText("19");
  await page.reload();
  await page.getByRole("button", { name: "Inventory", exact: true }).click();
  await expect(page.getByTestId("stock-kopi-iced")).toHaveText("19");
  await page.getByRole("button", { name: "Sales report", exact: true }).click();
  await expect(page.getByTestId("report-net-sales")).toContainText("13.50");
  await page.getByRole("button", { name: "Cashier", exact: true }).click();
  await page
    .getByRole("button", { name: "Refund full payment", exact: true })
    .click();
  await expect(receipt).toContainText(/refund/i);
  await page.getByRole("button", { name: "Sales report", exact: true }).click();
  await expect(page.getByTestId("report-refunds")).toContainText("13.50");
  await expect(page.getByTestId("report-net-sales")).toContainText("0.00");
  await page.getByRole("button", { name: "Reset demo", exact: true }).click();
  await page
    .getByRole("button", { name: "Confirm reset", exact: true })
    .click();
  await expect(page.locator(".labs-status")).toContainText("Workspace reset");
  await page.getByRole("button", { name: "Inventory", exact: true }).click();
  await expect(page.getByTestId("stock-kopi-iced")).toHaveText("20");
  packet = await (await page.request.get(`${base}/session`)).json();
  expect(packet.state.orders).toEqual([]);
  expect(packet.state.shifts).toEqual([]);
});

test("committed order with lost response recovers without duplicates and synchronizes tabs", async ({
  page,
  context,
}) => {
  await page.goto("/demo/cafe-pos");
  await page
    .getByRole("button", { name: "Add Kopi susu Iced", exact: true })
    .click();
  await page.route(
    "**/api/labs/cafe-pos/action",
    async (route) => {
      await route.fetch();
      await route.abort();
    },
    { times: 1 },
  );
  await page
    .getByRole("button", { name: "Place demo order", exact: true })
    .click();
  await expect(page.locator(".labs-error")).toContainText(
    /refresh|connection|network|response/i,
  );
  await expect(
    page.getByRole("button", { name: "Place demo order", exact: true }),
  ).toBeDisabled();
  await page
    .getByRole("button", { name: "Refresh workspace", exact: true })
    .click();
  await expect(page.locator(".labs-error")).toHaveCount(0);
  const saved = await (await page.request.get(`${base}/session`)).json();
  expect(saved.state.orders).toHaveLength(1);
  const tab = await context.newPage();
  await tab.goto("/demo/cafe-pos");
  await expect(
    tab.getByRole("heading", { name: "Your orders", exact: true }),
  ).toBeVisible();
  await role(tab, "kitchen");
  await tab
    .getByRole("button", { name: "Start preparing", exact: true })
    .click();
  await page.bringToFront();
  await expect(page.getByLabel("Demo role")).toHaveValue("kitchen", {
    timeout: 12000,
  });
  await expect(
    page.getByRole("button", { name: "Mark ready", exact: true }),
  ).toBeVisible();
});

test("HTTP duplicate settlement and workspace isolation", async ({
  request,
  playwright,
}) => {
  let packet = await (await request.get(`${base}/session`)).json();
  const mutate = async (type: string, args: any = {}) => {
    const response = await request.post(`${base}/action`, {
      headers: { Origin: origin },
      data: {
        type,
        args,
        csrf: packet.csrf,
        generation: packet.generation,
        requestId: crypto.randomUUID(),
      },
    });
    expect(response.status()).toBe(200);
    packet = await response.json();
    return packet;
  };
  await mutate("order.submit", {
    table: 1,
    lines: [{ itemId: "kopi-iced", qty: 1 }],
  });
  const id = packet.state.orders[0].id;
  await mutate("role", { role: "cashier" });
  await mutate("shift.open", { openingSen: 0 });
  const payload = {
    type: "payment.settle",
    args: { id, method: "QR", discountPct: 0, tenderSen: 0 },
    csrf: packet.csrf,
    generation: packet.generation,
    requestId: crypto.randomUUID(),
  };
  const results = await Promise.all(
    [1, 2].map(() =>
      request.post(`${base}/action`, {
        headers: { Origin: origin },
        data: payload,
      }),
    ),
  );
  for (const response of results) expect(response.status()).toBe(200);
  packet = await results[0].json();
  expect(packet.state.totals.netSen).toBe(750);
  expect(packet.state.menu[0]).toMatchObject({ onHand: 19, reserved: 0 });
  expect(
    (
      await request.post(`${base}/action`, {
        headers: { Origin: origin },
        data: { ...payload, requestId: crypto.randomUUID() },
      })
    ).status(),
  ).toBe(409);
  const other = await playwright.request.newContext({ baseURL: origin });
  try {
    const second = await (await other.get(`${base}/session`)).json();
    expect(second.workspaceId).not.toBe(packet.workspaceId);
    expect(second.state.orders).toEqual([]);
    expect(
      (
        await other.post(`${base}/action`, {
          headers: { Origin: origin },
          data: payload,
        })
      ).status(),
    ).toBe(403);
    await mutate("reset");
    expect((await (await other.get(`${base}/session`)).json()).generation).toBe(
      1,
    );
  } finally {
    await other.dispose();
  }
});

test("QR is decodable, table-scoped and uses configured localhost origin", async ({
  request,
}) => {
  const response = await request.get(`${base}/qr?table=4`, {
    headers: { Host: "untrusted.example" },
  });
  expect(response.status()).toBe(200);
  expect(response.headers()["content-type"]).toContain("image/svg+xml");
  const { data, info } = await sharp(await response.body())
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  expect(jsQR(new Uint8ClampedArray(data), info.width, info.height)?.data).toBe(
    `${origin}/demo/cafe-pos?table=4`,
  );
  expect((await request.get(`${base}/qr?table=99`)).status()).toBe(400);
});

for (const width of [375, 768, 1440])
  for (const theme of ["light", "dark"]) {
    test(`Cafe roles and views accessible at ${width}px in ${theme}`, async ({
      page,
    }, testInfo) => {
      test.setTimeout(90000);
      await page.setViewportSize({ width, height: 950 });
      await page.addInitScript(
        (t) => localStorage.setItem("kezuvio-theme", t),
        theme,
      );
      await page.goto("/demo/cafe-pos");
      await expect(page.getByLabel("Demo role")).toBeEnabled();
      for (const current of [
        "customer",
        "kitchen",
        "cashier",
        "manager",
        "viewer",
      ]) {
        await role(page, current);
        const areas =
          current === "manager"
            ? ["Table menu", "Kitchen", "Cashier", "Inventory", "Sales report"]
            : [];
        for (const area of [null, ...areas]) {
          if (area)
            await page
              .getByRole("navigation", { name: "Cafe work areas" })
              .getByRole("button", {
                name: area === "Kitchen" ? /^Kitchen/ : area,
                exact: area !== "Kitchen",
              })
              .click();
          expect(
            await page.evaluate(
              () => document.documentElement.scrollWidth <= innerWidth + 1,
            ),
          ).toBe(true);
          expect(
            (
              await new AxeBuilder({ page })
                .include(".labs-workspace")
                .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
                .analyze()
            ).violations,
          ).toEqual([]);
          if (current === "customer" || area === "Inventory")
            await page.screenshot({
              path: testInfo.outputPath(`${current}-${area ?? "menu"}.png`),
              fullPage: true,
            });
        }
      }
    });
  }
