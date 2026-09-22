import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { developmentAnalyticsKey } from "../apps/website/lib/development-analytics";
import {
  studioProducts,
  draftPackages,
} from "../apps/website/lib/studio-content";

test("Studio portfolio presents six working products, original screenshots and honest scope links", async ({
  page,
  request,
}) => {
  await page.goto("/portfolio");
  for (const product of studioProducts) {
    const card = page.getByRole("article").filter({
      has: page.getByRole("heading", { name: product.name, exact: true }),
    });
    await expect(card).toHaveCount(1);
    await expect(card).toContainText(product.audience[0]);
    await expect(card).toContainText(product.limitations[0]);
    await expect(
      card.getByRole("link", { name: "Try Live Demo", exact: true }),
    ).toHaveAttribute("href", `/demo/${product.slug}`);
    await card.locator("summary").click();
    await expect(
      card.getByText(product.limitations[0], { exact: true }),
    ).toBeVisible();
    await expect(
      card.locator(`a[href="/services/${product.serviceSlug}"]`),
    ).toBeVisible();
    expect((await request.get("/demo/" + product.slug)).status()).toBe(200);
    expect((await request.get(product.screenshot)).status()).toBe(200);
  }
  for (const path of [
    "/demo/business-website",
    "/demo/e-commerce",
    "/demo/pos",
    "/demo/booking",
    "/demo/sme-management",
  ])
    expect((await request.get(path)).status()).toBe(200);
  expect(
    (await request.get("/demo/qr-ordering", { maxRedirects: 0 })).status(),
  ).toBe(308);
  const images = page.locator("main img");
  for (const image of await images.all()) {
    await image.scrollIntoViewIfNeeded();
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
});

test("Seven draft packages retain scope assumptions and the quotation flow prepares a device-local brief", async ({
  page,
}) => {
  const posts: string[] = [];
  page.on("request", (request) => {
    if (request.method() === "POST") posts.push(request.url());
  });
  await page.goto("/pricing");
  for (const item of draftPackages) {
    const card = page.getByRole("article").filter({
      has: page.getByRole("heading", { name: item.name, exact: true }),
    });
    await expect(card).toContainText(item.priceLabel);
    await expect(card).toContainText(item.scope[0]);
    await expect(card).toContainText(item.exclusions[0]);
    await expect(card).toContainText(item.revisionAllowance);
  }
  const landing = page.getByRole("article").filter({
    has: page.getByRole("heading", { name: "Landing Page", exact: true }),
  });
  await landing.locator('a[href*="request-quotation"]').click();
  await expect(page).toHaveURL(/\/request-quotation/);
  await expect(
    page.getByText("Requested draft package:", { exact: false }),
  ).toContainText("Landing Page");
  await page.getByLabel("Your name *", { exact: true }).fill("Fictional Aina");
  await page
    .getByLabel("Email address *", { exact: true })
    .fill("aina@example.test");
  await page
    .getByLabel("Tell us about your idea *", { exact: true })
    .fill(
      "A fictional Malaysian studio needs a focused landing page to explain its services.",
    );
  await page.getByRole("checkbox").check();
  await page
    .getByRole("button", { name: "Prepare my enquiry", exact: true })
    .click();
  await expect(page.locator("pre")).toContainText(
    "Draft package: Landing Page",
  );
  await expect(page.locator("pre")).toContainText(
    "Prepared locally. Not sent.",
  );
  const download = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "Download brief", exact: true })
    .click();
  expect((await download).suggestedFilename()).toBe(
    "kezuvio-project-enquiry.txt",
  );
  expect(posts).toEqual([]);
});

for (const width of [375, 768, 1440])
  for (const theme of ["light", "dark"]) {
    test(`Studio pages remain accessible and fit ${width}px in ${theme}`, async ({
      page,
    }) => {
      test.setTimeout(120000);
      await page.setViewportSize({ width, height: 950 });
      await page.addInitScript(
        (value) => localStorage.setItem("kezuvio-theme", value),
        theme,
      );
      for (const path of [
        "/",
        "/about",
        "/portfolio",
        "/pricing",
        "/faq",
        "/request-quotation",
        "/services/ai-automation",
      ]) {
        await page.goto(path);
        await expect(page.locator("h1")).toHaveCount(1);
        expect(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth + 1,
          ),
          path,
        ).toBe(true);
        const { violations } = await new AxeBuilder({ page })
          .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
          .analyze();
        expect(violations, path).toEqual([]);
      }
    });
  }

test("Studio metadata, structured answers, sitemap and indexing controls describe only actual public content", async ({
  page,
  request,
}) => {
  for (const path of [
    "/pricing",
    "/faq",
    "/portfolio",
    "/services/ai-automation",
    "/request-quotation",
  ]) {
    await page.goto(path);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      "href",
      new RegExp(path + "$"),
    );
    const description = await page
      .locator('meta[name="description"]')
      .getAttribute("content");
    await expect(
      page.locator('meta[property="og:description"]'),
    ).toHaveAttribute("content", description!);
    await expect(
      page.locator('meta[name="twitter:description"]'),
    ).toHaveAttribute("content", description!);
  }
  await page.goto("/faq");
  const schema = await page
    .locator('script[type="application/ld+json"]')
    .allTextContents();
  const faq = schema
    .map((value) => JSON.parse(value))
    .find((value) => value["@type"] === "FAQPage");
  expect(faq.mainEntity).toHaveLength(13);
  for (const path of [
    "/demo/property-crm",
    "/demo/accounting-cloud",
    "/demo/interior-3d",
  ]) {
    await page.goto(path);
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
      "content",
      /noindex/,
    );
  }
  const robots = await (await request.get("/robots.txt")).text();
  expect(robots).toContain("Disallow: /api/");
  expect(robots).toContain("Disallow: /operations");
  const sitemap = await (await request.get("/sitemap.xml")).text();
  expect(sitemap).toContain("/pricing");
  expect(sitemap).toContain("/faq");
  expect(sitemap).not.toContain("/demo/platform-check");
  expect(sitemap).not.toContain("/api/");
  expect(sitemap).not.toContain("/inquiry-workflow");
  const hidden = await request.get("/api/labs/platform-check/session");
  expect(hidden.status()).toBe(404);
  expect(hidden.headers()["x-robots-tag"]).toBe("noindex, nofollow");
});

test("Development events capture local intent without storing query values or form content", async ({
  page,
}) => {
  const external: string[] = [];
  page.on("request", (request) => {
    if (
      !request.url().startsWith("http://127.0.0.1:3000") &&
      !request.url().startsWith("data:")
    )
      external.push(request.url());
  });
  await page.goto("/pricing");
  await expect
    .poll(() =>
      page.evaluate(
        (key) =>
          JSON.parse(localStorage.getItem(key) || "[]").some(
            (e: { name: string }) => e.name === "pricing_view",
          ),
        developmentAnalyticsKey,
      ),
    )
    .toBe(true);
  await page
    .getByRole("navigation", { name: "Main navigation" })
    .getByRole("link", { name: "Demos", exact: true })
    .click();
  await page.locator('a[href="/demo/cafe-pos"]').first().click();
  await expect
    .poll(() =>
      page.evaluate(
        (key) =>
          JSON.parse(localStorage.getItem(key) || "[]").some(
            (e: { name: string }) => e.name === "demo_visit",
          ),
        developmentAnalyticsKey,
      ),
    )
    .toBe(true);
  await page.goto("/request-quotation?email=do-not-log-this-query");
  await page
    .getByLabel("Your name *", { exact: true })
    .fill("Private Example Name");
  await page
    .getByLabel("Email address *", { exact: true })
    .fill("private-person@example.test");
  await page
    .getByLabel("Tell us about your idea *", { exact: true })
    .fill(
      "Private example requirements must stay out of development analytics records.",
    );
  await page.getByRole("checkbox").check();
  await page
    .getByRole("button", { name: "Prepare my enquiry", exact: true })
    .click();
  await page.evaluate(() => {
    const a = document.createElement("a");
    a.href = "https://wa.me/0000000";
    a.onclick = (e) => e.preventDefault();
    document.body.append(a);
    a.click();
    a.remove();
  });
  const raw = await page.evaluate(
    (key) => localStorage.getItem(key) || "[]",
    developmentAnalyticsKey,
  );
  const events = JSON.parse(raw);
  for (const name of [
    "pricing_view",
    "try_demo_click",
    "demo_visit",
    "contact_submission",
    "quotation_inquiry",
    "whatsapp_click",
  ])
    expect(
      events.some((event: { name: string }) => event.name === name),
      name,
    ).toBe(true);
  for (const value of [
    "Private Example",
    "private-person",
    "do-not-log",
    "0000000",
    "requirements",
  ])
    expect(raw).not.toContain(value);
  expect(
    events.every(
      (event: object) => Object.keys(event).sort().join(",") === "at,name,path",
    ),
  ).toBe(true);
  expect(external).toEqual([]);
});
