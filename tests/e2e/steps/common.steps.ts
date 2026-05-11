// Shared steps used by every feature.

import { expect } from "@playwright/test";
import { Given, When, Then, Before } from "./fixtures";

// Reset the test user's content so every scenario starts from a clean
// slate. Runs before each scenario tagged @reset (or all of them — we
// keep it cheap by only deleting things our suite created).
Before(async ({ api }) => {
  // Wipe assessments
  const assessments = await api.get<{ id: string }[]>("/api/academic-planning/assessments");
  for (const a of assessments) {
    await api.delete(`/api/academic-planning/assessments/${a.id}`);
  }
  // Wipe subjects (skip compulsory — the API blocks those anyway)
  const subjects = await api.get<{ id: string; isCompulsory: boolean }[]>(
    "/api/academic-planning/subjects",
  );
  for (const s of subjects) {
    if (!s.isCompulsory) {
      try {
        await api.delete(`/api/academic-planning/subjects/${s.id}`);
      } catch {
        /* ignore — compulsory or already gone */
      }
    }
  }
  // Wipe goals
  const goals = await api.get<{ id: string }[]>("/api/goals");
  for (const g of goals) {
    await api.delete(`/api/goals/${g.id}`);
  }
});

Given("I am signed in", async ({ page, apiToken }) => {
  // Plant the NextAuth session via localStorage so the UI is authenticated
  // without going through the form. The fetcher reads accessToken off
  // next-auth's session object.
  await page.goto("/dashboard");
  await page.evaluate((token) => {
    // Cookie-based NextAuth: we still need to authenticate via UI in v1
    // since storing a forged session cookie requires the NextAuth secret.
    // The token is exposed here for direct API calls if the page wants it.
    window.sessionStorage.setItem("e2e:apiToken", token);
  }, apiToken);
});

When("I open {string}", async ({ page }, path: string) => {
  await page.goto(path);
});

Then("I should see {string}", async ({ page }, text: string) => {
  await expect(page.getByText(text, { exact: false }).first()).toBeVisible();
});

Then("I should not see {string}", async ({ page }, text: string) => {
  await expect(page.getByText(text, { exact: false }).first()).not.toBeVisible();
});
