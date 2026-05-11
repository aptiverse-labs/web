// Auth steps — uses the form-based sign-in because NextAuth's session is
// cookie-bound and signed with NEXTAUTH_SECRET (which our tests don't have
// access to). For pure API assertions we still use the fixtures.api client
// (Bearer token, bypasses the cookie auth).

import { expect } from "@playwright/test";
import { Given } from "./fixtures";

Given("I sign in via the UI", async ({ page }) => {
  const email = process.env.E2E_TEST_EMAIL!;
  const password = process.env.E2E_TEST_PASSWORD!;

  await page.goto("/login");
  await page.getByLabel(/email/i).fill(email);
  await page.getByLabel(/password/i).fill(password);
  await page.getByRole("button", { name: /sign in|log in/i }).click();
  await page.waitForURL((url) => url.pathname.startsWith("/dashboard"));
  await expect(page).toHaveURL(/\/dashboard/);
});
