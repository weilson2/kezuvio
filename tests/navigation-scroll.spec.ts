import { test, expect } from "@playwright/test";

for (const width of [1920, 375]) {
  test(`Concepts navigation opens at the top at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 920 });
    await page.goto("/");
    if (width === 375) {
      await page.getByRole("button", { name: "Open menu" }).click();
    }
    await page.getByRole("navigation", { name: "Main navigation" })
      .getByRole("link", { name: "Concepts", exact: true }).click();
    await expect(page).toHaveURL(/\/portfolio$/);
    // Check after the CSS animation window: an immediate assertion can miss
    // the delayed jump that originally hid the page heading.
    await page.waitForTimeout(1000);
    expect(await page.evaluate(() => window.scrollY)).toBe(0);
    await expect(page.locator("h1")).toBeInViewport();

    await page.goto("/");
    await page.locator(".site-footer")
      .getByRole("link", { name: "Concept portfolio" }).click();
    await expect(page).toHaveURL(/\/portfolio$/);
    await page.waitForTimeout(1000);
    expect(await page.evaluate(() => window.scrollY)).toBe(0);

    // Explicit section links must still reach their requested concept.
    await page.goto("/");
    await page.locator('a[href="/portfolio#alur"]').click();
    await expect(page).toHaveURL(/\/portfolio#alur$/);
    await expect(page.locator("#alur h2")).toBeInViewport();
    expect(await page.evaluate(() => window.scrollY)).toBeGreaterThan(0);
  });
}
