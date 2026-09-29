import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./tests/labs",
  testMatch: "**/*.spec.ts",
  // Login throttling is process-wide; exercise exhaustion in its own preview.
  testIgnore: "**/operations-rate.spec.ts",
  outputDir: "./tmp/playwright-labs",
  fullyParallel: false,
  workers: 1,
  timeout: 45000,
  reporter: [
    ["list"],
    ["html", { outputFolder: "playwright-report/labs", open: "never" }],
  ],
  use: {
    baseURL: "http://127.0.0.1:3100",
    channel: "chrome",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  webServer: {
    command: "node scripts/labs-preview.mjs",
    url: "http://127.0.0.1:3100/demo/platform-check",
    reuseExistingServer: false,
    timeout: 60000,
  },
});
