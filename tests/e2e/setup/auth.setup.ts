// One-time auth setup. Signs into the UI via the real login form and
// persists the NextAuth session cookies + localStorage to .auth/user.json.
// All subsequent tests load that storage state and start already signed in.
//
// Runs as a Playwright "project" — see playwright.config.ts.

import { test as setup, expect } from "@playwright/test";
import path from "node:path";

const authFile = path.resolve(__dirname, "../.auth/user.json");

setup("authenticate", async ({ page }) => {
  const email = process.env.E2E_TEST_EMAIL;
  const password = process.env.E2E_TEST_PASSWORD;
  if (!email || !password) {
    throw new Error(
      "E2E_TEST_EMAIL / E2E_TEST_PASSWORD are not set. Copy tests/e2e/.env.example to tests/e2e/.env.",
    );
  }

  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: /^sign in$/i }).click();

  // Wait for the dashboard to load — the route guard redirects here once
  // NextAuth's session cookie is set.
  await page.waitForURL((url) => url.pathname.startsWith("/dashboard"), { timeout: 30_000 });
  await expect(page).toHaveURL(/\/dashboard/);

  await page.context().storageState({ path: authFile });
});
