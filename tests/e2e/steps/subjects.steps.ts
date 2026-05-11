import { expect } from "@playwright/test";
import { Given, When, Then } from "./fixtures";

Given("I have picked the {word} curriculum", async ({ api }, code: string) => {
  await api.patch("/api/academic-planning/me/profile", {
    curriculumId: code.toLowerCase(),
  });
});

Given("I have no curriculum picked yet", async ({ api }) => {
  // Setting curriculumId to null isn't supported by the patch endpoint
  // (it ignores nulls). For tests we just confirm there are no subjects
  // so the picker renders.
  const subjects = await api.get<{ id: string }[]>("/api/academic-planning/subjects");
  expect(subjects).toHaveLength(0);
});

When("I add the {string} subject", async ({ page }, subjectName: string) => {
  await page.goto("/dashboard/subjects");
  await page.getByRole("button", { name: /add (subject|your first subject)/i }).first().click();
  await page.getByRole("button", { name: "Add" }).filter({
    has: page.locator(`xpath=ancestor::*[contains(., '${subjectName}')]`),
  }).first().click();
  await page.getByRole("button", { name: /^done$/i }).click();
});

Then("the API should report {int} subject(s)", async ({ api }, expected: number) => {
  const subjects = await api.get<unknown[]>("/api/academic-planning/subjects");
  expect(subjects).toHaveLength(expected);
});

Then("I should see a subject card for {string}", async ({ page }, subjectName: string) => {
  await expect(page.getByRole("heading", { name: subjectName, level: 6 })).toBeVisible();
});
