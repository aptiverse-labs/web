// One-time auth setup per role. Signs into the UI via the real login
// form for each test account and persists NextAuth session cookies +
// localStorage to .auth/<role>.json. Each role's main project loads its
// own storage state at startup and is already signed in.
//
// Roles → fixtures driven by the running project name (see
// playwright.config.ts).

import { test as setup, expect } from "@playwright/test";
import path from "node:path";

type Role = "student" | "parent" | "teacher" | "tutor";

function emailFor(role: Role): string {
  const v = process.env[`E2E_${role.toUpperCase()}_EMAIL`];
  if (!v) {
    throw new Error(
      `E2E_${role.toUpperCase()}_EMAIL is not set. Copy tests/e2e/.env.example to tests/e2e/.env.`,
    );
  }
  return v;
}

function password(): string {
  const v = process.env.E2E_PASSWORD;
  if (!v) {
    throw new Error("E2E_PASSWORD is not set. Copy tests/e2e/.env.example to tests/e2e/.env.");
  }
  return v;
}

async function authenticate(role: Role, page: import("@playwright/test").Page) {
  const authFile = path.resolve(__dirname, `../.auth/${role}.json`);

  await page.goto("/login");
  await page.getByLabel("Email").fill(emailFor(role));
  await page.getByLabel("Password").fill(password());
  await page.getByRole("button", { name: /^sign in$/i }).click();

  // Each role lands on a different dashboard after login — wait for any
  // /dashboard, /parent, /teacher, /tutor URL.
  await page.waitForURL(/\/(dashboard|parent|teacher|tutor|admin|school-admin)/, {
    timeout: 30_000,
  });
  await expect(page).not.toHaveURL(/\/login/);

  await page.context().storageState({ path: authFile });
}

setup("student auth", async ({ page }) => authenticate("student", page));
setup("parent auth", async ({ page }) => authenticate("parent", page));
setup("teacher auth", async ({ page }) => authenticate("teacher", page));
setup("tutor auth", async ({ page }) => authenticate("tutor", page));
