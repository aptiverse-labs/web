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

function slugFor(subjectName: string): string {
  const slug = SUBJECT_NAME_TO_SLUG[subjectName];
  if (!slug) {
    throw new Error(`Add SUBJECT_NAME_TO_SLUG mapping for "${subjectName}"`);
  }
  return slug;
}

Given("I have picked the {word} curriculum", async ({ api }, code: string) => {
  await api.patch("/api/academic-planning/me/profile", {
    curriculumId: code.toLowerCase(),
    grade: 12,
  });
});

When("I add the {string} subject", async ({ page }, subjectName: string) => {
  const slug = slugFor(subjectName);

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

When(
  "I add the {string} subject with teacher {string}",
  async ({ page }, subjectName: string, teacher: string) => {
    const slug = slugFor(subjectName);

    await page.goto("/dashboard/subjects");
    await page
      .getByRole("button", { name: /add (subject|your first subject)/i })
      .first()
      .click();

    const row = page.locator(`[data-subject-slug="${slug}"]`).first();
    await row.waitFor({ state: "visible" });
    await row.getByPlaceholder(/teacher/i).fill(teacher);
    await row.getByRole("button", { name: /^add$/i }).click();

    await expect(row.getByText(/^added$/i)).toBeVisible();
    await page.getByRole("button", { name: /^done$/i }).click();
  },
);

When("I remove the {string} subject", async ({ page }, subjectName: string) => {
  // SubjectCard's remove icon button is labelled "Remove subject"
  const heading = page.getByRole("heading", { name: subjectName }).first();
  await heading.waitFor({ state: "visible" });
  // Walk up to the card container, then find the Remove button
  const card = heading.locator("xpath=ancestor::*[contains(@class,'MuiCard-root')][1]");
  await card.getByRole("button", { name: /remove subject/i }).click();
});

Then("the API should report {int} subject(s)", async ({ api }, expected: number) => {
  const subjects = await api.get<unknown[]>("/api/academic-planning/subjects");
  expect(subjects).toHaveLength(expected);
});

Then("I should see a subject card for {string}", async ({ page }, subjectName: string) => {
  await expect(page.getByRole("heading", { name: subjectName }).first()).toBeVisible();
});

Then(
  "the {string} card should not have a remove button",
  async ({ page }, subjectName: string) => {
    const heading = page.getByRole("heading", { name: subjectName }).first();
    await heading.waitFor({ state: "visible" });
    const card = heading.locator("xpath=ancestor::*[contains(@class,'MuiCard-root')][1]");
    await expect(card.getByRole("button", { name: /remove subject/i })).toHaveCount(0);
  },
);

Then(
  "the {string} subject should have teacher {string}",
  async ({ api }, subjectName: string, expectedTeacher: string) => {
    const slug = slugFor(subjectName);
    const subjects = await api.get<{ subjectId: string; teacher: string | null }[]>(
      "/api/academic-planning/subjects",
    );
    const match = subjects.find((s) => s.subjectId === slug);
    expect(match, `expected subject with slug ${slug}`).toBeDefined();
    expect(match!.teacher).toBe(expectedTeacher);
  },
);
