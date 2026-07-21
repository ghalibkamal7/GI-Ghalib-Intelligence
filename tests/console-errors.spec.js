import { test, expect } from "@playwright/test";
import { attachConsoleGuard } from "./helpers/console-guard.js";

test.describe("Console health", () => {
  test("Login page loads with no console errors", async ({ page }) => {
    const errors = [];
    attachConsoleGuard(page, errors);
    await page.goto("/login");
    await page.waitForLoadState("networkidle");
    expect(errors, `Unexpected console errors:\n${errors.join("\n")}`).toEqual([]);
  });

  test("Root redirect (unauthenticated) resolves without errors", async ({ page }) => {
    const errors = [];
    attachConsoleGuard(page, errors);
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    expect(errors, `Unexpected console errors:\n${errors.join("\n")}`).toEqual([]);
  });
});