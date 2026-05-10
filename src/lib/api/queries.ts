"use client";

import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/fetcher";
import {
  COURSES,
  BURSARIES,
  CHILDREN,
  CLASSES,
  NOTIFICATIONS,
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
} from "@/lib/mockData";

// Mock fetch with delay so loading states render properly. Used only by
// hooks that haven't been wired to the real API yet — convert per page.
const fakeFetch = <T>(value: T, ms = 350): Promise<T> =>
  new Promise((res) => setTimeout(() => res(value), ms));

export const queryKeys = {
  subjects: () => ["subjects"] as const,
  subject: (id: string) => ["subject", id] as const,
  assessments: () => ["assessments"] as const,
  goals: () => ["goals"] as const,
  practiceTests: () => ["practice-tests"] as const,
  tutors: () => ["tutors"] as const,
  courses: () => ["courses"] as const,
  bursaries: () => ["bursaries"] as const,
  children: () => ["children"] as const,
  classes: () => ["classes"] as const,
  notifications: () => ["notifications"] as const,
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

export const useTutors = () =>
  useQuery<Tutor[]>({
    queryKey: queryKeys.tutors(),
    queryFn: () => apiClient.get<Tutor[]>("/api/marketplace/tutors"),
  });

export const useCourses = () =>
  useQuery<Course[]>({ queryKey: queryKeys.courses(), queryFn: () => fakeFetch(COURSES) });

export const useBursaries = () =>
  useQuery<Bursary[]>({ queryKey: queryKeys.bursaries(), queryFn: () => fakeFetch(BURSARIES) });

export const useChildren = () =>
  useQuery<Child[]>({ queryKey: queryKeys.children(), queryFn: () => fakeFetch(CHILDREN) });

export const useClasses = () =>
  useQuery<ClassRecord[]>({ queryKey: queryKeys.classes(), queryFn: () => fakeFetch(CLASSES) });

export const useNotifications = () =>
  useQuery<Notification[]>({ queryKey: queryKeys.notifications(), queryFn: () => fakeFetch(NOTIFICATIONS) });
