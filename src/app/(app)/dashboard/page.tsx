"use client";

import Grid from "@mui/material/Grid";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import LinearProgress from "@mui/material/LinearProgress";
import IconButton from "@mui/material/IconButton";
import Chip from "@mui/material/Chip";
import Skeleton from "@mui/material/Skeleton";
import { alpha } from "@mui/material/styles";
import Link from "next/link";
import dayjs from "dayjs";
import { motion } from "framer-motion";
import { AptiverseLineChart as LineChart } from "@/components/common/AptiverseLineChart";
import { ProgressRing } from "@/components/common/ProgressRing";
import { StatusChip } from "@/components/common/StatusChip";
import { RelativeTime } from "@/components/common/RelativeTime";
import { WelcomeBanner } from "@/components/dashboard/WelcomeBanner";
import {
  useSubjects,
  useAssessments,
  useGoals,
  useNotifications,
} from "@/lib/api/queries";
import { type Notification, type Subject } from "@/lib/mockData";
import { enter, enterStagger } from "@/lib/motion";
import ArrowForwardIcon from "@mui/icons-material/ArrowForwardOutlined";
import AssignmentIcon from "@mui/icons-material/AssignmentOutlined";
import CelebrationIcon from "@mui/icons-material/CelebrationOutlined";
import WarningAmberIcon from "@mui/icons-material/WarningAmberOutlined";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";

export default function StudentDashboardPage() {
  const subjectsQuery = useSubjects();
  const assessmentsQuery = useAssessments();
  const goalsQuery = useGoals();
  const notificationsQuery = useNotifications();

  const subjects = subjectsQuery.data ?? [];
  const assessments = assessmentsQuery.data ?? [];
  const goals = goalsQuery.data ?? [];
  const notifications = notificationsQuery.data ?? [];

  const upcoming = assessments
    .filter((a) => a.status !== "graded")
    .sort((a, b) => +new Date(a.dueDate) - +new Date(b.dueDate))
    .slice(0, 4);
  const activeGoals = goals
    .filter((g) => g.status === "active" || g.status === "at_risk")
    .slice(0, 3);
  const subjectsWithPredictions = subjects.filter((s) => s.predictedNextTerm != null);
  const predictedAverage =
    subjectsWithPredictions.length > 0
      ? Math.round(
          subjectsWithPredictions.reduce((acc, x) => acc + (x.predictedNextTerm ?? 0), 0) /
            subjectsWithPredictions.length,
        )
      : null;

  return (
    <>
      <WelcomeBanner />

      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        <Grid size={{ xs: 6, md: 3 }}>
          <Stat
            label="Predicted average"
            value={predictedAverage != null ? `${predictedAverage}` : "–"}
            unit={predictedAverage != null ? "%" : undefined}
            hint={subjects.length === 0 ? "Add subjects to see" : "Across your subjects"}
            index={0}
          />
        </Grid>
        <Grid size={{ xs: 6, md: 3 }}>
          <Stat
            label="Subjects"
            value={`${subjects.length}`}
            hint={subjects.length === 0 ? "Set up your timetable" : "Currently enrolled"}
            index={1}
          />
        </Grid>
        <Grid size={{ xs: 6, md: 3 }}>
          <Stat
            label="Active goals"
            value={`${activeGoals.length}`}
            hint={goals.length === 0 ? "Set one to start" : `${goals.length} total`}
            index={2}
          />
        </Grid>
        <Grid size={{ xs: 6, md: 3 }}>
          <Stat
            label="Upcoming SBAs"
            value={`${upcoming.length}`}
            hint={upcoming.length === 0 ? "Nothing on the horizon" : "Sorted by due date"}
            index={3}
          />
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, lg: 8 }}>
          <Stack spacing={3}>
            <MasteryTrendCard subjects={subjects} loading={subjectsQuery.isLoading} />
            <UpcomingAssessmentsCard
              upcoming={upcoming}
              subjects={subjects}
              loading={assessmentsQuery.isLoading}
              isEmpty={!assessmentsQuery.isLoading && upcoming.length === 0}
            />
          </Stack>
        </Grid>

        <Grid size={{ xs: 12, lg: 4 }}>
          <Stack spacing={3}>
            <TodaysFocusCard />
            <ActiveGoalsCard
              goals={activeGoals}
              loading={goalsQuery.isLoading}
              isEmpty={!goalsQuery.isLoading && activeGoals.length === 0}
            />
            <RecentNotificationsCard
              notifications={notifications}
              loading={notificationsQuery.isLoading}
              isEmpty={!notificationsQuery.isLoading && notifications.length === 0}
            />
          </Stack>
        </Grid>
      </Grid>
    </>
  );
}

// ─── Stat tile (no icon swatch — keeps the row calm at 4-up) ─────────

function Stat({
  label,
  value,
  unit,
  hint,
  index = 0,
}: {
  label: string;
  value: string;
  unit?: string;
  hint?: string;
  index?: number;
}) {
  return (
    <motion.div {...enterStagger(index)} style={{ height: "100%" }}>
      <Card sx={{ height: "100%" }}>
        <CardContent>
          <Typography variant="overline" color="text.secondary" sx={{ letterSpacing: "0.08em" }}>
            {label}
          </Typography>
          <Stack direction="row" alignItems="baseline" spacing={0.75} sx={{ mt: 0.5 }}>
            <Typography
              variant="h4"
              component="div"
              sx={{
                fontWeight: 600,
                lineHeight: 1.1,
                fontVariantNumeric: "tabular-nums",
              }}
            >
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

// ─── Mastery trend (full-width on lg/xl) ──────────────────────────────

function MasteryTrendCard({ subjects, loading }: { subjects: Subject[]; loading: boolean }) {
  const withData = subjects.filter((s) => s.termAverages && s.termAverages.length > 0);
  const empty = !loading && (subjects.length === 0 || withData.length === 0);

  return (
    <motion.div {...enter}>
      <Card>
        <CardContent sx={{ p: { xs: 2.5, sm: 3 } }}>
          <Stack direction="row" justifyContent="space-between" alignItems="flex-end" sx={{ mb: 2 }}>
            <Box>
              <Typography variant="overline" color="text.secondary" sx={{ letterSpacing: "0.08em" }}>
                Mastery
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Term-over-term
              </Typography>
            </Box>
            <Button
              component={Link}
              href="/dashboard/mastery"
              endIcon={<ArrowForwardIcon />}
              size="small"
            >
              Details
            </Button>
          </Stack>
          {loading ? (
            <Skeleton variant="rounded" height={280} />
          ) : empty ? (
            <Box sx={{ py: 6, textAlign: "center" }}>
              <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 360, mx: "auto" }}>
                {subjects.length === 0
                  ? "Add subjects, then log a few marks against them. Your term-over-term trend lives here."
                  : "Log marks against your subjects to see your trend appear."}
              </Typography>
            </Box>
          ) : (
            <LineChart
              height={280}
              xAxis={[{ data: ["T1", "T2", "T3", "T4"], scaleType: "point" }]}
              series={withData
                .slice(0, 5)
                .map((s) => ({
                  data: (s.termAverages ?? []).map((t) => t.mark),
                  label: s.name,
                  curve: "monotoneX",
                }))}
              margin={{ top: 16, right: 24, bottom: 32, left: 40 }}
            />
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

// ─── Upcoming assessments list ────────────────────────────────────────

type UpcomingItem = {
  id: string;
  title: string;
  subjectId?: string;
  type: string;
  weight: number;
  dueDate: string;
  predictedMark?: number | null;
};

function UpcomingAssessmentsCard({
  upcoming,
  subjects,
  loading,
  isEmpty,
}: {
  upcoming: UpcomingItem[];
  subjects: Subject[];
  loading: boolean;
  isEmpty: boolean;
}) {
  return (
    <motion.div {...enter}>
      <Card>
        <CardContent sx={{ p: { xs: 2.5, sm: 3 } }}>
          <Stack direction="row" justifyContent="space-between" alignItems="flex-end" sx={{ mb: 2 }}>
            <Box>
              <Typography variant="overline" color="text.secondary" sx={{ letterSpacing: "0.08em" }}>
                Up next
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Upcoming SBAs
              </Typography>
            </Box>
            <Button
              component={Link}
              href="/dashboard/assessments"
              endIcon={<ArrowForwardIcon />}
              size="small"
            >
              All
            </Button>
          </Stack>
          {loading ? (
            <Stack spacing={1.25}>
              <Skeleton variant="rounded" height={68} />
              <Skeleton variant="rounded" height={68} />
              <Skeleton variant="rounded" height={68} />
            </Stack>
          ) : isEmpty ? (
            <Box sx={{ py: 5, textAlign: "center" }}>
              <Typography variant="body2" color="text.secondary">
                Nothing on the horizon. Enjoy the breather, or get ahead.
              </Typography>
            </Box>
          ) : (
            <Stack spacing={1.25}>
              {upcoming.map((a) => {
                const subject = subjects.find((s) => s.id === a.subjectId);
                const daysLeft = dayjs(a.dueDate).diff(dayjs(), "day");
                const urgent = daysLeft >= 0 && daysLeft <= 3;
                return (
                  <Box
                    key={a.id}
                    component={Link}
                    href={`/dashboard/assessments/${a.id}`}
                    sx={{
                      p: 2,
                      borderRadius: 1.5,
                      border: 1,
                      borderColor: "divider",
                      display: "flex",
                      alignItems: "center",
                      gap: 2,
                      textDecoration: "none",
                      color: "inherit",
                      transition:
                        "border-color 180ms cubic-bezier(0.165, 0.84, 0.44, 1), background-color 180ms cubic-bezier(0.165, 0.84, 0.44, 1)",
                      "&:hover": {
                        borderColor: "primary.main",
                        bgcolor: (t) => alpha(t.palette.primary.main, 0.03),
                      },
                    }}
                  >
                    <Box
                      sx={{
                        width: 36,
                        height: 36,
                        borderRadius: 1,
                        display: "grid",
                        placeItems: "center",
                        color: "primary.main",
                        bgcolor: (t) =>
                          alpha(t.palette.primary.main, t.palette.mode === "dark" ? 0.12 : 0.08),
                        flexShrink: 0,
                      }}
                    >
                      <AssignmentIcon fontSize="small" />
                    </Box>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600 }} noWrap>
                        {a.title}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {subject?.name ?? "No subject"} · {a.type} · {a.weight}%
                      </Typography>
                    </Box>
                    <Box sx={{ textAlign: "right", display: { xs: "none", sm: "block" } }}>
                      <Typography variant="caption" color="text.secondary">
                        Predicted
                      </Typography>
                      <Typography
                        variant="subtitle2"
                        sx={{ fontWeight: 600, fontVariantNumeric: "tabular-nums" }}
                      >
                        {a.predictedMark != null ? `${a.predictedMark}%` : "–"}
                      </Typography>
                    </Box>
                    <Chip
                      label={urgent ? `${daysLeft}d` : dayjs(a.dueDate).format("DD MMM")}
                      size="small"
                      color={urgent ? "warning" : "default"}
                      variant={urgent ? "filled" : "outlined"}
                      sx={{ fontWeight: 600, fontVariantNumeric: "tabular-nums" }}
                    />
                  </Box>
                );
              })}
            </Stack>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

// ─── Today's focus (empty-state honest) ───────────────────────────────

function TodaysFocusCard() {
  return (
    <motion.div {...enter}>
      <Card>
        <CardContent sx={{ p: 3 }}>
          <Typography variant="overline" color="text.secondary" sx={{ letterSpacing: "0.08em" }}>
            Today
          </Typography>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
            Focus session
          </Typography>
          <Stack alignItems="center" spacing={1.5}>
            <ProgressRing value={0} size={132} thickness={10} caption="of daily target" />
            <Typography variant="body2" color="text.secondary" sx={{ textAlign: "center" }}>
              Start a session to begin tracking today's minutes.
            </Typography>
            <Button fullWidth component={Link} href="/dashboard/workspace" variant="contained">
              Start focus session
            </Button>
          </Stack>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// ─── Active goals (compact list) ──────────────────────────────────────

function ActiveGoalsCard({
  goals,
  loading,
  isEmpty,
}: {
  goals: { id: string; title: string; progress: number; status: string }[];
  loading: boolean;
  isEmpty: boolean;
}) {
  return (
    <motion.div {...enter}>
      <Card>
        <CardContent sx={{ p: 3 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="flex-end" sx={{ mb: 1.5 }}>
            <Box>
              <Typography variant="overline" color="text.secondary" sx={{ letterSpacing: "0.08em" }}>
                In progress
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Active goals
              </Typography>
            </Box>
            <IconButton size="small" component={Link} href="/dashboard/goals" aria-label="All goals">
              <ArrowForwardIcon fontSize="small" />
            </IconButton>
          </Stack>
          {loading ? (
            <Stack spacing={1.5}>
              <Skeleton variant="rounded" height={36} />
              <Skeleton variant="rounded" height={36} />
            </Stack>
          ) : isEmpty ? (
            <Typography variant="body2" color="text.secondary">
              No active goals yet. Set one to start tracking.
            </Typography>
          ) : (
            <Stack spacing={2}>
              {goals.map((g) => (
                <Box key={g.id}>
                  <Stack
                    direction="row"
                    justifyContent="space-between"
                    alignItems="center"
                    sx={{ mb: 0.5 }}
                  >
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {g.title}
                    </Typography>
                    <StatusChip
                      kind={g.status === "at_risk" ? "warning" : "primary"}
                      label={`${g.progress}%`}
                    />
                  </Stack>
                  <LinearProgress
                    variant="determinate"
                    value={g.progress}
                    color={g.status === "at_risk" ? "warning" : "primary"}
                  />
                </Box>
              ))}
            </Stack>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

// ─── Recent notifications (no emoji — real icons) ────────────────────

function notificationIcon(kind: string) {
  switch (kind) {
    case "celebration": return <CelebrationIcon fontSize="small" />;
    case "alert":       return <WarningAmberIcon fontSize="small" />;
    case "reminder":    return <InfoOutlinedIcon fontSize="small" />;
    default:            return <InfoOutlinedIcon fontSize="small" />;
  }
}

function notificationTint(kind: string): "primary" | "achievement" | "warning" {
  // celebration -> achievement (amber): per DESIGN.md the Sacred-Amber
  // Rule reserves amber for earned milestones. A "you hit your goal"
  // notification is exactly that. The previous "secondary" (terracotta)
  // tint coded a celebration as warm-attention/"needs work", inverting
  // the meaning.
  if (kind === "celebration") return "achievement";
  if (kind === "alert")       return "warning";
  return "primary";
}

function RecentNotificationsCard({
  notifications,
  loading,
  isEmpty,
}: {
  notifications: Notification[];
  loading: boolean;
  isEmpty: boolean;
}) {
  return (
    <motion.div {...enter}>
      <Card>
        <CardContent sx={{ p: 3 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="flex-end" sx={{ mb: 1.5 }}>
            <Box>
              <Typography variant="overline" color="text.secondary" sx={{ letterSpacing: "0.08em" }}>
                Recent
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Activity
              </Typography>
            </Box>
            <IconButton
              size="small"
              component={Link}
              href="/dashboard/notifications"
              aria-label="All notifications"
            >
              <ArrowForwardIcon fontSize="small" />
            </IconButton>
          </Stack>
          {loading ? (
            <Stack spacing={1.25}>
              <Skeleton variant="rounded" height={48} />
              <Skeleton variant="rounded" height={48} />
              <Skeleton variant="rounded" height={48} />
            </Stack>
          ) : isEmpty ? (
            <Typography variant="body2" color="text.secondary">
              You're all caught up.
            </Typography>
          ) : (
            <Stack spacing={2}>
              {notifications.slice(0, 3).map((n) => {
                const tint = notificationTint(n.kind);
                return (
                  <Stack key={n.id} direction="row" spacing={1.5} alignItems="flex-start">
                    <Box
                      sx={{
                        width: 32,
                        height: 32,
                        borderRadius: 1,
                        display: "grid",
                        placeItems: "center",
                        color: `${tint}.main`,
                        bgcolor: (t) => alpha(t.palette[tint].main, 0.1),
                        flexShrink: 0,
                      }}
                    >
                      {notificationIcon(n.kind)}
                    </Box>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography variant="body2" sx={{ fontWeight: n.read ? 400 : 600 }}>
                        {n.title}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        <RelativeTime iso={n.time} />
                      </Typography>
                    </Box>
                  </Stack>
                );
              })}
            </Stack>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
