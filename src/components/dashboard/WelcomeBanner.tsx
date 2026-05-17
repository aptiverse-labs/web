"use client";

import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { useSession } from "next-auth/react";
import { useAssessments } from "@/lib/api/queries";
import dayjs from "dayjs";

const TIME_OF_DAY_LABELS = ["morning", "afternoon", "evening", "night"];

function timeOfDay(hour: number) {
  if (hour < 5) return TIME_OF_DAY_LABELS[3];
  if (hour < 12) return TIME_OF_DAY_LABELS[0];
  if (hour < 17) return TIME_OF_DAY_LABELS[1];
  if (hour < 22) return TIME_OF_DAY_LABELS[2];
  return TIME_OF_DAY_LABELS[3];
}

// Banner is now orientation only, no action surface. The "Open workspace"
// CTA was redundant: the hero SBA card below carries a "Start working"
// button that deeplinks to the workspace *with the assessment loaded* --
// strictly more useful than a context-free workspace-open. Two stacked
// filled-teal primary CTAs above the fold on mobile was the layout-
// hierarchy problem the layout pass exists to fix.

export function WelcomeBanner({ name }: { name?: string }) {
  const { data: session } = useSession();
  const u = (session?.user ?? {}) as { name?: string | null; firstName?: string };
  const resolved = name ?? u.firstName ?? u.name?.split(" ")[0] ?? "there";

  const now = new Date();
  const tod = timeOfDay(now.getHours());
  const weekday = dayjs(now).format("dddd");

  const assessmentsQuery = useAssessments();
  const next = (assessmentsQuery.data ?? [])
    .filter((a) => a.status !== "graded")
    .sort((a, b) => +new Date(a.dueDate) - +new Date(b.dueDate))[0];
  const daysOut = next ? dayjs(next.dueDate).diff(dayjs(), "day") : null;

  const deadlinePhrase =
    next && daysOut != null && daysOut >= 0
      ? daysOut === 0
        ? `${next.title} is due today.`
        : daysOut === 1
          ? `${next.title} is due tomorrow.`
          : `${next.title} is due in ${daysOut} days.`
      : null;

  return (
    <Box
      sx={{
        mb: 4,
        pb: 3,
        borderBottom: 1,
        borderColor: "divider",
      }}
    >
      <Typography variant="overline" color="text.secondary">
        {weekday} {tod}
      </Typography>
      <Typography variant="h4" component="h1" sx={{ fontWeight: 600, mt: 0.5 }}>
        Hi {resolved}.
      </Typography>
      <Typography
        variant="body1"
        color="text.secondary"
        sx={{ mt: 1, maxWidth: "62ch" }}
      >
        Pick up where you left off.{deadlinePhrase ? ` ${deadlinePhrase}` : ""}
      </Typography>
    </Box>
  );
}
