"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/fetcher";
import {
  BURSARIES,
  CHILDREN,
  CLASSES,
  NOTIFICATIONS,
  CAREERS,
  type Assessment,
  type Goal,
  type Subject,
  type PracticeTest,
  type Tutor,
  type Course,
  type Bursary,
  type Child,
  type ClassRecord,
  type Notification,
  type DiaryEntry,
  type Reward,
  type Career,
  type StudyGroup,
  type Curriculum,
  type CatalogSubject,
  type AcademicProfile,
} from "@/lib/mockData";

export type PastPaper = {
  id: string;
  year: number;
  subject: string;
  paper: string;
  board: string;
  topic: string;
  solved: boolean;
};

export type Counsellor = {
  id: string;
  name: string;
  title: string;
  specialisation: string;
  rating: number;
  online: boolean;
  avatarColor: string;
};

export type LiveActivity = {
  id: string;
  studentId: string;
  student: string;
  action: string;
  subject?: string;
  detail?: string;
  ts: string;
};

export type Gap = {
  topic: string;
  className: string;
  strugglingPct: number;
  sample: number;
};

export type DifferentiationTier = {
  label: string;
  count: number;
  suggestion: string;
};

export type Verification = {
  id: string;
  student: string;
  goal: string;
  value: string;
  date: string;
  reward: string;
};

export type Milestone = {
  id: string;
  goalId: string;
  title: string;
  description: string;
  priority: number;
  isCompleted: boolean;
  rewardPoints: number;
};

export type AuditLog = {
  id: string;
  ts: string;
  actor: string;
  action: string;
  resource: string;
  ip: string;
  severity: string;
};

export type ModerationFlag = {
  id: string;
  reason: string;
  target: string;
  reporter: string;
  excerpt: string;
  severity: string;
  createdAt: string;
};

export type FeatureFlag = {
  key: string;
  description: string;
  enabled: boolean;
  rollout: number;
  env: string;
};

export type SchoolEnquiry = {
  id: string;
  schoolName: string;
  contactName: string;
  contactRole?: string | null;
  email: string;
  phone?: string | null;
  province?: string | null;
  city?: string | null;
  curricula?: string | null;     // CSV of nsc/ieb/cambridge
  learnerCount?: string | null;
  stage?: string | null;
  notes?: string | null;
  submittedAt: string;
  contacted: boolean;
  contactedAt?: string | null;
};

// Mock fetch with delay so loading states render properly. Used only by
// hooks that haven't been wired to the real API yet — convert per page.
const fakeFetch = <T>(value: T, ms = 350): Promise<T> =>
  new Promise((res) => setTimeout(() => res(value), ms));

export const queryKeys = {
  subjects: () => ["subjects"] as const,
  subject: (id: string) => ["subject", id] as const,
  assessments: () => ["assessments"] as const,
  assessment: (id: string) => ["assessment", id] as const,
  goals: () => ["goals"] as const,
  practiceTests: () => ["practice-tests"] as const,
  practiceTest: (id: string) => ["practice-test", id] as const,
  tutors: () => ["tutors"] as const,
  tutor: (id: string) => ["tutor", id] as const,
  courses: () => ["courses"] as const,
  course: (id: string) => ["course", id] as const,
  bursaries: () => ["bursaries"] as const,
  children: () => ["children"] as const,
  classes: () => ["classes"] as const,
  notifications: () => ["notifications"] as const,
  pastPapers: () => ["past-papers"] as const,
  diary: () => ["diary"] as const,
  counsellors: () => ["counsellors"] as const,
  rewards: () => ["rewards"] as const,
  careers: () => ["careers"] as const,
  studyGroups: () => ["study-groups"] as const,
  liveActivity: () => ["live-activity"] as const,
  gaps: () => ["gaps"] as const,
  differentiation: () => ["differentiation"] as const,
  verifications: () => ["verifications"] as const,
  goalMilestones: (goalId: string) => ["goal-milestones", goalId] as const,
  auditLogs: () => ["audit-logs"] as const,
  moderationQueue: () => ["moderation-queue"] as const,
  featureFlags: () => ["feature-flags"] as const,
  curricula: () => ["curricula"] as const,
  curriculumSubjects: (curriculumId: string) => ["curriculum-subjects", curriculumId] as const,
  academicProfile: () => ["academic-profile"] as const,
  schoolEnquiries: (contacted?: boolean) =>
    contacted === undefined
      ? (["school-enquiries"] as const)
      : (["school-enquiries", contacted] as const),
};

export const useSubjects = () =>
  useQuery<Subject[]>({
    queryKey: queryKeys.subjects(),
    queryFn: () => apiClient.get<Subject[]>("/api/academic-planning/subjects"),
  });

export const useSubject = (id: string) =>
  useQuery<Subject>({
    queryKey: queryKeys.subject(id),
    queryFn: () => apiClient.get<Subject>(`/api/academic-planning/subjects/${id}`),
    enabled: !!id,
  });

// --- Curriculum catalog + per-student profile ---------------------------

export const useCurricula = () =>
  useQuery<Curriculum[]>({
    queryKey: queryKeys.curricula(),
    queryFn: () => apiClient.get<Curriculum[]>("/api/academic-planning/curricula"),
  });

export const useCurriculumSubjects = (curriculumId: string | null | undefined) =>
  useQuery<CatalogSubject[]>({
    queryKey: queryKeys.curriculumSubjects(curriculumId ?? ""),
    queryFn: () =>
      apiClient.get<CatalogSubject[]>(`/api/academic-planning/curricula/${curriculumId}/subjects`),
    enabled: !!curriculumId,
  });

export const useAcademicProfile = () =>
  useQuery<AcademicProfile>({
    queryKey: queryKeys.academicProfile(),
    queryFn: () => apiClient.get<AcademicProfile>("/api/academic-planning/me/profile"),
  });

export type UpdateAcademicProfileInput = {
  curriculumId?: string;
  grade?: number;
  school?: string;
};

export const useUpdateAcademicProfile = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateAcademicProfileInput) =>
      apiClient.patch<AcademicProfile>("/api/academic-planning/me/profile", input),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.academicProfile() });
    },
  });
};

export type AddSubjectInput = {
  curriculumSubjectId: number;
  grade?: number;
  teacher?: string;
};

export const useAddSubject = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: AddSubjectInput) =>
      apiClient.post<Subject>("/api/academic-planning/subjects", input),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.subjects() });
      void qc.invalidateQueries({ queryKey: queryKeys.academicProfile() });
    },
  });
};

// --- Admin: school enquiries (sales pipeline) ---------------------------

export const useSchoolEnquiries = (contacted?: boolean) =>
  useQuery<SchoolEnquiry[]>({
    queryKey: queryKeys.schoolEnquiries(contacted),
    queryFn: () => {
      const qs = contacted === undefined ? "" : `?contacted=${contacted}`;
      return apiClient.get<SchoolEnquiry[]>(`/api/sales/school-enquiries${qs}`);
    },
  });

export const useMarkEnquiryContacted = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiClient.post<void>(`/api/sales/school-enquiries/${id}/mark-contacted`),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["school-enquiries"] });
    },
  });
};

export const useDeleteSubject = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.delete<void>(`/api/academic-planning/subjects/${id}`),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.subjects() });
    },
  });
};

// --- Assessments (SBA tasks) -------------------------------------------

export type CreateAssessmentInput = {
  subjectId: string;
  title: string;
  type: Assessment["type"];
  weight: number;
  dueDate: string;
  status?: Assessment["status"];
  predictedMark?: number | null;
  actualMark?: number | null;
  notes?: string;
};

export type UpdateAssessmentInput = Partial<CreateAssessmentInput>;

export const useCreateAssessment = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateAssessmentInput) =>
      apiClient.post<Assessment>("/api/academic-planning/assessments", input),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.assessments() });
    },
  });
};

export const useUpdateAssessment = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...patch }: UpdateAssessmentInput & { id: string }) =>
      apiClient.patch<Assessment>(`/api/academic-planning/assessments/${id}`, patch),
    onSuccess: (_data, vars) => {
      void qc.invalidateQueries({ queryKey: queryKeys.assessments() });
      void qc.invalidateQueries({ queryKey: queryKeys.assessment(vars.id) });
    },
  });
};

export const useDeleteAssessment = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.delete<void>(`/api/academic-planning/assessments/${id}`),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.assessments() });
    },
  });
};

export const useAssessments = () =>
  useQuery<Assessment[]>({
    queryKey: queryKeys.assessments(),
    queryFn: () => apiClient.get<Assessment[]>("/api/academic-planning/assessments"),
  });

export const useAssessment = (id: string) =>
  useQuery<Assessment>({
    queryKey: queryKeys.assessment(id),
    queryFn: () => apiClient.get<Assessment>(`/api/academic-planning/assessments/${id}`),
    enabled: !!id,
  });

export const useGoals = () =>
  useQuery<Goal[]>({
    queryKey: queryKeys.goals(),
    queryFn: () => apiClient.get<Goal[]>("/api/goals"),
  });

export type CreateGoalInput = {
  title: string;
  description?: string;
  target?: string;
  category?: Goal["category"];
  subjectId?: string | null;
  reward?: string;
  dueDate?: string;
};

export const useCreateGoal = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateGoalInput) => apiClient.post<Goal>("/api/goals", input),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.goals() });
    },
  });
};

export const useUpdateGoal = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...patch }: Partial<Goal> & { id: string }) =>
      apiClient.patch<Goal>(`/api/goals/${id}`, patch),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.goals() });
    },
  });
};

export const useDeleteGoal = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.delete<void>(`/api/goals/${id}`),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.goals() });
    },
  });
};

export const usePracticeTests = () =>
  useQuery<PracticeTest[]>({
    queryKey: queryKeys.practiceTests(),
    queryFn: () => apiClient.get<PracticeTest[]>("/api/practice/tests"),
  });

export const usePracticeTest = (id: string) =>
  useQuery<PracticeTest>({
    queryKey: queryKeys.practiceTest(id),
    queryFn: () => apiClient.get<PracticeTest>(`/api/practice/tests/${id}`),
    enabled: !!id,
  });

export const useTutors = () =>
  useQuery<Tutor[]>({
    queryKey: queryKeys.tutors(),
    queryFn: () => apiClient.get<Tutor[]>("/api/marketplace/tutors"),
  });

export const useTutor = (id: string) =>
  useQuery<Tutor>({
    queryKey: queryKeys.tutor(id),
    queryFn: () => apiClient.get<Tutor>(`/api/marketplace/tutors/${id}`),
    enabled: !!id,
  });

export const useCourses = () =>
  useQuery<Course[]>({
    queryKey: queryKeys.courses(),
    queryFn: () => apiClient.get<Course[]>("/api/marketplace/courses"),
  });

export const usePastPapers = () =>
  useQuery<PastPaper[]>({
    queryKey: queryKeys.pastPapers(),
    queryFn: () => apiClient.get<PastPaper[]>("/api/practice/past-papers"),
  });

export const useDiaryEntries = () =>
  useQuery<DiaryEntry[]>({
    queryKey: queryKeys.diary(),
    queryFn: () => apiClient.get<DiaryEntry[]>("/api/wellbeing/diary"),
  });

export const useCounsellors = () =>
  useQuery<Counsellor[]>({
    queryKey: queryKeys.counsellors(),
    queryFn: () => apiClient.get<Counsellor[]>("/api/wellbeing/counsellors"),
  });

export const useRewards = () =>
  useQuery<Reward[]>({
    queryKey: queryKeys.rewards(),
    queryFn: () => apiClient.get<Reward[]>("/api/goals/rewards"),
  });

export const useCareers = () =>
  useQuery<Career[]>({
    queryKey: queryKeys.careers(),
    queryFn: () => apiClient.get<Career[]>("/api/careers"),
  });

export const useBursaries = () =>
  useQuery<Bursary[]>({
    queryKey: queryKeys.bursaries(),
    queryFn: () => apiClient.get<Bursary[]>("/api/bursaries"),
  });

export const useChildren = () =>
  useQuery<Child[]>({
    queryKey: queryKeys.children(),
    queryFn: () => apiClient.get<Child[]>("/api/entitlements/children"),
  });

export const useClasses = () =>
  useQuery<ClassRecord[]>({
    queryKey: queryKeys.classes(),
    queryFn: () => apiClient.get<ClassRecord[]>("/api/academic-planning/classes"),
  });

export const useNotifications = () =>
  useQuery<Notification[]>({
    queryKey: queryKeys.notifications(),
    queryFn: () => apiClient.get<Notification[]>("/api/notifications"),
  });

export const useStudyGroups = () =>
  useQuery<StudyGroup[]>({
    queryKey: queryKeys.studyGroups(),
    queryFn: () => apiClient.get<StudyGroup[]>("/api/study-groups"),
  });

export const useLiveActivity = (take = 30) =>
  useQuery<LiveActivity[]>({
    queryKey: [...queryKeys.liveActivity(), take],
    queryFn: () => apiClient.get<LiveActivity[]>(`/api/insights/live-activity?take=${take}`),
  });

export const useGaps = () =>
  useQuery<Gap[]>({
    queryKey: queryKeys.gaps(),
    queryFn: () => apiClient.get<Gap[]>("/api/insights/gaps"),
  });

export const useDifferentiation = () =>
  useQuery<DifferentiationTier[]>({
    queryKey: queryKeys.differentiation(),
    queryFn: () => apiClient.get<DifferentiationTier[]>("/api/insights/differentiation"),
  });

export const useVerifications = () =>
  useQuery<Verification[]>({
    queryKey: queryKeys.verifications(),
    queryFn: () => apiClient.get<Verification[]>("/api/goals/verifications"),
  });

export const useGoalMilestones = (goalId: string) =>
  useQuery<Milestone[]>({
    queryKey: queryKeys.goalMilestones(goalId),
    queryFn: () => apiClient.get<Milestone[]>(`/api/goals/${goalId}/milestones`),
    enabled: !!goalId,
  });

export const reorderGoalMilestones = (goalId: string, milestoneIds: string[]) =>
  apiClient.patch(`/api/goals/${goalId}/milestones/order`, { milestoneIds });

export const useAuditLogs = (take = 60) =>
  useQuery<AuditLog[]>({
    queryKey: [...queryKeys.auditLogs(), take],
    queryFn: () => apiClient.get<AuditLog[]>(`/api/audit/logs?take=${take}`),
  });

export const useModerationQueue = () =>
  useQuery<ModerationFlag[]>({
    queryKey: queryKeys.moderationQueue(),
    queryFn: () => apiClient.get<ModerationFlag[]>("/api/moderation/queue"),
  });

export const useFeatureFlags = () =>
  useQuery<FeatureFlag[]>({
    queryKey: queryKeys.featureFlags(),
    queryFn: () => apiClient.get<FeatureFlag[]>("/api/feature-flags/flags"),
  });
