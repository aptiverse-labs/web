import { expect } from "@playwright/test";
import { Given, When, Then } from "./fixtures";

Given(
  "I have a subject {string} in grade {int} on the {word} curriculum",
  async ({ api }, subjectName: string, grade: number, curriculumCode: string) => {
    await api.patch("/api/academic-planning/me/profile", {
      curriculumId: curriculumCode.toLowerCase(),
      grade,
    });
    const catalog = await api.get<
      { id: string; curriculumSubjectId: number; name: string }[]
    >(`/api/academic-planning/curricula/${curriculumCode.toLowerCase()}/subjects`);
    const match = catalog.find((s) => s.name === subjectName);
    expect(match, `catalog has no subject named '${subjectName}'`).toBeDefined();
    await api.post("/api/academic-planning/subjects", {
      curriculumSubjectId: match!.curriculumSubjectId,
      grade,
    });
  },
);

When(
  "I create an assessment titled {string} with type {word} weight {int}% due in {int} days",
  async ({ page }, title: string, type: string, weight: number, daysOut: number) => {
    await page.goto("/dashboard/assessments/new");
    // Pick the first subject in the dropdown (we set it up via API).
    await page.getByLabel("Subject").click();
    await page.getByRole("option").first().click();
    await page.getByLabel("Title").fill(title);
    await page.getByLabel("Type").click();
    await page.getByRole("option", { name: new RegExp(`^${type}$`, "i") }).click();
    await page.getByLabel("Weight").fill(String(weight));
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + daysOut);
    await page.getByLabel("Due date").fill(dueDate.toISOString().slice(0, 10));
    await page.getByRole("button", { name: /save assessment/i }).click();
    await page.waitForURL(/\/dashboard\/assessments\/\d+/);
  },
);

Then(
  "the API should report an assessment titled {string}",
  async ({ api }, title: string) => {
    const rows = await api.get<{ title: string }[]>("/api/academic-planning/assessments");
    expect(rows.map((r) => r.title)).toContain(title);
  },
);
