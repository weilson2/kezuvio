import {
  test,
  expect,
  type Page,
  type APIRequestContext,
} from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const base = "/api/labs/commerce-studio";
const origin = "http://127.0.0.1:3100";
const url = "/demo/commerce-studio";
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
const post = (
  request: APIRequestContext,
  data: unknown,
  product = "commerce-studio",
) =>
  request.post(`/api/labs/${product}/action`, {
    headers: { Origin: origin },
    data,
  });
async function session(request: APIRequestContext) {
  const response = await request.get(`${base}/session`);
  expect(response.status()).toBe(200);
  return response.json();
}
async function mutate(
  request: APIRequestContext,
  packet: any,
  type: string,
  args: Record<string, unknown> = {},
) {
  const response = await post(request, payload(packet, type, args));
  expect(response.status(), await response.text()).toBe(200);
  return response.json();
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
async function addNotebook(page: Page) {
  await page.goto(url);
  await page
    .getByRole("button", { name: "Add Everyday notebook", exact: true })
    .click();
  await expect(page.getByTestId("commerce-cart-total")).toContainText("18.00");
}

test("Commerce shopping, declined payment, coupon, persisted order, fulfilment and refund reconcile", async ({
  page,
}) => {
  await page.goto("/demo");
  await expect(page.locator(`a[href="${url}"]`)).toHaveCount(1);
  await page.locator(`a[href="${url}"]`).click();
  await page.getByLabel("Search products").fill("notebook");
  await expect(
    page.getByRole("button", { name: "Add Studio ceramic mug", exact: true }),
  ).toHaveCount(0);
  await page.getByText("Product details", { exact: true }).click();
  await expect(page.locator("details[open]")).toContainText(
    "fictional A5 notebook",
  );
  await page
    .getByRole("button", { name: "Add Everyday notebook", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Increase Everyday notebook", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Decrease Everyday notebook", exact: true })
    .click();
  await expect(page.getByTestId("commerce-cart-total")).toContainText("18.00");
  await page.reload();
  await expect(page.getByTestId("commerce-cart-total")).toContainText("18.00");
  await page
    .getByRole("button", { name: "Increase Everyday notebook", exact: true })
    .click();
  await page.getByLabel("Sample discount code").fill("EVOLVE10");
  await expect(page.getByTestId("commerce-cart-total")).toContainText("32.40");
  await page.getByLabel("Simulate a declined payment").check();
  await page
    .getByRole("button", { name: "Simulate checkout", exact: true })
    .click();
  await expect(page.locator(".labs-error")).toContainText(/declined/i);
  let saved = await session(page.request);
  expect(saved.state.orders).toEqual([]);
  expect(
    saved.state.products.find((p: any) => p.id === "notebook").onHand,
  ).toBe(24);
  expect(saved.state.cart.lines[0].qty).toBe(2);
  await refresh(page);
  await page.getByLabel("Simulate a declined payment").uncheck();
  await page
    .getByRole("button", { name: "Simulate checkout", exact: true })
    .click();
  await page.getByRole("button", { name: "My orders", exact: true }).click();
  const order = page.getByRole("region", { name: "Order 1", exact: true });
  await expect(order).toContainText("32.40");
  await expect(order).toContainText("Paid");
  await page.reload();
  await page.getByRole("button", { name: "My orders", exact: true }).click();
  await expect(order).toContainText("32.40");
  saved = await session(page.request);
  expect(saved.state.orders).toHaveLength(1);
  expect(saved.state.cart.lines).toEqual([]);
  expect(
    saved.state.products.find((p: any) => p.id === "notebook").onHand,
  ).toBe(22);

  await role(page, "manager");
  await page.getByRole("button", { name: "Orders", exact: true }).click();
  for (const name of ["Pack order", "Ship order", "Mark delivered"])
    await order.getByRole("button", { name, exact: true }).click();
  await expect(order).toContainText("Delivered");
  await order
    .getByRole("button", { name: "Refund order", exact: true })
    .click();
  await expect(order.getByLabel("Restock unshipped items")).toHaveCount(0);
  await expect(order).toContainText(
    "Shipped or delivered items cannot return to stock",
  );
  await order
    .getByRole("button", { name: "Issue full mock refund", exact: true })
    .click();
  await expect(order).toContainText(/refunded/i);
  await page
    .getByRole("button", { name: "Seller dashboard", exact: true })
    .click();
  await expect(page.getByTestId("commerce-net")).toContainText("0.00");
  await expect(page.getByTestId("commerce-refunds")).toContainText("32.40");
  await page.getByRole("button", { name: "Inventory", exact: true }).click();
  await expect(page.getByTestId("commerce-stock-notebook")).toHaveText("22");
});

test("seller manages products, adjusts stock by keyboard and restocks an unshipped refund", async ({
  page,
}) => {
  await page.goto(url);
  await role(page, "manager");
  await page.getByRole("button", { name: "Products", exact: true }).click();
  const create = page.getByRole("form", { name: "Add product", exact: true });
  await create
    .getByLabel("Product name", { exact: true })
    .fill("Sample desk tray");
  await create.getByLabel("Category", { exact: true }).fill("Home");
  await create
    .getByLabel("Description", { exact: true })
    .fill("A fictional tray for this demonstration.");
  await create.getByLabel("Price (RM)", { exact: true }).fill("12.35");
  await create.getByLabel("Opening stock", { exact: true }).fill("3");
  await create
    .getByRole("button", { name: "Create product", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Edit Sample desk tray", exact: true }),
  ).toBeVisible();
  let saved = await session(page.request);
  const productId = saved.state.products.find(
    (p: any) => p.name === "Sample desk tray",
  ).id;
  await page
    .getByRole("button", { name: "Edit Sample desk tray", exact: true })
    .click();
  const edit = page.getByRole("form", { name: "Edit product", exact: true });
  await edit
    .getByLabel("Product name", { exact: true })
    .fill("Sample organiser tray");
  await edit.getByLabel("Price (RM)", { exact: true }).fill("14.50");
  await edit.getByRole("button", { name: "Save product", exact: true }).click();
  await page.getByRole("button", { name: "Inventory", exact: true }).click();
  const stock = page.getByRole("region", {
    name: "Stock for Sample organiser tray",
    exact: true,
  });
  await stock.getByLabel("Stock change", { exact: true }).fill("2");
  await stock
    .getByLabel("Adjustment note", { exact: true })
    .fill("Counted two fictional units");
  await stock.getByLabel("Adjustment note", { exact: true }).press("Enter");
  await expect(page.getByTestId(`commerce-stock-${productId}`)).toHaveText("5");
  await page.reload();
  await page.getByRole("button", { name: "Inventory", exact: true }).click();
  await expect(page.getByTestId(`commerce-stock-${productId}`)).toHaveText("5");
  await page.getByRole("button", { name: "Products", exact: true }).click();
  await page
    .getByRole("button", { name: "Archive Sample organiser tray", exact: true })
    .click();
  await expect(
    page.getByRole("button", {
      name: "Restore Sample organiser tray",
      exact: true,
    }),
  ).toBeVisible();
  await role(page, "customer");
  await page.getByLabel("Search products").fill("organiser");
  await expect(
    page.getByRole("button", {
      name: "Add Sample organiser tray",
      exact: true,
    }),
  ).toHaveCount(0);
  await role(page, "manager");
  await page.getByRole("button", { name: "Products", exact: true }).click();
  await page
    .getByRole("button", { name: "Restore Sample organiser tray", exact: true })
    .click();
  await role(page, "customer");
  await page.getByLabel("Search products").fill("organiser");
  await page
    .getByRole("button", { name: "Add Sample organiser tray", exact: true })
    .click();
  await expect(page.getByTestId("commerce-cart-total")).toContainText("14.50");
  await page
    .getByRole("button", { name: "Simulate checkout", exact: true })
    .click();
  await expect(
    page.getByRole("region", { name: "Order 1", exact: true }),
  ).toContainText("14.50");
  saved = await session(page.request);
  expect(
    saved.state.products.find((product: any) => product.id === productId)
      .onHand,
  ).toBe(4);
  await role(page, "manager");
  await page.getByRole("button", { name: "Orders", exact: true }).click();
  const order = page.getByRole("region", { name: "Order 1", exact: true });
  await order
    .getByRole("button", { name: "Refund order", exact: true })
    .click();
  await order.getByLabel("Restock unshipped items").check();
  await order
    .getByRole("button", { name: "Issue full mock refund", exact: true })
    .click();
  await expect(order).toContainText("Items returned to sample stock");
  await page.getByRole("button", { name: "Inventory", exact: true }).click();
  await expect(page.getByTestId(`commerce-stock-${productId}`)).toHaveText("5");
  await page.getByRole("button", { name: "Reset demo", exact: true }).click();
  await page.getByRole("button", { name: "Keep my data", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Reset demo", exact: true }),
  ).toBeFocused();
  await page.getByRole("button", { name: "Reset demo", exact: true }).click();
  await page
    .getByRole("button", { name: "Confirm reset", exact: true })
    .click();
  await expect(page.locator(".labs-status")).toContainText("Workspace reset");
  saved = await session(page.request);
  expect(saved.state.products).toHaveLength(6);
  expect(saved.state.cart.lines).toEqual([]);
});

test("lost checkout response recovers one persisted order and synchronizes a second tab", async ({
  page,
  context,
}) => {
  await addNotebook(page);
  await page.route(
    "**/api/labs/commerce-studio/action",
    async (route) => {
      await route.fetch();
      await route.abort();
    },
    { times: 1 },
  );
  await page
    .getByRole("button", { name: "Simulate checkout", exact: true })
    .click();
  await expect(page.locator(".labs-error")).toContainText(
    /connection|refresh/i,
  );
  await expect(
    page.getByRole("button", { name: "Simulate checkout", exact: true }),
  ).toBeDisabled();
  await refresh(page);
  const saved = await session(page.request);
  expect(saved.state.orders).toHaveLength(1);
  expect(
    saved.state.products.find((p: any) => p.id === "notebook").onHand,
  ).toBe(23);
  await page.getByRole("button", { name: "My orders", exact: true }).click();
  await expect(
    page.getByRole("region", { name: "Order 1", exact: true }),
  ).toContainText("Paid");
  const tab = await context.newPage();
  await tab.goto(url);
  await role(tab, "manager");
  await tab.getByRole("button", { name: "Orders", exact: true }).click();
  await tab.getByRole("button", { name: "Pack order", exact: true }).click();
  await page.bringToFront();
  await expect(page.getByLabel("Demo role")).toHaveValue("manager", {
    timeout: 12000,
  });
  await page.getByRole("button", { name: "Orders", exact: true }).click();
  await expect(
    page.getByRole("region", { name: "Order 1", exact: true }),
  ).toContainText("Packed");
});

test("Commerce HTTP capabilities, duplicate checkout, visitor isolation and product-scoped reset", async ({
  request,
  playwright,
}) => {
  let saved = await session(request);
  const other = await playwright.request.newContext({ baseURL: origin });
  try {
    let second = await session(other);
    expect(second.workspaceId).not.toBe(saved.workspaceId);
    expect(
      (await request.storageState()).cookies.find(
        (c) => c.name === "kezuvio-labs-commerce-studio",
      ),
    ).toMatchObject({ httpOnly: true, sameSite: "Strict", path: base });
    expect(
      (
        await post(
          request,
          payload(saved, "inventory.adjust", {
            id: "notebook",
            delta: 1,
            note: "Not a seller",
          }),
        )
      ).status(),
    ).toBe(403);
    saved = await mutate(request, saved, "cart.set", {
      productId: "notebook",
      qty: 2,
      version: saved.state.cart.version,
    });
    second = await mutate(other, second, "cart.set", {
      productId: "mug",
      qty: 1,
      version: second.state.cart.version,
    });
    const checkout = payload(saved, "checkout", {
      cartVersion: saved.state.cart.version,
      catalogVersion: saved.state.catalogVersion,
      code: "EVOLVE10",
      method: "Card",
      decline: false,
    });
    const duplicate = await Promise.all([
      post(request, checkout),
      post(request, checkout),
    ]);
    for (const response of duplicate) expect(response.status()).toBe(200);
    saved = await session(request);
    expect(saved.state.orders).toHaveLength(1);
    expect(
      saved.state.products.find((p: any) => p.id === "notebook").onHand,
    ).toBe(22);
    expect(
      (
        await post(request, {
          ...checkout,
          args: { ...checkout.args, code: "" },
        })
      ).status(),
    ).toBe(409);
    expect((await post(other, checkout)).status()).toBe(403);
    let cafe = await (await request.get("/api/labs/cafe-pos/session")).json();
    const cafeResponse = await post(
      request,
      payload(cafe, "order.submit", {
        table: 1,
        lines: [{ itemId: "kopi-iced", qty: 1 }],
      }),
      "cafe-pos",
    );
    expect(cafeResponse.status()).toBe(200);
    cafe = await cafeResponse.json();
    saved = await mutate(request, saved, "reset");
    expect(saved.state.orders).toEqual([]);
    expect((await post(request, checkout)).status()).toBe(409);
    const untouched = await session(other);
    expect(untouched.generation).toBe(second.generation);
    expect(untouched.state.cart).toEqual(second.state.cart);
    expect(
      (await (await request.get("/api/labs/cafe-pos/session")).json()).state,
    ).toEqual(cafe.state);
    saved = await mutate(request, saved, "role", { role: "viewer" });
    expect(saved.state).not.toHaveProperty("movements");
    expect(
      (
        await post(
          request,
          payload(saved, "product.archive", { id: "notebook", active: false }),
        )
      ).status(),
    ).toBe(403);
    expect(
      (
        await post(
          request,
          payload(saved, "cart.set", {
            productId: "notebook",
            qty: 1,
            version: saved.state.cart.version,
          }),
        )
      ).status(),
    ).toBe(403);
  } finally {
    await other.dispose();
  }
});

for (const width of [375, 768, 1440])
  for (const theme of ["light", "dark"]) {
    test(`Commerce populated views are accessible at ${width}px in ${theme}`, async ({
      page,
    }, testInfo) => {
      test.setTimeout(90000);
      await page.setViewportSize({ width, height: 950 });
      await page.addInitScript(
        (value) => localStorage.setItem("kezuvio-theme", value),
        theme,
      );
      await addNotebook(page);
      await page
        .getByRole("button", { name: "Simulate checkout", exact: true })
        .click();
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
      for (const name of ["Shop catalogue", "My orders"]) {
        await page.getByRole("button", { name, exact: true }).click();
        await inspect(name);
        if (name === "Shop catalogue")
          await page.screenshot({
            path: testInfo.outputPath("customer-catalogue.png"),
            fullPage: true,
          });
      }
      await role(page, "manager");
      for (const name of [
        "Seller dashboard",
        "Products",
        "Inventory",
        "Orders",
      ]) {
        await page.getByRole("button", { name, exact: true }).click();
        await inspect(name);
        if (name === "Products") {
          await page
            .getByRole("button", {
              name: "Edit Everyday notebook",
              exact: true,
            })
            .click();
          await inspect("Edit product");
        }
        if (name === "Seller dashboard")
          await page.screenshot({
            path: testInfo.outputPath("seller-dashboard.png"),
            fullPage: true,
          });
        if (name === "Orders") {
          await page
            .getByRole("button", { name: "Refund order", exact: true })
            .click();
          await inspect("Refund confirmation");
        }
      }
      await role(page, "viewer");
      await inspect("Viewer dashboard");
    });
  }
