// Feature keys mirror the backend's PlanFeature catalog (see
// api/Modules/Entitlements/.../EntitlementsCatalogSeeder.cs). Keep this
// in sync with that seeder — both sides are the contract for what
// FeatureGuard / [RequiresFeature] check against.
//
// Type-safe string union so typos are caught at compile time. Adding a
// new feature is two edits: add the key here, add the row in the seeder.

export type FeatureKey =
  // Free-tier
  | "subjects.up_to_6"
  | "goals.basic"
  | "ai_practice.basic"
  | "diary"
  | "wellbeing.basic"
  | "bursaries.read"
  | "past_papers.read"
  | "universities.read"
  | "calendar"
  | "notifications"
  | "settings"
  | "help"
  // Student-and-above
  | "subjects.unlimited"
  | "goals.unlimited"
  | "goals.milestones"
  | "ai_practice.unlimited"
  | "past_papers.solved"
  | "mastery.predictions"
  | "ai_tutor"
  | "career_navigator"
  | "bursaries.checklist"
  | "rewards.redeem"
  | "support.priority"
  | "tutor_marketplace.book"
  | "courses.enrol"
  | "study_groups"
  | "workspace"
  | "psychologist.read"
  // Family-and-above
  | "parent.dashboard"
  | "parent.realtime_feed"
  | "parent.wellbeing_view"
  | "parent.celebrations"
  | "family.shared_calendar"
  | "family.linked_children"
  | "counselling.session_included"
  | "parent.billing"
  // School-only
  | "teacher.dashboard"
  | "teacher.gap_analysis"
  | "teacher.differentiator"
  | "teacher.analytics"
  | "teacher.classes"
  | "teacher.assignments"
  | "teacher.verifications"
  | "teacher.live_view"
  | "school_admin.dashboard"
  | "school_admin.analytics"
  | "school_admin.readiness"
  | "school_admin.teachers"
  | "school_admin.students"
  | "school_admin.classes"
  | "school.bursary_partners"
  | "school.sso"
  | "school.success_manager";

export type PlanCode = "free" | "student" | "family" | "school";

// User-facing labels for the Upgrade CTA. The lowest plan that unlocks
// each feature is what we suggest upgrading to. Pulled from the seeder
// so they stay aligned; add a mapping here whenever you add a feature
// to FeatureKey.
export const FEATURE_MIN_PLAN: Record<FeatureKey, PlanCode> = {
  // Free
  "subjects.up_to_6": "free",
  "goals.basic": "free",
  "ai_practice.basic": "free",
  diary: "free",
  "wellbeing.basic": "free",
  "bursaries.read": "free",
  "past_papers.read": "free",
  "universities.read": "free",
  calendar: "free",
  notifications: "free",
  settings: "free",
  help: "free",
  // Student
  "subjects.unlimited": "student",
  "goals.unlimited": "student",
  "goals.milestones": "student",
  "ai_practice.unlimited": "student",
  "past_papers.solved": "student",
  "mastery.predictions": "student",
  ai_tutor: "student",
  career_navigator: "student",
  "bursaries.checklist": "student",
  "rewards.redeem": "student",
  "support.priority": "student",
  "tutor_marketplace.book": "student",
  "courses.enrol": "student",
  study_groups: "student",
  workspace: "student",
  "psychologist.read": "student",
  // Family
  "parent.dashboard": "family",
  "parent.realtime_feed": "family",
  "parent.wellbeing_view": "family",
  "parent.celebrations": "family",
  "family.shared_calendar": "family",
  "family.linked_children": "family",
  "counselling.session_included": "family",
  "parent.billing": "family",
  // School
  "teacher.dashboard": "school",
  "teacher.gap_analysis": "school",
  "teacher.differentiator": "school",
  "teacher.analytics": "school",
  "teacher.classes": "school",
  "teacher.assignments": "school",
  "teacher.verifications": "school",
  "teacher.live_view": "school",
  "school_admin.dashboard": "school",
  "school_admin.analytics": "school",
  "school_admin.readiness": "school",
  "school_admin.teachers": "school",
  "school_admin.students": "school",
  "school_admin.classes": "school",
  "school.bursary_partners": "school",
  "school.sso": "school",
  "school.success_manager": "school",
};

export const PLAN_LABELS: Record<PlanCode, string> = {
  free: "Free",
  student: "Student",
  family: "Family",
  school: "School",
};
