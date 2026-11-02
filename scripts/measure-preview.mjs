import { chromium } from "@playwright/test";
import fs from "node:fs/promises";
const browser = await chromium.launch({ channel: "chrome" });
const results = [];
for (const width of [1440, 375]) {
  for (let run = 1; run <= 3; run++) {
    const context = await browser.newContext({
      viewport: { width, height: 900 },
    });
    const page = await context.newPage();
    await page.addInitScript(() => {
      window.__measure = { lcp: 0, cls: 0 };
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries())
          window.__measure.lcp = entry.startTime;
      }).observe({ type: "largest-contentful-paint", buffered: true });
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries())
          if (!entry.hadRecentInput) window.__measure.cls += entry.value;
      }).observe({ type: "layout-shift", buffered: true });
    });
    await page.goto("http://127.0.0.1:3000/");
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(1000);
    const metrics = await page.evaluate(() => {
      const n = performance.getEntriesByType("navigation")[0];
      return {
        fcpMs: performance.getEntriesByName("first-contentful-paint")[0]
          ?.startTime,
        lcpMs: window.__measure.lcp,
        observedLayoutShift: window.__measure.cls,
        domContentLoadedMs: n.domContentLoadedEventEnd,
        loadMs: n.loadEventEnd,
        resourceRequests: performance.getEntriesByType("resource").length,
        transferredBytes:
          n.transferSize +
          performance
            .getEntriesByType("resource")
            .reduce((sum, e) => sum + e.transferSize, 0),
      };
    });
    results.push({ width, run, ...metrics });
    await context.close();
  }
}
await browser.close();
await fs.mkdir("tmp/qa", { recursive: true });
await fs.writeFile(
  "tmp/qa/performance.json",
  JSON.stringify(
    {
      environment:
        "Local Chrome, production build, fresh browser context per run, no CPU/network throttling. 1-second post-font observation; not field Web Vitals or Lighthouse scores.",
      results,
    },
    null,
    2,
  ),
);
console.log(JSON.stringify(results, null, 2));
