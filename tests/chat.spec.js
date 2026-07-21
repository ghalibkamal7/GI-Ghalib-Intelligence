import { test, expect } from "@playwright/test";
import { attachConsoleGuard } from "./helpers/console-guard.js";

test.describe("AI Chat", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
  });

  test("home screen shows greeting, GI orb, and quick actions", async ({ page }) => {
    await expect(page.getByText(/good (morning|afternoon|evening)/i)).toBeVisible();
    await expect(page.getByText(/learn smarter with gi/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /gi chat/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /gi assistant/i })).toBeVisible();
  });

  test("typing and sending a message shows the user bubble immediately", async ({ page }) => {
    const errors = [];
    attachConsoleGuard(page, errors);
    const input = page.getByPlaceholder(/ask gi anything/i);
    await input.fill("Hello GI");
    await input.press("Enter");
    await expect(page.getByText("Hello GI")).toBeVisible({ timeout: 5000 });
    await expect(page.getByText(/hello|ghalib|thinking/i).first()).toBeVisible({ timeout: 8000 });
    expect(errors).toEqual([]);
  });

  test("Shift+Enter adds newline without sending", async ({ page }) => {
    const input = page.getByPlaceholder(/ask gi anything/i);
    await input.fill("Line one");
    await input.press("Shift+Enter");
    await input.type("Line two");
    await expect(input).toHaveValue(/Line one\nLine two/);
  });

  test("new chat clears the conversation", async ({ page }) => {
    const input = page.getByPlaceholder(/ask gi anything/i);
    await input.fill("Hello GI");
    await input.press("Enter");
    await expect(page.getByText("Hello GI")).toBeVisible({ timeout: 5000 });
    await page.getByRole("button", { name: /new chat/i }).click();
    await expect(page.getByText(/good (morning|afternoon|evening)/i)).toBeVisible();
    await expect(page.getByText("Hello GI")).not.toBeVisible();
  });

  test("sidebar search with no match shows no chats", async ({ page }) => {
    const search = page.getByPlaceholder(/search chats/i);
    await search.fill("zzz-no-match-zzz");
    await expect(page.getByText(/no chats/i)).toBeVisible();
    await search.fill("");
  });
});