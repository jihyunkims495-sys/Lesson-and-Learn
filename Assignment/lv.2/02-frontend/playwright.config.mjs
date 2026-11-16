import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./tests",
  workers: 1,
  use: {
    baseURL: "http://127.0.0.1:8766",
    viewport: { width: 1440, height: 1000 },
    video: { mode: "on", size: { width: 1440, height: 1000 } },
    launchOptions: { slowMo: 400 },
  },
  webServer: {
    command: "node serve.cjs",
    url: "http://127.0.0.1:8766/clone/",
    reuseExistingServer: !process.env.CI,
  },
  reporter: [
    ["list"],
    ["html", { outputFolder: "test-results/report", open: "never" }],
  ],
  outputDir: "test-results/runs",
});
