import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import fs from "node:fs/promises";
const routes = [
  "/",
  "/services",
  "/services/web-development",
  "/services/mobile-apps",
  "/services/pos-systems",
  "/services/qr-ordering",
  "/services/custom-software",
  "/services/saas",
  "/portfolio",
  "/about",
  "/contact",
  "/demo",
  "/privacy",
  "/terms",
  "/brand",
];
for (const width of [1920, 1440, 1366, 1024, 768, 390, 375]) {
  test(`all routes fit ${width}px in both themes`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    for (const theme of ["light", "dark"]) {
      await page.addInitScript(
        (value) => localStorage.setItem("kezuvio-theme", value),
        theme,
      );
      for (const route of routes) {
        const response = await page.goto(route);
        expect(response?.status(), route).toBe(200);
        await page.evaluate(() => document.fonts.ready);
        await expect(page.locator("h1")).toHaveCount(1);
        await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
        const overflow = await page.evaluate(() => ({
          scroll: document.documentElement.scrollWidth,
          client: document.documentElement.clientWidth,
        }));
        expect(overflow.scroll, `${route} ${theme}`).toBeLessThanOrEqual(
          overflow.client + 1,
        );
      }
    }
  });
}
for (const route of routes) {
  test(`accessible ${route}`, async ({ page }) => {
    for (const width of [1280, 375]) {
      await page.setViewportSize({ width, height: 900 });
      for (const theme of ["light", "dark"]) {
        await page.addInitScript(
          (value) => localStorage.setItem("kezuvio-theme", value),
          theme,
        );
        await page.goto(route);
        await page.evaluate(() => document.fonts.ready);
        const scan = await new AxeBuilder({ page })
          .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
          .analyze();
        expect(
          scan.violations,
          JSON.stringify(
            scan.violations.map((v) => ({
              id: v.id,
              nodes: v.nodes.map((n) => n.target),
            })),
          ),
        ).toEqual([]);
      }
    }
  });
}
test("mobile navigation, theme persistence and keyboard skip link", async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("/");
  await page.keyboard.press("Tab");
  await expect(
    page.getByRole("link", { name: "Skip to content" }),
  ).toBeFocused();
  await page.getByRole("button", { name: "Open menu" }).click();
  await expect(
    page.getByRole("navigation", { name: "Main navigation" }),
  ).toBeVisible();
  await page
    .getByRole("navigation", { name: "Main navigation" })
    .getByRole("link", { name: "Services", exact: true })
    .focus();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("button", { name: "Open menu" })).toBeFocused();
  await page.getByRole("button", { name: "Open menu" }).click();
  await page
    .getByRole("navigation", { name: "Main navigation" })
    .getByRole("link", { name: "Services", exact: true })
    .click();
  await expect(page).toHaveURL(/\/services$/);
  await expect(page.getByRole("button", { name: "Open menu" })).toBeVisible();
  const theme = await page.locator("html").getAttribute("data-theme");
  await page.getByRole("button", { name: /Switch to .* theme/ }).click();
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute(
    "data-theme",
    theme === "dark" ? "light" : "dark",
  );
});
test("enquiry validates locally, produces a brief, downloads, and invalidates stale results", async ({
  page,
  context,
}) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  const requests: string[] = [];
  page.on("request", (r) => {
    if (r.method() === "POST") requests.push(r.url());
  });
  await page.goto("/contact?service=qr-ordering");
  await expect(page.locator("#service")).toHaveValue("qr-ordering");
  await page.getByRole("button", { name: "Prepare my enquiry" }).click();
  await expect(page.locator("#name")).toBeFocused();
  await expect(page.locator("form [role=alert]")).toBeVisible();
  await page.getByLabel("Your name *").fill("Sample Visitor");
  await page.getByLabel("Email address *").fill("visitor@example.test");
  await page
    .getByLabel("Tell us about your idea *")
    .fill("A fictional café would like to explore a clear digital menu.");
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Prepare my enquiry" }).click();
  await expect(
    page.getByRole("heading", { name: "Your enquiry is ready." }),
  ).toBeVisible();
  await expect(page.locator("pre")).toContainText("QR ordering");
  await page.getByRole("button", { name: "Copy brief" }).click();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toContain(
    "Sample Visitor",
  );
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download brief" }).click();
  expect((await download).suggestedFilename()).toBe(
    "kezuvio-project-enquiry.txt",
  );
  expect(requests).toEqual([]);
  await page.getByLabel("Your name *").fill("Changed Name");
  await expect(
    page.getByRole("heading", { name: "Your enquiry is ready." }),
  ).toHaveCount(0);
});
test("brand variants download real assets and component feedback works", async ({
  page,
  request,
  context,
}) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.goto("/brand");
  await page.getByRole("button", { name: "Copy Indigo #6366F1" }).click();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(
    "#6366F1",
  );
  for (const layout of ["horizontal", "stacked", "icon"])
    for (const treatment of ["light", "dark", "mono-dark", "mono-light"]) {
      await page.getByLabel("Lockup").selectOption(layout);
      await page
        .getByLabel("Treatment", { exact: true })
        .selectOption(treatment);
      const href = await page
        .getByRole("link", { name: "Download SVG" })
        .getAttribute("href");
      const response = await request.get(href!);
      expect(response.ok()).toBeTruthy();
      expect(await response.text()).toContain("<svg");
    }
  await page.getByRole("button", { name: "Primary action" }).click();
  await expect(
    page.getByText("Action confirmed. This is local component feedback."),
  ).toBeVisible();
  await page.getByRole("button", { name: "Reset example" }).click();
  await expect(
    page.getByText("Use the primary action to preview a feedback state."),
  ).toBeVisible();
});
test("internal links resolve, metadata exists, assets load and errors stay absent", async ({
  page,
  request,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  const links = new Set<string>();
  for (const route of routes) {
    await page.goto(route);
    await expect(page).toHaveTitle(/Kezuvio/);
    expect(
      await page.locator('meta[name="description"]').getAttribute("content"),
    ).toBeTruthy();
    expect(
      await page.locator('meta[property="og:image"]').getAttribute("content"),
    ).toContain("social-preview.png");
    const hrefs = await page
      .locator("a[href]")
      .evaluateAll((nodes) =>
        nodes
          .map((n) => n.getAttribute("href")!)
          .filter((h) => h.startsWith("/")),
      );
    hrefs.forEach((h) => links.add(h.split("#")[0]));
    // Product screenshots load lazily; bring each into view before verifying decoding.
    for (const image of await page.locator("img").all()) {
      if (await image.isVisible()) await image.scrollIntoViewIfNeeded();
      await expect
        .poll(() =>
          image.evaluate(
            (node) =>
              (node as HTMLImageElement).complete &&
              (node as HTMLImageElement).naturalWidth > 0,
          ),
        )
        .toBe(true);
    }
  }
  for (const href of links)
    expect((await request.get(href)).status(), href).toBe(200);
  expect((await request.get("/a-page-that-does-not-exist")).status()).toBe(404);
  expect(errors).toEqual([]);
});
test("capture representative desktop and mobile views", async ({ page }) => {
  await fs.mkdir("tmp/qa", { recursive: true });
  for (const [route, name] of [
    ["/", "home"],
    ["/brand", "brand"],
    ["/contact", "contact"],
    ["/portfolio", "portfolio"],
  ]) {
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.goto(route);
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({
      path: `tmp/qa/${name}-desktop.png`,
      fullPage: true,
    });
    await page.setViewportSize({ width: 375, height: 812 });
    await page.screenshot({
      path: `tmp/qa/${name}-mobile.png`,
      fullPage: true,
    });
  }
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/");
  await page.getByRole("button", { name: "Switch to dark theme" }).click();
  await page.screenshot({ path: "tmp/qa/home-dark.png", fullPage: true });
});
