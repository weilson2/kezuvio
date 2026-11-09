import { test, expect, type APIRequestContext } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import {
  createDatabase,
  loadLocalEnvironment,
} from "../../packages/database/index";
const origin = "http://127.0.0.1:3100",
  base = "/api/labs/platform-check";
const action = (
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
const mutate = (request: APIRequestContext, payload: unknown) =>
  request.post(`${base}/action`, {
    headers: { Origin: origin },
    data: payload,
  });

test("HTTP isolation, cookie boundaries, permissions and malformed requests", async ({
  request,
  playwright,
}) => {
  const other = await playwright.request.newContext({ baseURL: origin });
  try {
    const a = await (await request.get(`${base}/session`)).json();
    const b = await (await other.get(`${base}/session`)).json();
    expect(a.workspaceId).not.toBe(b.workspaceId);
    const cookies = (await request.storageState()).cookies;
    expect(
      cookies.find((c) => c.name === "kezuvio-labs-platform-check"),
    ).toMatchObject({
      httpOnly: true,
      sameSite: "Strict",
      path: "/api/labs/platform-check",
    });
    // The server expires workspaces after one hour but retains the cookie marker
    // longer, so natural expiry follows the explicit401/restart flow below.
    expect(
      cookies.find((c) => c.name === "kezuvio-labs-platform-check")!.expires -
        Date.now() / 1000,
    ).toBeGreaterThan(23 * 3600);
    expect((await mutate(request, action(a, "fixture.consume"))).status()).toBe(
      403,
    );
    expect(
      (await mutate(request, { ...action(a, "reset"), csrf: b.csrf })).status(),
    ).toBe(403);
    expect(
      (
        await request.post(`${base}/action`, {
          headers: { Origin: "https://unrelated.example" },
          data: action(a, "reset"),
        })
      ).status(),
    ).toBe(403);
    expect(
      (
        await request.get(`${base}/session`, {
          headers: { "Sec-Fetch-Site": "cross-site" },
        })
      ).status(),
    ).toBe(403);
    expect(
      (
        await request.post(`${base}/action`, {
          headers: { Origin: origin, "Content-Type": "application/json" },
          data: "{",
        })
      ).status(),
    ).toBe(400);
    expect(
      (
        await request.post(`${base}/action`, {
          headers: { Origin: origin, "Content-Type": "application/json" },
          data: "x".repeat(9000),
        })
      ).status(),
    ).toBe(413);
    expect(
      (
        await mutate(request, {
          ...action(a, "reset"),
          workspaceId: b.workspaceId,
        })
      ).status(),
    ).toBe(400);
    const manager = await (
      await mutate(request, action(a, "role", { role: "manager" }))
    ).json();
    expect(manager.state.managerNote).toBeTruthy();
    const kitchen = await (
      await mutate(request, action(manager, "role", { role: "kitchen" }))
    ).json();
    expect(kitchen.state).not.toHaveProperty("managerNote");
    expect(kitchen.state).not.toHaveProperty("totalSen");
    expect((await other.get(`${base}/session`)).status()).toBe(200);
    expect((await (await other.get(`${base}/session`)).json()).generation).toBe(
      1,
    );
    expect(
      (await request.get("/api/labs/not-a-product/session")).status(),
    ).toBe(404);
  } finally {
    await other.dispose();
  }
});

test("shell persists changes, synchronizes tabs and resets just its workspace", async ({
  page,
  context,
}) => {
  await page.goto("/demo/platform-check");
  await expect(page.getByLabel("Demo role")).toBeEnabled();
  await page.getByLabel("Demo role").selectOption("cashier");
  await page.getByRole("button", { name: "Consume sample stock" }).click();
  await expect(page.getByTestId("fixture-stock")).toHaveText("0");
  const tab = await context.newPage();
  await tab.goto("/demo/platform-check");
  await expect(tab.getByTestId("fixture-consumed")).toHaveText("1");
  await page.reload();
  await expect(page.getByTestId("fixture-consumed")).toHaveText("1");
  await page.getByRole("button", { name: "Reset demo", exact: true }).click();
  await page.getByRole("button", { name: "Keep my data" }).click();
  await expect(
    page.getByRole("button", { name: "Reset demo", exact: true }),
  ).toBeFocused();
  await page.getByRole("button", { name: "Reset demo", exact: true }).click();
  await page.getByRole("button", { name: "Confirm reset" }).click();
  await expect(page.getByTestId("fixture-stock")).toHaveText("1");
  await tab.bringToFront();
  await expect(tab.getByTestId("fixture-consumed")).toHaveText("0", {
    timeout: 12000,
  });
});

test("expired session requires explicit restart and network failure offers retry", async ({
  page,
}) => {
  await page.goto("/demo/platform-check");
  await expect(page.getByLabel("Demo role")).toBeEnabled();
  loadLocalEnvironment("test");
  const db = createDatabase(process.env.MIGRATION_DATABASE_URL);
  try {
    const packet = await (await page.request.get(`${base}/session`)).json();
    await db.$executeRawUnsafe(
      "UPDATE platform.sessions SET expires_at=clock_timestamp()-interval '1 second' WHERE workspace_id=$1::uuid",
      packet.workspaceId,
    );
  } finally {
    await db.$disconnect();
  }
  await page
    .getByRole("button", { name: "Refresh workspace", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Start fresh workspace" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Start fresh workspace" }).click();
  await expect(page.getByTestId("fixture-stock")).toHaveText("1");
  await page.route("**/api/labs/platform-check/session", (route) =>
    route.abort(),
  );
  await page
    .getByRole("button", { name: "Refresh workspace", exact: true })
    .click();
  await expect(page.locator(".labs-error")).toContainText("Unable to load");
  await page.unroute("**/api/labs/platform-check/session");
  await page
    .getByRole("button", { name: "Refresh workspace", exact: true })
    .click();
  await expect(page.locator(".labs-error")).toHaveCount(0);
});

test("foundation is responsive and accessible in both themes", async ({
  page,
}) => {
  for (const width of [375, 768, 1440])
    for (const theme of ["light", "dark"]) {
      await page.setViewportSize({ width, height: 950 });
      await page.addInitScript(
        (t) => localStorage.setItem("kezuvio-theme", t),
        theme,
      );
      await page.goto("/demo/platform-check");
      await expect(page.getByLabel("Demo role")).toBeEnabled();
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
    }
});
