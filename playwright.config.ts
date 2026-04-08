import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/games",
  timeout: 30000,
  retries: 1,
  use: {
    baseURL: "http://localhost:3000",
    screenshot: "on",
    video: "on-first-retry",
    headless: true,
  },
  reporter: [["list"], ["html", { open: "never" }]],
  // Use fetch-based tests (no browser needed)
  projects: [{ name: "node", use: {} }],
});
