"use client";

import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { AIHelpBot } from "@/components/dashboard/AIHelpBot";
import { useAutoRefreshSession } from "@/lib/hooks/useAutoRefreshSession";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  // Quietly re-issues the JWT before it expires so a tab left open
  // overnight doesn't kick the user to /login on the next click.
  useAutoRefreshSession();

  return (
    <DashboardShell>
      {children}
      <AIHelpBot />
    </DashboardShell>
  );
}
