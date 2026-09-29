import { defineConfig } from "@playwright/test";
import labs from "./playwright.labs.config";
export default defineConfig({
  ...labs,
  testMatch: "**/operations-rate.spec.ts",
  testIgnore: [],
  outputDir: "./tmp/playwright-operations-rate",
  reporter: [["list"]],
});
