// Shared sign-in helper for the per-role setup files. Each role lives in
// its own setup project (student.setup.ts, parent.setup.ts, etc.) so a
// failed setup for one role doesn't skip the main suite for the others.

import { expect, type Page } from "@playwright/test";
import path from "node:path";
import { emailFor, passwordFor, type Role } from "../steps/test-accounts";

export async function authenticate(role: Role, page: Page): Promise<void> {
  const authFile = path.resolve(__dirname, `../.auth/${role}.json`);
  const email = emailFor(role);

  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(passwordFor(role));
  await page.getByRole("button", { name: /^sign in$/i }).click();

  // Race a successful redirect against a login-form error so we can
  // surface invalid credentials / missing accounts clearly instead of
  // timing out after 30s with no context.
  const result = await Promise.race([
    page
      .waitForURL(/\/(dashboard|parent|teacher|tutor|admin|school-admin)/, {
        timeout: 30_000,
      })
      .then(() => "ok" as const)
      .catch(() => "timeout" as const),
    page
      .getByRole("alert")
      .first()
      .waitFor({ state: "visible", timeout: 30_000 })
      .then(() => "error" as const)
      .catch(() => "timeout" as const),
  ]);

  if (result === "error") {
    const alertText = await page.getByRole("alert").first().textContent();
    throw new Error(
      `Login failed for ${role} (${email}): ${alertText?.trim() ?? "no error text"}. ` +
        `Verify the account exists with the password from tests/e2e/.env.`,
    );
  }

  if (result === "timeout") {
    throw new Error(
      `Login for ${role} (${email}) didn't redirect within 30s and no error alert appeared. ` +
        `Check that the dev server is running and reachable at E2E_UI_BASE_URL.`,
    );
  }

  await expect(page).not.toHaveURL(/\/login/);
  await page.context().storageState({ path: authFile });
}
