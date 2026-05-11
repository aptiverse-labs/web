// Playwright + Cucumber (BDD) configuration for Aptiverse end-to-end tests.
//
// Per-role projects:
//   - setup project signs in each test account and saves its session to
//     .auth/<role>.json
//   - one main project per role, each loading its own storageState and
//     grep-filtering scenarios by @<role> tag.
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
      name: "student",
      use: { ...devices["Desktop Chrome"], storageState: auth("student") },
      dependencies: ["setup"],
      grep: /@student/,
    },
    {
      name: "parent",
      use: { ...devices["Desktop Chrome"], storageState: auth("parent") },
      dependencies: ["setup"],
      grep: /@parent/,
    },
    {
      name: "teacher",
      use: { ...devices["Desktop Chrome"], storageState: auth("teacher") },
      dependencies: ["setup"],
      grep: /@teacher/,
    },
    {
      name: "tutor",
      use: { ...devices["Desktop Chrome"], storageState: auth("tutor") },
      dependencies: ["setup"],
      grep: /@tutor/,
    },
  ],
});
