"use client";

import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Link from "next/link";
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
      <Stack
        direction={{ xs: "column", md: "row" }}
        spacing={{ xs: 2.5, md: 4 }}
        alignItems={{ xs: "flex-start", md: "flex-end" }}
        justifyContent="space-between"
      >
        <Box sx={{ flex: 1, minWidth: 0 }}>
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
        <Button
          component={Link}
          href="/dashboard/workspace"
          variant="contained"
          size="large"
          sx={{ flexShrink: 0, alignSelf: { xs: "stretch", md: "auto" } }}
        >
          Open workspace
        </Button>
      </Stack>
    </Box>
  );
}
