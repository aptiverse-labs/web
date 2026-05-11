"use client";

import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { GradientBackdrop } from "@/components/common/GradientBackdrop";
import { useAssessments } from "@/lib/api/queries";
import dayjs from "dayjs";

export function WelcomeBanner({ name }: { name?: string }) {
  const { data: session } = useSession();
  const u = (session?.user ?? {}) as { name?: string | null; firstName?: string };
  const resolved = name ?? u.firstName ?? u.name?.split(" ")[0] ?? "there";
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  // Find the next not-yet-graded assessment so the banner says something
  // real about today's reality instead of a hardcoded "English essay".
  const assessmentsQuery = useAssessments();
  const next = (assessmentsQuery.data ?? [])
    .filter((a) => a.status !== "graded")
    .sort((a, b) => +new Date(a.dueDate) - +new Date(b.dueDate))[0];
  const daysOut = next ? dayjs(next.dueDate).diff(dayjs(), "day") : null;

  return (
    <GradientBackdrop variant="hero" sx={{ borderRadius: 3, mb: 4, border: 1, borderColor: "divider" }}>
      <Stack
        direction={{ xs: "column", md: "row" }}
        spacing={3}
        alignItems={{ xs: "flex-start", md: "center" }}
        justifyContent="space-between"
        sx={{ p: { xs: 3, md: 4 } }}
      >
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="overline" color="primary.main">
            {greeting}, {resolved}
          </Typography>
          <Typography variant="h4" sx={{ mb: 1, fontWeight: 600 }}>
            {next ? (
              <>
                Next up:{" "}
                <Box component="span" sx={{ color: "primary.main" }}>
                  {next.title}
                </Box>
                {daysOut != null && daysOut >= 0 && (
                  <Box component="span" sx={{ color: "text.secondary", fontWeight: 400 }}>
                    {" "}
                    · {daysOut === 0 ? "today" : `${daysOut} day${daysOut === 1 ? "" : "s"}`}
                  </Box>
                )}
              </>
            ) : (
              "Welcome back — let's pick up where you left off."
            )}
          </Typography>
          <Typography variant="body1" color="text.secondary">
            {next
              ? "Open the workspace to see your plan, or do a quick practice session to keep momentum."
              : "Add a goal or jump into practice to start tracking progress."}
          </Typography>
        </Box>
        <Stack direction="row" spacing={1.25}>
          <Button component={Link} href="/dashboard/workspace" variant="contained" size="large">
            Open workspace
          </Button>
          <Button component={Link} href="/dashboard/practice" variant="outlined" size="large">
            Quick practice
          </Button>
        </Stack>
      </Stack>
    </GradientBackdrop>
  );
}
