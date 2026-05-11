// Playwright + Cucumber (BDD) configuration for Aptiverse end-to-end tests.
//
// .feature files in ./features are compiled into Playwright tests by
// playwright-bdd at run-time. Step definitions live in ./steps.
//
// Tests run against your local dev stack:
//   - Next.js UI on  http://localhost:3000
//   - .NET API on    http://localhost:5100
//   - Postgres via SSH tunnel on localhost:5432
//
// Auth: a one-time "setup" project signs into the UI and saves a storage
// state to .auth/user.json. The main "chromium" project loads that state
// so every scenario starts already authenticated.

import { defineConfig, devices } from "@playwright/test";
import { defineBddConfig } from "playwright-bdd";
import dotenv from "dotenv";
import path from "node:path";

dotenv.config({ path: path.resolve(__dirname, ".env") });

const testDir = defineBddConfig({
  features: path.resolve(__dirname, "features"),
  steps: path.resolve(__dirname, "steps"),
});

const authFile = path.resolve(__dirname, ".auth/user.json");

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
    {
      name: "setup",
      testDir: path.resolve(__dirname, "setup"),
      testMatch: /.*\.setup\.ts/,
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        storageState: authFile,
      },
      dependencies: ["setup"],
    },
  ],
});
