"use client";

import { useSession } from "next-auth/react";
import { type FeatureKey, type PlanCode } from "@/lib/features";

// Reads the user's feature entitlements off the NextAuth session.
// Features land there via the API's /api/auth/login response (see
// AuthService → UserDto.Features), which session.user spreads in.
export function useFeature(feature: FeatureKey): boolean {
  const { data: session } = useSession();
  const features = (session?.user as { features?: string[] } | undefined)?.features ?? [];
  return features.includes(feature);
}

export function useFeatures(): {
  features: ReadonlySet<FeatureKey>;
  has: (f: FeatureKey) => boolean;
  hasAny: (fs: FeatureKey[]) => boolean;
  hasAll: (fs: FeatureKey[]) => boolean;
} {
  const { data: session } = useSession();
  const list = (session?.user as { features?: string[] } | undefined)?.features ?? [];
  const set = new Set(list as FeatureKey[]);
  return {
    features: set,
    has: (f) => set.has(f),
    hasAny: (fs) => fs.some((f) => set.has(f)),
    hasAll: (fs) => fs.every((f) => set.has(f)),
  };
}

export function usePlanCode(): PlanCode {
  const { data: session } = useSession();
  const p = (session?.user as { planCode?: string } | undefined)?.planCode;
  if (p === "student" || p === "family" || p === "school") return p;
  return "free";
}
