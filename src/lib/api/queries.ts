"use client";

import { useQuery } from "@tanstack/react-query";
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
  useQuery<ClassRecord[]>({ queryKey: queryKeys.classes(), queryFn: () => fakeFetch(CLASSES) });

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
