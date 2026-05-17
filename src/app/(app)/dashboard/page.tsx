"use client";

import Grid from "@mui/material/Grid";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import LinearProgress from "@mui/material/LinearProgress";
import Chip from "@mui/material/Chip";
import Skeleton from "@mui/material/Skeleton";
import Tooltip from "@mui/material/Tooltip";
import IconButton from "@mui/material/IconButton";
import { alpha } from "@mui/material/styles";
import Link from "next/link";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { motion } from "framer-motion";
import { AptiverseLineChart as LineChart } from "@/components/common/AptiverseLineChart";
import { WelcomeBanner } from "@/components/dashboard/WelcomeBanner";
import {
  useSubjects,
  useAssessments,
  useGoals,
} from "@/lib/api/queries";
import { type Subject } from "@/lib/mockData";
import { enter, enterStagger } from "@/lib/motion";
import ArrowForwardIcon from "@mui/icons-material/ArrowForwardOutlined";
import AssignmentIcon from "@mui/icons-material/AssignmentOutlined";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import ArrowDropUpIcon from "@mui/icons-material/ArrowDropUp";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";

dayjs.extend(relativeTime);

export default function StudentDashboardPage() {
  const subjectsQuery = useSubjects();
  const assessmentsQuery = useAssessments();
  const goalsQuery = useGoals();

  const subjects = subjectsQuery.data ?? [];
  const assessments = assessmentsQuery.data ?? [];
  const goals = goalsQuery.data ?? [];

  const upcoming = assessments
    .filter((a) => a.status !== "graded")
    .sort((a, b) => +new Date(a.dueDate) - +new Date(b.dueDate))
    .slice(0, 4);
  const activeGoals = goals
    .filter((g) => g.status === "active" || g.status === "at_risk")
    .slice(0, 3);

  return (
    <>
      <WelcomeBanner />

      <UpcomingAssessmentsCard
        upcoming={upcoming}
        subjects={subjects}
        loading={assessmentsQuery.isLoading}
        isEmpty={!assessmentsQuery.isLoading && upcoming.length === 0}
        dataUpdatedAt={assessmentsQuery.dataUpdatedAt}
      />

      <Grid container spacing={3} sx={{ mt: 0 }}>
        <Grid size={{ xs: 12, md: 7 }}>
          <MasteryTrendCard
            subjects={subjects}
            loading={subjectsQuery.isLoading}
            dataUpdatedAt={subjectsQuery.dataUpdatedAt}
          />
        </Grid>
        <Grid size={{ xs: 12, md: 5 }}>
          <ActiveGoalsCard
            goals={activeGoals}
            loading={goalsQuery.isLoading}
            isEmpty={!goalsQuery.isLoading && activeGoals.length === 0}
          />
        </Grid>
      </Grid>
    </>
  );
}

// ─── Last-synced footnote ────────────────────────────────────────────
// Tells the loadshedding-affected student that the data they're looking
// at may be cached. React Query holds stale data silently when the
// connection drops; this surfaces the truth in a calm caption.

function LastSynced({ at }: { at: number | undefined }) {
  if (!at) return null;
  const ageMs = Date.now() - at;
  // Only surface if the data is older than 5 minutes. Fresh fetches
  // shouldn't add visual noise.
  if (ageMs < 5 * 60 * 1000) return null;
  return (
    <Typography
      variant="caption"
      color="text.secondary"
      sx={{ display: "block", mt: 2 }}
    >
      Last synced {dayjs(at).fromNow()}.
    </Typography>
  );
}

// ─── Upcoming SBAs (the canonical "what next") ────────────────────────

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
  dataUpdatedAt,
}: {
  upcoming: UpcomingItem[];
  subjects: Subject[];
  loading: boolean;
  isEmpty: boolean;
  dataUpdatedAt: number | undefined;
}) {
  return (
    <motion.div {...enter}>
      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ p: { xs: 2.5, sm: 3 } }}>
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="flex-end"
            sx={{ mb: 2 }}
          >
            <Box>
              <Typography variant="overline" color="text.secondary">
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
              <Skeleton variant="rounded" height={74} />
              <Skeleton variant="rounded" height={74} />
              <Skeleton variant="rounded" height={74} />
            </Stack>
          ) : isEmpty ? (
            <Box sx={{ py: 5, textAlign: "center" }}>
              <Typography variant="body2" color="text.secondary">
                Nothing on the horizon. Enjoy the breather, or get ahead.
              </Typography>
            </Box>
          ) : (
            <Stack spacing={1.25}>
              {upcoming.map((a, i) => {
                const subject = subjects.find((s) => s.id === a.subjectId);
                const daysLeft = dayjs(a.dueDate).diff(dayjs(), "day");
                const urgent = daysLeft >= 0 && daysLeft <= 3;
                return (
                  <motion.div key={a.id} {...enterStagger(i)}>
                    <Box
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
                            alpha(
                              t.palette.primary.main,
                              t.palette.mode === "dark" ? 0.12 : 0.08,
                            ),
                          flexShrink: 0,
                        }}
                      >
                        <AssignmentIcon fontSize="small" />
                      </Box>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography
                          variant="subtitle2"
                          sx={{ fontWeight: 600 }}
                          noWrap
                        >
                          {a.title}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {subject?.name ?? "Unlinked"} · {a.type} · {a.weight}%
                        </Typography>
                      </Box>
                      <Box
                        sx={{
                          textAlign: "right",
                          display: { xs: "none", sm: "block" },
                        }}
                      >
                        <Typography variant="caption" color="text.secondary">
                          Predicted
                        </Typography>
                        <Typography
                          variant="subtitle2"
                          sx={{
                            fontWeight: 600,
                            fontVariantNumeric: "tabular-nums",
                          }}
                        >
                          {a.predictedMark != null ? `${a.predictedMark}%` : "–"}
                        </Typography>
                      </Box>
                      <Chip
                        label={
                          urgent
                            ? `${daysLeft}d`
                            : dayjs(a.dueDate).format("DD MMM")
                        }
                        size="small"
                        color={urgent ? "warning" : "default"}
                        variant={urgent ? "filled" : "outlined"}
                        sx={{
                          fontWeight: 600,
                          fontVariantNumeric: "tabular-nums",
                        }}
                      />
                    </Box>
                  </motion.div>
                );
              })}
            </Stack>
          )}

          <LastSynced at={dataUpdatedAt} />
        </CardContent>
      </Card>
    </motion.div>
  );
}

// ─── Mastery trend (now carries the predicted average) ────────────────

function MasteryTrendCard({
  subjects,
  loading,
  dataUpdatedAt,
}: {
  subjects: Subject[];
  loading: boolean;
  dataUpdatedAt: number | undefined;
}) {
  const withData = subjects.filter(
    (s) => s.termAverages && s.termAverages.length > 0,
  );
  const empty = !loading && (subjects.length === 0 || withData.length === 0);

  // Predicted-average pulled in from the deprecated Stat tile. Lives
  // here now because the question "what is my predicted average" is a
  // mastery question, and beside the trend chart it has the context
  // (sample size, direction) the standalone tile lacked.
  const subjectsWithPredictions = subjects.filter(
    (s) => s.predictedNextTerm != null,
  );
  const predictedAverage =
    subjectsWithPredictions.length > 0
      ? Math.round(
          subjectsWithPredictions.reduce(
            (acc, x) => acc + (x.predictedNextTerm ?? 0),
            0,
          ) / subjectsWithPredictions.length,
        )
      : null;

  // Latest-term average across the same subjects, for an honest delta.
  const currentAverage =
    subjectsWithPredictions.length > 0
      ? Math.round(
          subjectsWithPredictions.reduce((acc, x) => {
            const last = (x.termAverages ?? []).at(-1);
            return acc + (last?.mark ?? 0);
          }, 0) / subjectsWithPredictions.length,
        )
      : null;
  const delta =
    predictedAverage != null && currentAverage != null
      ? predictedAverage - currentAverage
      : null;

  return (
    <motion.div {...enter}>
      <Card sx={{ height: "100%" }}>
        <CardContent sx={{ p: { xs: 2.5, sm: 3 }, height: "100%" }}>
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="flex-end"
            sx={{ mb: 2 }}
          >
            <Box>
              <Typography variant="overline" color="text.secondary">
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

          {predictedAverage != null && (
            <Stack
              direction="row"
              alignItems="flex-end"
              spacing={1.5}
              sx={{ mb: 2 }}
            >
              <Box>
                <Stack direction="row" spacing={0.5} alignItems="center">
                  <Typography variant="caption" color="text.secondary">
                    Predicted next term
                  </Typography>
                  <Tooltip
                    arrow
                    enterTouchDelay={0}
                    title="Weighted average of your current term marks, projected forward using the remaining assessment weights for each subject. Updates as new marks are logged."
                  >
                    <IconButton
                      size="small"
                      sx={{ p: 0.25 }}
                      aria-label="How predicted average is calculated"
                    >
                      <InfoOutlinedIcon sx={{ fontSize: "1rem" }} />
                    </IconButton>
                  </Tooltip>
                </Stack>
                <Stack direction="row" alignItems="baseline" spacing={0.75}>
                  <Typography
                    variant="h4"
                    component="div"
                    sx={{
                      fontWeight: 600,
                      lineHeight: 1.1,
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    {predictedAverage}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    %
                  </Typography>
                </Stack>
              </Box>
              {delta != null && delta !== 0 && (
                <Stack
                  direction="row"
                  alignItems="center"
                  spacing={0.25}
                  sx={{
                    color: delta > 0 ? "success.main" : "warning.main",
                    pb: 0.5,
                  }}
                >
                  {delta > 0 ? (
                    <ArrowDropUpIcon fontSize="small" />
                  ) : (
                    <ArrowDropDownIcon fontSize="small" />
                  )}
                  <Typography
                    variant="body2"
                    sx={{
                      fontWeight: 600,
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    {Math.abs(delta)}pt
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    vs current
                  </Typography>
                </Stack>
              )}
            </Stack>
          )}

          {loading ? (
            <Skeleton variant="rounded" height={240} />
          ) : empty ? (
            <Box sx={{ py: 6, textAlign: "center" }}>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ maxWidth: 360, mx: "auto" }}
              >
                {subjects.length === 0
                  ? "Add subjects, then log a few marks against them. Your term-over-term trend lives here."
                  : "Log marks against your subjects to see your trend appear."}
              </Typography>
            </Box>
          ) : (
            <LineChart
              height={240}
              xAxis={[
                { data: ["T1", "T2", "T3", "T4"], scaleType: "point" },
              ]}
              series={withData.slice(0, 5).map((s) => ({
                data: (s.termAverages ?? []).map((t) => t.mark),
                label: s.name,
                curve: "monotoneX",
              }))}
              margin={{ top: 16, right: 16, bottom: 32, left: 32 }}
            />
          )}

          <LastSynced at={dataUpdatedAt} />
        </CardContent>
      </Card>
    </motion.div>
  );
}

// ─── Active goals (softer treatment) ──────────────────────────────────
// At-risk chip dropped from filled-warning to outlined: keeps the
// honest signal (PRODUCT.md: Honesty before flash) without weaponising
// it visually. A returning student with one at-risk goal opens the
// page and sees an outlined chip, not a red lozenge in their face.

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
      <Card sx={{ height: "100%" }}>
        <CardContent sx={{ p: { xs: 2.5, sm: 3 }, height: "100%" }}>
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="flex-end"
            sx={{ mb: 2 }}
          >
            <Box>
              <Typography variant="overline" color="text.secondary">
                In progress
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Active goals
              </Typography>
            </Box>
            <Button
              component={Link}
              href="/dashboard/goals"
              endIcon={<ArrowForwardIcon />}
              size="small"
            >
              All
            </Button>
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
              {goals.map((g) => {
                const atRisk = g.status === "at_risk";
                return (
                  <Box key={g.id}>
                    <Stack
                      direction="row"
                      justifyContent="space-between"
                      alignItems="center"
                      sx={{ mb: 0.5, gap: 1 }}
                    >
                      <Typography
                        variant="body2"
                        sx={{ fontWeight: 500, flex: 1, minWidth: 0 }}
                        noWrap
                      >
                        {g.title}
                      </Typography>
                      <Chip
                        label={`${g.progress}%`}
                        size="small"
                        variant="outlined"
                        color={atRisk ? "warning" : "default"}
                        sx={{
                          fontWeight: 600,
                          fontVariantNumeric: "tabular-nums",
                        }}
                      />
                    </Stack>
                    <LinearProgress
                      variant="determinate"
                      value={g.progress}
                      color={atRisk ? "warning" : "primary"}
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
