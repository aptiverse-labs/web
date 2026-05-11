import { expect } from "@playwright/test";
import { Given, When, Then } from "./fixtures";

// Catalog-subject slug lookups — the UI clicks subjects by name but our
// data attributes use slugs. Keep this map small; extend when new
// scenarios reference more subjects.
const SUBJECT_NAME_TO_SLUG: Record<string, string> = {
  Mathematics: "math",
  "Mathematical Literacy": "math_lit",
  "Physical Sciences": "physci",
  "Life Sciences": "lifesci",
  "English Home Language": "eng_hl",
  "Life Orientation": "lo",
  "Advanced Programme Mathematics": "ap_math",
};

Given("I have picked the {word} curriculum", async ({ api }, code: string) => {
  await api.patch("/api/academic-planning/me/profile", {
    curriculumId: code.toLowerCase(),
    grade: 12,
  });
});

When("I add the {string} subject", async ({ page }, subjectName: string) => {
  const slug = SUBJECT_NAME_TO_SLUG[subjectName];
  expect(slug, `add SUBJECT_NAME_TO_SLUG mapping for "${subjectName}"`).toBeDefined();

  await page.goto("/dashboard/subjects");
  await page
    .getByRole("button", { name: /add (subject|your first subject)/i })
    .first()
    .click();

  // Dialog opens — find the row by data-subject-slug and click its Add button.
  const row = page.locator(`[data-subject-slug="${slug}"]`).first();
  await row.waitFor({ state: "visible" });
  await row.getByRole("button", { name: /^add$/i }).click();

  // Wait for the row to flip to "Added" so we know the mutation completed.
  await expect(row.getByText(/^added$/i)).toBeVisible();

  // Close the dialog
  await page.getByRole("button", { name: /^done$/i }).click();
});

Then("the API should report {int} subject(s)", async ({ api }, expected: number) => {
  const subjects = await api.get<unknown[]>("/api/academic-planning/subjects");
  expect(subjects).toHaveLength(expected);
});

Then("I should see a subject card for {string}", async ({ page }, subjectName: string) => {
  // SubjectCard renders the name in an h6 — match flexibly.
  await expect(page.getByRole("heading", { name: subjectName }).first()).toBeVisible();
});
