// Playwright + Cucumber (BDD) configuration for Aptiverse end-to-end tests.
//
// Per-role projects:
//   - one setup project per role (student/parent/teacher/tutor), each
//     signs in and saves its session to .auth/<role>.json
//   - one main project per role, depending ONLY on that role's setup
//     and grep-filtering scenarios by @<role> tag
//
// Isolation: a failed parent setup doesn't block the student / teacher /
// tutor suites from running.
//
// Tests run against your local dev stack:
//   - Next.js UI on  http://localhost:3000
//   - .NET API on    http://localhost:5100
//   - Postgres via SSH tunnel on localhost:5432

import { defineConfig, devices } from "@playwright/test";
import { defineBddConfig } from "playwright-bdd";
import dotenv from "dotenv";
import path from "node:path";

dotenv.config({ path: path.resolve(__dirname, ".env") });

const testDir = defineBddConfig({
  features: path.resolve(__dirname, "features"),
  steps: path.resolve(__dirname, "steps"),
});

const auth = (role: string) => path.resolve(__dirname, `.auth/${role}.json`);
const setupDir = path.resolve(__dirname, "setup");

function setupProject(role: string) {
  return {
    name: `setup-${role}`,
    testDir: setupDir,
    testMatch: new RegExp(`${role}\\.setup\\.ts$`),
    use: { ...devices["Desktop Chrome"] },
  };
}

function roleProject(role: string) {
  return {
    name: role,
    use: { ...devices["Desktop Chrome"], storageState: auth(role) },
    dependencies: [`setup-${role}`],
    grep: new RegExp(`@${role}`),
  };
}

export default defineConfig({
  testDir,
  workers: 1,
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? "github" : [["list"]],
  timeout: 60_000,
  expect: { timeout: 10_000 },

  use: {
    baseURL: process.env.E2E_UI_BASE_URL ?? "http://localhost:3000",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },

  projects: [
    setupProject("student"),
    setupProject("parent"),
    setupProject("teacher"),
    setupProject("tutor"),
    roleProject("student"),
    roleProject("parent"),
    roleProject("teacher"),
    roleProject("tutor"),
  ],
});
