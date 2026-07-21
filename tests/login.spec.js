import { test, expect } from "@playwright/test";
import { attachConsoleGuard } from "./helpers/console-guard.js";

test.describe("Login page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
    await page.waitForLoadState("networkidle");
  });

  test("lamp starts OFF and the login card is hidden", async ({ page }) => {
    await expect(page.getByText(/tap the bulb to turn on/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /continue with google/i })).not.toBeVisible();
  });

  test("pulling the lamp reveals the login card", async ({ page }) => {
    const errors = [];
    attachConsoleGuard(page, errors);
    const shade = page.locator("svg").first();
    await shade.click();
    await expect(page.getByRole("button", { name: /continue with google/i })).toBeVisible({ timeout: 3000 });
    await expect(page.getByText(/learn smarter with gi/i)).toBeVisible();
    expect(errors).toEqual([]);
  });

  test("toggling lamp off again hides the card", async ({ page }) => {
    const shade = page.locator("svg").first();
    await shade.click();
    await expect(page.getByRole("button", { name: /continue with google/i })).toBeVisible();
    await shade.click();
    await expect(page.getByRole("button", { name: /continue with google/i })).not.toBeVisible();
  });

  test("Google sign-in button is keyboard-focusable", async ({ page }) => {
    await page.locator("svg").first().click();
    const googleBtn = page.getByRole("button", { name: /continue with google/i });
    await expect(googleBtn).toBeEnabled();
    await googleBtn.focus();
    await expect(googleBtn).toBeFocused();
  });
});