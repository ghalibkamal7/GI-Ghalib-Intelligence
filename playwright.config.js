import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  retries: 1,
  reporter: "html",
  use: {
    baseURL: "http://localhost:5173",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [
    { name: "setup", testMatch: /auth\.setup\.js/ },

    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"], storageState: "playwright/.auth/user.json" },
      dependencies: ["setup"],
      testIgnore: /(login|console-errors)\.spec\.js/,
    },
    {
      name: "chromium-unauthenticated",
      use: { ...devices["Desktop Chrome"] },
      testMatch: /(login|console-errors)\.spec\.js/,
    },
    {
      name: "mobile-chrome",
      use: { ...devices["Pixel 7"], storageState: "playwright/.auth/user.json" },
      dependencies: ["setup"],
      testMatch: /mobile\.spec\.js/,
    },
    {
      name: "mobile-safari",
      use: { ...devices["iPhone 14"], storageState: "playwright/.auth/user.json" },
      dependencies: ["setup"],
      testMatch: /mobile\.spec\.js/,
    },
  ],
  webServer: {
    command: "npm run dev",
    cwd: "../GI-Ghalib-Intelligence", // ← tera project ka naam/path yahan
    url: "http://localhost:5173",
    reuseExistingServer: true,
    timeout: 30000,
  },
});