import { test, expect } from "@playwright/test";
import { attachConsoleGuard } from "./helpers/console-guard.js";

test.describe("Toolbar features", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
  });

  test("Focus timer opens and counts down", async ({ page }) => {
    const errors = [];
    attachConsoleGuard(page, errors);
    await page.getByRole("button", { name: /^focus$/i }).click();
    await expect(page.getByText(/focus mode/i)).toBeVisible();
    const before = await page.getByText(/^\d{2}:\d{2}$/).first().textContent();
    await page.getByRole("button", { name: /start/i }).click();
    await page.waitForTimeout(1200);
    const after = await page.getByText(/^\d{2}:\d{2}$/).first().textContent();
    expect(after).not.toBe(before);
    expect(errors).toEqual([]);
  });

  test("Focus timer custom duration works", async ({ page }) => {
    await page.getByRole("button", { name: /^focus$/i }).click();
    await page.getByText(/set custom time/i).click();
    await page.getByText(/^45m$/).click();
    await expect(page.getByText(/custom: 45 min/i)).toBeVisible();
  });

  test("Flashcards Generate is disabled without a topic", async ({ page }) => {
    await page.getByRole("button", { name: /^cards$/i }).click();
    await expect(page.getByRole("button", { name: /generate/i })).toBeDisabled();
  });

  test("Period Tracker log shows prediction", async ({ page }) => {
    await page.getByRole("button", { name: /periods/i }).click();
    await expect(page.getByText(/cycle tracker/i)).toBeVisible();
    await page.getByRole("button", { name: /^log$/i }).click();
    await expect(page.getByText(/next period in/i)).toBeVisible({ timeout: 3000 });
  });

  test("Image PDF drop zone is visible", async ({ page }) => {
    await page.getByRole("button", { name: /^pdf$/i }).click();
    await expect(page.getByText(/images to pdf/i)).toBeVisible();
    await expect(page.getByText(/drag & drop images/i)).toBeVisible();
  });

  test("Pins panel starts empty", async ({ page }) => {
    await page.getByRole("button", { name: /^pins$/i }).click();
    await expect(page.getByText(/no pinned messages yet/i)).toBeVisible();
  });

  test("Stats renders without errors", async ({ page }) => {
    const errors = [];
    attachConsoleGuard(page, errors);
    await page.getByRole("button", { name: /^stats$/i }).click();
    await expect(page.getByText(/study analytics/i)).toBeVisible();
    expect(errors).toEqual([]);
  });
});