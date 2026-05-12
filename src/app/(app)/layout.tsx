"use client";

import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { AIHelpBot } from "@/components/dashboard/AIHelpBot";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardShell>
      {children}
      <AIHelpBot />
    </DashboardShell>
  );
}
