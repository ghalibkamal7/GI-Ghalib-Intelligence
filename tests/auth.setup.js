import { test as setup, expect } from "@playwright/test";

const AUTH_FILE = "playwright/.auth/user.json";
const EMULATOR_AUTH_URL =
  "http://localhost:9099/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=fake-api-key";
const TEST_EMAIL = "gi-test-user@example.com";
const TEST_PASSWORD = "test-password-123";

setup("authenticate via Firebase Auth Emulator", async ({ page, request }) => {
  const signUpRes = await request
    .post(
      `http://localhost:9099/identitytoolkit.googleapis.com/v1/accounts:signUp?key=fake-api-key`,
      { data: { email: TEST_EMAIL, password: TEST_PASSWORD, returnSecureToken: true } }
    )
    .catch(() => null);

  const signInRes = signUpRes?.ok()
    ? signUpRes
    : await request.post(EMULATOR_AUTH_URL, {
        data: { email: TEST_EMAIL, password: TEST_PASSWORD, returnSecureToken: true },
      });

  expect(signInRes.ok(), "Firebase Auth Emulator sign-in failed — is it running on :9099?").toBeTruthy();

  await page.goto("/login");
  const { idToken, localId } = await signInRes.json();

  await page.evaluate(
    ({ idToken, localId, email }) => {
      window.localStorage.setItem(
        `firebase:authUser:fake-api-key:[DEFAULT]`,
        JSON.stringify({ uid: localId, email, stsTokenManager: { accessToken: idToken } })
      );
    },
    { idToken, localId, email: TEST_EMAIL }
  );

  await page.reload();
  await page.waitForURL("**/", { timeout: 10000 }).catch(() => {});
  await page.context().storageState({ path: AUTH_FILE });
});