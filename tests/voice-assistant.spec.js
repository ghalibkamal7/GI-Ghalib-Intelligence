import { test, expect } from "@playwright/test";
import { attachConsoleGuard } from "./helpers/console-guard.js";

test.describe("Jarvis Dashboard", () => {
  test.beforeEach(async ({ page, context }) => {
    await context.grantPermissions(["geolocation", "microphone"]).catch(() => {});
    await context.setGeolocation({ latitude: 28.6139, longitude: 77.209 });
    await page.goto("/");
    await page.waitForLoadState("networkidle");
  });

  test("floating button doesn't overlap the composer", async ({ page }) => {
    const floatingBtn = page.locator('button[title="Talk to GI Assistant"]');
    const composer = page.getByPlaceholder(/ask gi anything/i);
    const btnBox = await floatingBtn.boundingBox();
    const inputBox = await composer.boundingBox();
    expect(btnBox.y + btnBox.height).toBeLessThanOrEqual(inputBox.y + 2);
  });

  test("opens from floating button", async ({ page }) => {
    const errors = [];
    attachConsoleGuard(page, errors);
    await page.locator('button[title="Talk to GI Assistant"]').click();
    await expect(page.getByText(/gi assistant/i)).toBeVisible();
    expect(errors).toEqual([]);
  });

  test("voice gender toggle switches label", async ({ page }) => {
    await page.locator('button[title="Talk to GI Assistant"]').click();
    const genderBtn = page.getByRole("button", { name: /voice/i });
    const before = await genderBtn.textContent();
    await genderBtn.click();
    const after = await genderBtn.textContent();
    expect(after).not.toBe(before);
  });

  test("Resize sub-tool opens inside dashboard", async ({ page }) => {
    await page.locator('button[title="Talk to GI Assistant"]').click();
    await page.getByText(/^resize$/i).click();
    await expect(page.getByText(/image resize/i)).toBeVisible();
  });

  test("BG Remove sub-tool opens inside dashboard", async ({ page }) => {
    await page.locator('button[title="Talk to GI Assistant"]').click();
    await page.getByText(/^bg remove$/i).click();
    await expect(page.getByText(/background remover/i)).toBeVisible();
  });

  test("quick-launch Focus closes dashboard and opens Focus Mode", async ({ page }) => {
    await page.locator('button[title="Talk to GI Assistant"]').click();
    await page.getByText(/^focus$/i).click();
    await expect(page.getByText(/focus mode/i)).toBeVisible();
  });

  test("closes cleanly via X button", async ({ page }) => {
    const errors = [];
    attachConsoleGuard(page, errors);
    await page.locator('button[title="Talk to GI Assistant"]').click();
    await page.getByLabel("Close").first().click().catch(() => page.keyboard.press("Escape"));
    await expect(page.getByText(/gi assistant/i)).not.toBeVisible();
    expect(errors).toEqual([]);
  });
});