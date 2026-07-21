import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

async function scan(page) {
  const results = await new AxeBuilder({ page })
    .disableRules(["color-contrast"])
    .analyze();
  return results.violations;
}

test.describe("Accessibility", () => {
  test("Login page has no critical a11y violations", async ({ page }) => {
    await page.goto("/login");
    const violations = await scan(page);
    expect(violations, JSON.stringify(violations, null, 2)).toEqual([]);
  });

  test("Chat home screen has no critical a11y violations", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    const violations = await scan(page);
    expect(violations, JSON.stringify(violations, null, 2)).toEqual([]);
  });

  test("Focus Mode modal has no critical a11y violations", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: /^focus$/i }).click();
    const violations = await scan(page);
    expect(violations, JSON.stringify(violations, null, 2)).toEqual([]);
  });

  test("Jarvis Dashboard has no critical a11y violations", async ({ page }) => {
    await page.goto("/");
    await page.locator('button[title="Talk to GI Assistant"]').click();
    const violations = await scan(page);
    expect(violations, JSON.stringify(violations, null, 2)).toEqual([]);
  });
});