import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  workers: 1,
  timeout: 60000,
  outputDir: "artifacts/browser/test-results",
  reporter: [
    ["list"],
    ["html", { outputFolder: "artifacts/browser/report", open: "never" }],
  ],
  use: {
    browserName: "chromium",
    headless: true,
    baseURL: "http://127.0.0.1:5174",
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
  },
  webServer: {
    command: "npm run dev -- --port 5174",
    url: "http://127.0.0.1:5174",
    reuseExistingServer: false,
    timeout: 30000,
  },
});
