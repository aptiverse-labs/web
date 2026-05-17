"use client";

import Card from "@mui/material/Card";
import CardActionArea from "@mui/material/CardActionArea";
import CardContent from "@mui/material/CardContent";
import Grid from "@mui/material/Grid";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Box from "@mui/material/Box";
import Skeleton from "@mui/material/Skeleton";
import Link from "next/link";
import { useMemo } from "react";
import { motion } from "framer-motion";
import { AptiverseLineChart as LineChart } from "@/components/common/AptiverseLineChart";
import { PageHeader } from "@/components/common/PageHeader";
import { useWellbeingSummary, useMoodTrend } from "@/lib/api/queries";
import type { MoodPoint, WellbeingSummary } from "@/lib/mockData";
import SelfImprovementIcon from "@mui/icons-material/SelfImprovementOutlined";
import PsychologyIcon from "@mui/icons-material/PsychologyOutlined";
import HeadphonesIcon from "@mui/icons-material/HeadphonesOutlined";
import MenuBookIcon from "@mui/icons-material/MenuBookOutlined";
import EditNoteIcon from "@mui/icons-material/EditNoteOutlined";
import ArrowForwardIcon from "@mui/icons-material/ArrowForwardOutlined";

// One enter animation, used everywhere on the page so motion stays
// internally consistent. Spring + 8px rise, short stagger — the
// emil-kowalski rubric: motion has intent, never decorates.
const enter = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  transition: { type: "spring", stiffness: 300, damping: 30 } as const,
};

const STRESS_COPY: Record<WellbeingSummary["stressSignal"], { label: string; hint: string }> = {
  none:     { label: "No signal yet", hint: "Check in to start tracking" },
  low:      { label: "Low",           hint: "No alerts this week" },
  moderate: { label: "Moderate",      hint: "Worth slowing down" },
  high:     { label: "High",          hint: "Take a break today" },
};

const hasCheckedIn = (s: WellbeingSummary | undefined): boolean =>
  !!s && (s.moodAvg7d > 0 || s.checkinStreakDays > 0);

export default function WellbeingPage() {
  const summaryQ = useWellbeingSummary();
  const trendQ   = useMoodTrend(14);

  const summary  = summaryQ.data;
  const populated = hasCheckedIn(summary);
  const loading   = summaryQ.isLoading || trendQ.isLoading;

  return (
    <>
      <PageHeader
        title="Wellbeing"
        description="Daily check-ins, breathing tools, and people to talk to. Small habits, real signal."
        breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Wellbeing" }]}
      />

      {loading ? (
        <SummarySkeleton />
      ) : populated ? (
        <PopulatedSummary summary={summary!} trend={trendQ.data ?? []} />
      ) : (
        <FirstCheckIn />
      )}

      <Box sx={{ mt: 4 }}>
        <QuickTools />
      </Box>
    </>
  );
}

// ─── Populated state ──────────────────────────────────────────────────

function PopulatedSummary({ summary, trend }: { summary: WellbeingSummary; trend: MoodPoint[] }) {
  const stress = STRESS_COPY[summary.stressSignal];

  return (
    <>
      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Stat label="Mood (7-day avg)" value={summary.moodAvg7d.toFixed(1)} unit="/ 5" />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Stat label="Stress" value={stress.label} hint={stress.hint} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Stat
            label="Sleep"
            value={summary.sleepHours > 0 ? formatHours(summary.sleepHours) : "—"}
            hint={summary.sleepHours > 0 ? "Average over 7 days" : "Log sleep on your check-in"}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Stat
            label="Check-in streak"
            value={`${summary.checkinStreakDays}`}
            unit={summary.checkinStreakDays === 1 ? "day" : "days"}
            hint={summary.checkinStreakDays >= 7 ? "Beautiful." : "Keep it going"}
          />
        </Grid>
      </Grid>

      <Card>
        <CardContent sx={{ p: { xs: 2.5, sm: 3 } }}>
          <Stack direction={{ xs: "column", sm: "row" }} alignItems={{ sm: "baseline" }} justifyContent="space-between" sx={{ mb: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Mood over the past 14 days
            </Typography>
            <Typography variant="caption" color="text.secondary">
              1 = rough · 5 = great
            </Typography>
          </Stack>

          {trend.length === 0 ? (
            <Box sx={{ py: 6, textAlign: "center", color: "text.secondary" }}>
              <Typography variant="body2">
                Your trend will appear here once you've logged a few check-ins.
              </Typography>
            </Box>
          ) : (
            <MoodChart trend={trend} />
          )}
        </CardContent>
      </Card>
    </>
  );
}

function MoodChart({ trend }: { trend: MoodPoint[] }) {
  const data = useMemo(
    () =>
      trend.map((p) => ({
        label: new Date(p.date).toLocaleDateString(undefined, { day: "numeric", month: "short" }),
        mood: p.mood,
      })),
    [trend],
  );

  return (
    <LineChart
      height={240}
      xAxis={[{ data: data.map((d) => d.label), scaleType: "point" }]}
      yAxis={[{ min: 1, max: 5 }]}
      series={[
        {
          data: data.map((d) => d.mood),
          label: "Mood",
          curve: "monotoneX",
          color: "#1F8079",
          showMark: true,
        },
      ]}
      grid={{ horizontal: true }}
    />
  );
}

// ─── Stat tile ────────────────────────────────────────────────────────

function Stat({ label, value, unit, hint }: { label: string; value: string; unit?: string; hint?: string }) {
  return (
    <motion.div {...enter} style={{ height: "100%" }}>
      <Card sx={{ height: "100%" }}>
        <CardContent>
          <Typography variant="overline" color="text.secondary" sx={{ letterSpacing: "0.08em" }}>
            {label}
          </Typography>
          <Stack direction="row" alignItems="baseline" spacing={0.75} sx={{ mt: 0.5 }}>
            <Typography variant="h4" component="div" sx={{ fontWeight: 600, lineHeight: 1.1 }}>
              {value}
            </Typography>
            {unit && (
              <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                {unit}
              </Typography>
            )}
          </Stack>
          {hint && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              {hint}
            </Typography>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

// ─── First-check-in hero (no data yet) ────────────────────────────────

function FirstCheckIn() {
  return (
    <motion.div {...enter}>
      <Card>
        <CardContent sx={{ p: { xs: 3, sm: 5 } }}>
          <Grid container spacing={3} alignItems="center">
            <Grid size={{ xs: 12, md: 7 }}>
              <Typography variant="overline" color="primary.main" sx={{ letterSpacing: "0.08em" }}>
                Start small
              </Typography>
              <Typography variant="h4" component="h2" sx={{ fontWeight: 600, mt: 1, mb: 1.5, lineHeight: 1.2 }}>
                Thirty seconds to check in.
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 3, maxWidth: 460 }}>
                A daily mood log helps you (and the people who care about you) spot rough patches before they pile up. No streaks to chase yet — just one honest answer.
              </Typography>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
                <Button
                  component={Link}
                  href="/dashboard/diary"
                  variant="contained"
                  size="large"
                  endIcon={<ArrowForwardIcon />}
                >
                  Start your first check-in
                </Button>
                <Button
                  component={Link}
                  href="/dashboard/psychologist"
                  variant="text"
                  size="large"
                >
                  Or talk to someone
                </Button>
              </Stack>
            </Grid>
            <Grid size={{ xs: 12, md: 5 }}>
              <CheckInPreview />
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// A small illustrative preview of the 1–5 mood scale. Static — no
// fake data, just a visual cue of what the check-in itself looks like.
function CheckInPreview() {
  return (
    <Box
      sx={{
        border: 1,
        borderColor: "divider",
        borderRadius: 2,
        p: 3,
        bgcolor: (t) => (t.palette.mode === "dark" ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.02)"),
      }}
    >
      <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1.5 }}>
        How are you feeling today?
      </Typography>
      <Stack direction="row" spacing={1} justifyContent="space-between">
        {[1, 2, 3, 4, 5].map((n) => (
          <Box
            key={n}
            sx={{
              flex: 1,
              aspectRatio: "1",
              borderRadius: 1.5,
              border: 1,
              borderColor: "divider",
              display: "grid",
              placeItems: "center",
              fontWeight: 600,
              color: "text.secondary",
              fontSize: 18,
            }}
          >
            {n}
          </Box>
        ))}
      </Stack>
      <Stack direction="row" justifyContent="space-between" sx={{ mt: 1 }}>
        <Typography variant="caption" color="text.secondary">Rough</Typography>
        <Typography variant="caption" color="text.secondary">Great</Typography>
      </Stack>
    </Box>
  );
}

// ─── Loading skeleton (layout-stable) ─────────────────────────────────

function SummarySkeleton() {
  return (
    <>
      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        {[0, 1, 2, 3].map((i) => (
          <Grid key={i} size={{ xs: 12, sm: 6, md: 3 }}>
            <Card>
              <CardContent>
                <Skeleton variant="text" width="60%" />
                <Skeleton variant="text" width="40%" height={42} sx={{ mt: 0.5 }} />
                <Skeleton variant="text" width="70%" sx={{ mt: 1 }} />
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
      <Card>
        <CardContent sx={{ p: 3 }}>
          <Skeleton variant="text" width={200} height={28} sx={{ mb: 2 }} />
          <Skeleton variant="rounded" height={240} />
        </CardContent>
      </Card>
    </>
  );
}

// ─── Quick tools row ──────────────────────────────────────────────────

const TOOLS = [
  {
    icon: <EditNoteIcon />,
    title: "Daily check-in",
    description: "A 30-second mood log. The whole foundation.",
    cta: "Open diary",
    href: "/dashboard/diary",
  },
  {
    icon: <SelfImprovementIcon />,
    title: "Breathing exercise",
    description: "Box breathing — five minutes, slower heart, calmer head.",
    cta: "Start",
    href: "/dashboard/diary?tool=breathing",
  },
  {
    icon: <PsychologyIcon />,
    title: "Talk to a psychologist",
    description: "Verified counsellors. Book a 30-minute session.",
    cta: "See counsellors",
    href: "/dashboard/psychologist",
  },
  {
    icon: <MenuBookIcon />,
    title: "Stories that helped",
    description: "South Africans who struggled before they soared.",
    cta: "Read",
    href: "/dashboard/journey",
  },
] as const;

function QuickTools() {
  return (
    <Stack spacing={2}>
      <Typography variant="overline" color="text.secondary" sx={{ letterSpacing: "0.08em" }}>
        Quick tools
      </Typography>
      <Grid container spacing={2.5}>
        {TOOLS.map((t, i) => (
          <Grid key={t.title} size={{ xs: 12, sm: 6, md: 3 }}>
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 30, delay: i * 0.04 }}
              style={{ height: "100%" }}
            >
              <Card sx={{ height: "100%" }}>
                <CardActionArea component={Link} href={t.href} sx={{ height: "100%" }}>
                  <CardContent sx={{ p: 3, display: "flex", flexDirection: "column", gap: 1.5, height: "100%" }}>
                    <Box
                      sx={{
                        width: 36,
                        height: 36,
                        borderRadius: 1.5,
                        display: "grid",
                        placeItems: "center",
                        color: "primary.main",
                        bgcolor: (theme) =>
                          theme.palette.mode === "dark"
                            ? "rgba(63,157,149,0.12)"
                            : "rgba(15,105,99,0.08)",
                      }}
                    >
                      {t.icon}
                    </Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                      {t.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ flex: 1 }}>
                      {t.description}
                    </Typography>
                    <Stack direction="row" spacing={0.5} alignItems="center" sx={{ color: "primary.main", mt: 0.5 }}>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {t.cta}
                      </Typography>
                      <ArrowForwardIcon sx={{ fontSize: 16 }} />
                    </Stack>
                  </CardContent>
                </CardActionArea>
              </Card>
            </motion.div>
          </Grid>
        ))}
      </Grid>
    </Stack>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────

function formatHours(h: number): string {
  const whole = Math.floor(h);
  const mins  = Math.round((h - whole) * 60);
  return mins === 0 ? `${whole}h` : `${whole}h ${mins}m`;
}
