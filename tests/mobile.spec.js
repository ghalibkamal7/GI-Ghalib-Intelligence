import { test, expect } from "@playwright/test";

test.describe("Mobile responsiveness", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
  });

  test("bottom icon bar shows labels on mobile", async ({ page }) => {
    const mobileToolbar = page.locator(".flex.sm\\:hidden");
    await expect(mobileToolbar.first()).toBeVisible();
    await expect(mobileToolbar.getByText("Focus")).toBeVisible();
    await expect(mobileToolbar.getByText("Periods")).toBeVisible();
  });

  test("GI logo has 8 flame petals", async ({ page }) => {
    const logo = page.locator("svg").filter({ has: page.locator("text=GI") }).first();
    await expect(logo).toBeVisible();
    const petalCount = await logo.locator("path").count();
    expect(petalCount).toBeGreaterThanOrEqual(8);
  });

  test("floating button doesn't overlap composer", async ({ page }) => {
    const floatingBtn = page.locator('button[title="Talk to GI Assistant"]');
    const composer = page.getByPlaceholder(/ask gi anything/i);
    const btnBox = await floatingBtn.boundingBox();
    const inputBox = await composer.boundingBox();
    expect(btnBox.y + btnBox.height).toBeLessThanOrEqual(inputBox.y + 2);
  });

  test("hamburger opens sidebar drawer", async ({ page }) => {
    await page.locator('button:has(svg)').first().click();
    await expect(page.getByText(/ghalib intelligence/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /new chat/i })).toBeVisible();
  });

  test("composer input is wide enough to type in", async ({ page }) => {
    const input = page.getByPlaceholder(/ask gi anything/i);
    await expect(input).toBeVisible();
    const box = await input.boundingBox();
    expect(box.width).toBeGreaterThan(150);
  });
});