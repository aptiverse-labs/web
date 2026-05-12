"use client";

import Grid from "@mui/material/Grid";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import LinearProgress from "@mui/material/LinearProgress";
import Avatar from "@mui/material/Avatar";
import IconButton from "@mui/material/IconButton";
import Chip from "@mui/material/Chip";
import Skeleton from "@mui/material/Skeleton";
import { AptiverseLineChart as LineChart } from "@/components/common/AptiverseLineChart";
import { AptiverseBarChart as BarChart } from "@/components/common/AptiverseBarChart";
import Link from "next/link";
import dayjs from "dayjs";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import AssignmentIcon from "@mui/icons-material/AssignmentOutlined";
import QuizIcon from "@mui/icons-material/QuizOutlined";
import FlagIcon from "@mui/icons-material/FlagOutlined";
import SchoolIcon from "@mui/icons-material/School";
import FavoriteIcon from "@mui/icons-material/FavoriteBorder";
import { WelcomeBanner } from "@/components/dashboard/WelcomeBanner";
import { StatCard } from "@/components/common/StatCard";
import { ProgressRing } from "@/components/common/ProgressRing";
import { StatusChip } from "@/components/common/StatusChip";
import { RelativeTime } from "@/components/common/RelativeTime";
import {
  useSubjects,
  useAssessments,
  useGoals,
  useNotifications,
} from "@/lib/api/queries";
import { type Notification, type Subject } from "@/lib/mockData";

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

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            label="Predicted average"
            value={predictedAverage != null ? `${predictedAverage}%` : "—"}
            hint={subjects.length === 0 ? "Add subjects to see" : undefined}
            icon={<SchoolIcon />}
            color="primary"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard label="Active goals" value={activeGoals.length} hint={goals.length === 0 ? "Set one to start" : `${goals.length} total`} icon={<FlagIcon />} color="secondary" />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard label="APS (live)" value="—" hint="Not yet computed" icon={<QuizIcon />} color="info" />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard label="Wellbeing" value="—" hint="Check in via Diary" icon={<FavoriteIcon />} color="success" />
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
            <Card>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  Today's focus
                </Typography>
                <Stack alignItems="center" spacing={1.5}>
                  <ProgressRing value={0} size={140} thickness={10} caption="of daily target" />
                  <Typography variant="caption" color="text.secondary">
                    Start a focus session to begin tracking today's minutes.
                  </Typography>
                  <Button fullWidth component={Link} href="/dashboard/workspace" variant="contained">
                    Start focus session
                  </Button>
                </Stack>
              </CardContent>
            </Card>

            <ActiveGoalsCard
              goals={activeGoals}
              loading={goalsQuery.isLoading}
              isEmpty={!goalsQuery.isLoading && activeGoals.length === 0}
            />

            <Card>
              <CardContent sx={{ p: 3 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.5 }}>
                  <Typography variant="h6">Mood this week</Typography>
                  <Button size="small" component={Link} href="/dashboard/diary">
                    Check in
                  </Button>
                </Stack>
                <Typography variant="body2" color="text.secondary">
                  No mood data yet. Log a diary entry to start seeing your weekly trend.
                </Typography>
              </CardContent>
            </Card>

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

function MasteryTrendCard({ subjects, loading }: { subjects: Subject[]; loading: boolean }) {
  return (
    <Card>
      <CardContent sx={{ p: 3 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-end" sx={{ mb: 2 }}>
          <Box>
            <Typography variant="h6">Mastery trend</Typography>
            <Typography variant="body2" color="text.secondary">
              How you're growing across your subjects this year
            </Typography>
          </Box>
          <Button component={Link} href="/dashboard/mastery" endIcon={<ArrowForwardIcon />} size="small">
            Details
          </Button>
        </Stack>
        {loading ? (
          <Skeleton variant="rounded" height={300} />
        ) : subjects.length === 0 ? (
          <Box sx={{ py: 6, textAlign: "center" }}>
            <Typography variant="body2" color="text.secondary">
              No subjects yet — add some to see your term-over-term trend.
            </Typography>
          </Box>
        ) : subjects.every((s) => !s.termAverages || s.termAverages.length === 0) ? (
          <Box sx={{ py: 6, textAlign: "center" }}>
            <Typography variant="body2" color="text.secondary">
              Log marks against your subjects to see your term-over-term trend appear here.
            </Typography>
          </Box>
        ) : (
          <LineChart
            height={300}
            xAxis={[{ data: ["T1", "T2", "T3", "T4"], scaleType: "point" }]}
            series={subjects
              .filter((s) => s.termAverages && s.termAverages.length > 0)
              .slice(0, 5)
              .map((s) => ({
                data: (s.termAverages ?? []).map((t) => t.mark),
                label: s.name,
              }))}
            margin={{ top: 16, right: 24, bottom: 32, left: 40 }}
          />
        )}
      </CardContent>
    </Card>
  );
}

function UpcomingAssessmentsCard({
  upcoming,
  subjects,
  loading,
  isEmpty,
}: {
  upcoming: ReturnType<typeof Array.prototype.filter>;
  subjects: Subject[];
  loading: boolean;
  isEmpty: boolean;
}) {
  return (
    <Card>
      <CardContent sx={{ p: 3 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
          <Box>
            <Typography variant="h6">Upcoming assessments</Typography>
            <Typography variant="body2" color="text.secondary">
              Sorted by due date — predicted marks updated daily
            </Typography>
          </Box>
          <Button component={Link} href="/dashboard/assessments" endIcon={<ArrowForwardIcon />} size="small">
            All assessments
          </Button>
        </Stack>
        {loading ? (
          <Stack spacing={1}>
            <Skeleton variant="rounded" height={64} />
            <Skeleton variant="rounded" height={64} />
            <Skeleton variant="rounded" height={64} />
          </Stack>
        ) : isEmpty ? (
          <Box sx={{ py: 4, textAlign: "center" }}>
            <Typography variant="body2" color="text.secondary">
              Nothing on the horizon. Enjoy the breather, or get ahead.
            </Typography>
          </Box>
        ) : (
          <Stack spacing={1.5}>
            {upcoming.map((a: { id: string; title: string; subjectId?: string; type: string; weight: number; dueDate: string; predictedMark?: number | null }) => {
              const subject = subjects.find((s) => s.id === a.subjectId);
              const daysLeft = dayjs(a.dueDate).diff(dayjs(), "day");
              const urgent = daysLeft <= 3;
              return (
                <Box
                  key={a.id}
                  sx={{
                    p: 2,
                    borderRadius: 2,
                    border: 1,
                    borderColor: "divider",
                    display: "flex",
                    alignItems: "center",
                    gap: 2,
                  }}
                >
                  <Box
                    sx={{
                      width: 44,
                      height: 44,
                      borderRadius: 1.5,
                      display: "grid",
                      placeItems: "center",
                      bgcolor: "action.hover",
                      color: "primary.main",
                      flexShrink: 0,
                    }}
                  >
                    <AssignmentIcon />
                  </Box>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                      {a.title}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {subject?.name ?? "—"} · {a.type} · weighting {a.weight}%
                    </Typography>
                  </Box>
                  <Box sx={{ textAlign: "right", display: { xs: "none", sm: "block" } }}>
                    <Typography variant="caption" color="text.secondary">
                      Predicted
                    </Typography>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, color: "primary.main" }}>
                      {a.predictedMark ?? "—"}%
                    </Typography>
                  </Box>
                  <Chip
                    label={urgent ? `${daysLeft}d left` : `Due ${dayjs(a.dueDate).format("DD MMM")}`}
                    size="small"
                    color={urgent ? "warning" : "default"}
                    variant={urgent ? "filled" : "outlined"}
                    sx={{ fontWeight: 600 }}
                  />
                </Box>
              );
            })}
          </Stack>
        )}
      </CardContent>
    </Card>
  );
}

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
    <Card>
      <CardContent sx={{ p: 3 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.5 }}>
          <Typography variant="h6">Active goals</Typography>
          <IconButton size="small" component={Link} href="/dashboard/goals">
            <ArrowForwardIcon fontSize="small" />
          </IconButton>
        </Stack>
        {loading ? (
          <Stack spacing={1.5}>
            <Skeleton variant="rounded" height={36} />
            <Skeleton variant="rounded" height={36} />
            <Skeleton variant="rounded" height={36} />
          </Stack>
        ) : isEmpty ? (
          <Typography variant="body2" color="text.secondary">
            No active goals — set one to start tracking.
          </Typography>
        ) : (
          <Stack spacing={2}>
            {goals.map((g) => (
              <Box key={g.id}>
                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.5 }}>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    {g.title}
                  </Typography>
                  <StatusChip kind={g.status === "at_risk" ? "warning" : "primary"} label={`${g.progress}%`} />
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
  );
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
    <Card>
      <CardContent sx={{ p: 3 }}>
        <Typography variant="h6" sx={{ mb: 1.5 }}>
          Recent
        </Typography>
        {loading ? (
          <Stack spacing={1.25}>
            <Skeleton variant="rounded" height={48} />
            <Skeleton variant="rounded" height={48} />
            <Skeleton variant="rounded" height={48} />
          </Stack>
        ) : isEmpty ? (
          <Typography variant="body2" color="text.secondary">
            No notifications yet. You're all caught up.
          </Typography>
        ) : (
          <Stack spacing={1.5}>
            {notifications.slice(0, 3).map((n) => (
              <Stack key={n.id} direction="row" spacing={1.5} alignItems="flex-start">
                <Avatar
                  sx={{
                    width: 32,
                    height: 32,
                    bgcolor:
                      n.kind === "celebration"
                        ? "secondary.main"
                        : n.kind === "alert"
                          ? "warning.main"
                          : "primary.main",
                    color:
                      n.kind === "celebration"
                        ? "secondary.contrastText"
                        : n.kind === "alert"
                          ? "warning.contrastText"
                          : "primary.contrastText",
                    fontSize: "0.75rem",
                  }}
                >
                  {n.kind === "celebration" ? "🎉" : n.kind === "alert" ? "!" : "i"}
                </Avatar>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography variant="body2" sx={{ fontWeight: n.read ? 400 : 600 }}>
                    {n.title}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    <RelativeTime iso={n.time} />
                  </Typography>
                </Box>
              </Stack>
            ))}
          </Stack>
        )}
      </CardContent>
    </Card>
  );
}
