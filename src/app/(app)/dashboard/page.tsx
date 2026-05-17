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
import Divider from "@mui/material/Divider";
import { alpha, useTheme } from "@mui/material/styles";
import Link from "next/link";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { motion } from "framer-motion";
import { AptiverseLineChart as LineChart } from "@/components/common/AptiverseLineChart";
import { WelcomeBanner } from "@/components/dashboard/WelcomeBanner";
import { brand } from "@/theme/palette";
import {
  useSubjects,
  useAssessments,
  useGoals,
} from "@/lib/api/queries";
import { type Goal, type Subject } from "@/lib/mockData";
import { enter, enterStagger } from "@/lib/motion";
import ArrowForwardIcon from "@mui/icons-material/ArrowForwardOutlined";
import AssignmentIcon from "@mui/icons-material/AssignmentOutlined";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import ArrowDropUpIcon from "@mui/icons-material/ArrowDropUp";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import CloudOffOutlinedIcon from "@mui/icons-material/CloudOffOutlined";

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
        isError={assessmentsQuery.isError}
        onRetry={() => assessmentsQuery.refetch()}
        isEmpty={!assessmentsQuery.isLoading && upcoming.length === 0}
        dataUpdatedAt={assessmentsQuery.dataUpdatedAt}
      />

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 7 }}>
          <MasteryTrendCard
            subjects={subjects}
            loading={subjectsQuery.isLoading}
            isError={subjectsQuery.isError}
            onRetry={() => subjectsQuery.refetch()}
            dataUpdatedAt={subjectsQuery.dataUpdatedAt}
          />
        </Grid>
        <Grid size={{ xs: 12, md: 5 }}>
          <ActiveGoalsCard
            goals={activeGoals}
            loading={goalsQuery.isLoading}
            isError={goalsQuery.isError}
            onRetry={() => goalsQuery.refetch()}
            isEmpty={!goalsQuery.isLoading && activeGoals.length === 0}
          />
        </Grid>
      </Grid>
    </>
  );
}

// ─── Card error state ────────────────────────────────────────────────
// React Query holds stale data silently when a refetch fails, so before
// this card existed a network failure would render the same empty-state
// copy ("Add subjects, then log marks") as a brand-new account. That
// lied to returning students. Now: explicit failure surface with a
// Retry button that calls the query's refetch().
//
// Copy stays calm. PRODUCT.md "the senior friend at 8pm": no alarm
// bells, no error codes, no apology theatre. Honest, short, actionable.

function CardError({
  onRetry,
  what,
}: {
  onRetry: () => void;
  what: string;
}) {
  return (
    <Box
      sx={{
        py: 4,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 1.5,
        textAlign: "center",
      }}
    >
      <Box
        sx={{
          width: 36,
          height: 36,
          borderRadius: 1,
          display: "grid",
          placeItems: "center",
          color: "text.secondary",
          bgcolor: (t) => alpha(t.palette.text.primary, 0.05),
        }}
      >
        <CloudOffOutlinedIcon fontSize="small" />
      </Box>
      <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 360 }}>
        Couldn&apos;t load {what} right now. Check your connection?
      </Typography>
      <Button size="small" onClick={onRetry}>
        Try again
      </Button>
    </Box>
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
  isError,
  onRetry,
  isEmpty,
  dataUpdatedAt,
}: {
  upcoming: UpcomingItem[];
  subjects: Subject[];
  loading: boolean;
  isError: boolean;
  onRetry: () => void;
  isEmpty: boolean;
  dataUpdatedAt: number | undefined;
}) {
  const [hero, ...rest] = upcoming;

  return (
    <motion.div {...enter}>
      <Card sx={{ mb: 3 }}>
        {/* Primary surface gets more breathing room than the
            secondary cards below (which stay at the standard
            { xs: 2.5, sm: 3 }). Same padding everywhere is
            monotony; the size difference encodes hierarchy. */}
        <CardContent sx={{ p: { xs: 2.5, sm: 3.5 } }}>
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="flex-end"
            sx={{ mb: 2.5 }}
          >
            <Box>
              <Typography variant="overline" color="text.secondary">
                Up next
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 600 }}>
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
              <Skeleton variant="rounded" height={120} />
              <Skeleton variant="rounded" height={56} />
              <Skeleton variant="rounded" height={56} />
            </Stack>
          ) : isError ? (
            <CardError onRetry={onRetry} what="your upcoming SBAs" />
          ) : isEmpty ? (
            <Box sx={{ py: 5, textAlign: "center" }}>
              <Typography variant="body2" color="text.secondary">
                Nothing on the horizon. Enjoy the breather, or get ahead.
              </Typography>
            </Box>
          ) : (
            <>
              {hero && (
                <HeroUpcomingRow
                  a={hero}
                  subject={subjects.find((s) => s.id === hero.subjectId)}
                />
              )}

              {rest.length > 0 && (
                <>
                  {/* Asymmetric divider rhythm: more space above
                      the rule (the hero block needs its breath),
                      tighter below (compact rows are dense). The
                      previous my: 2 was uniform monotony. */}
                  <Divider sx={{ mt: 3, mb: 1.5 }} />
                  <Stack spacing={0.5}>
                    {rest.map((a, i) => (
                      <motion.div key={a.id} {...enterStagger(i)}>
                        <CompactUpcomingRow
                          a={a}
                          subject={subjects.find((s) => s.id === a.subjectId)}
                        />
                      </motion.div>
                    ))}
                  </Stack>
                </>
              )}
            </>
          )}

          <LastSynced at={dataUpdatedAt} />
        </CardContent>
      </Card>
    </motion.div>
  );
}

// ─── Hero row (the page's one focal moment) ──────────────────────────
// The most urgent upcoming SBA gets dedicated typography, a prominent
// days-left numeral, and a direct "Start working" deeplink. This is
// where the page commits to answering the canonical question: "what
// should I work on right now?"

function HeroUpcomingRow({
  a,
  subject,
}: {
  a: UpcomingItem;
  subject?: Subject;
}) {
  const daysLeft = dayjs(a.dueDate).diff(dayjs(), "day");
  const urgent = daysLeft >= 0 && daysLeft <= 3;
  const daysLabel =
    daysLeft === 0
      ? "today"
      : daysLeft === 1
        ? "tomorrow"
        : daysLeft > 0
          ? `in ${daysLeft} days`
          : dayjs(a.dueDate).format("DD MMM");

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: { xs: "column", sm: "row" },
        alignItems: { xs: "stretch", sm: "center" },
        gap: { xs: 2, sm: 3 },
      }}
    >
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography
          variant="overline"
          color="text.secondary"
          sx={{
            display: "block",
            // Subject names like "Life Orientation" are mostly short
            // but the field is user-editable in some flows. Truncate
            // to one line with ellipsis so a long name doesn't push
            // the title row down.
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {subject?.name ?? "Unlinked"}
        </Typography>
        <Typography
          variant="h5"
          component={Link}
          href={`/dashboard/assessments/${a.id}`}
          sx={{
            fontWeight: 600,
            color: "text.primary",
            textDecoration: "none",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
            // Long assessment titles ("Maths SBA: Trigonometry
            // identities + radian-measure problem set") shouldn't
            // shove the meta row off-screen. Clamp to two lines.
            wordBreak: "break-word",
            mt: 0.25,
            "&:hover": { color: "primary.main" },
            transition: "color 180ms cubic-bezier(0.165, 0.84, 0.44, 1)",
          }}
        >
          {a.title}
        </Typography>
        <Stack
          direction="row"
          spacing={1}
          alignItems="center"
          // Meta row has up to 4 fragments separated by bullets. On
          // 360px viewports with longer values ("85% weight",
          // "Predicted 78%") this could blow past one row. Wrap
          // gracefully instead of forcing a horizontal scroll.
          useFlexGap
          flexWrap="wrap"
          rowGap={0.5}
          sx={{ mt: 0.75 }}
          divider={<Box component="span" sx={{ color: "text.disabled" }}>·</Box>}
        >
          <Typography variant="body2" color="text.secondary">
            Due{" "}
            <Box
              component="span"
              sx={{
                fontWeight: 600,
                color: urgent ? "warning.dark" : "text.primary",
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {daysLabel}
            </Box>
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {a.type}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {a.weight}% weight
          </Typography>
          {a.predictedMark != null && (
            <Typography variant="body2" color="text.secondary">
              Predicted{" "}
              <Box
                component="span"
                sx={{
                  fontWeight: 600,
                  color: "text.primary",
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {a.predictedMark}%
              </Box>
            </Typography>
          )}
        </Stack>
      </Box>
      <Button
        component={Link}
        href={`/dashboard/workspace?assessmentId=${a.id}`}
        variant="contained"
        size="large"
        sx={{ flexShrink: 0 }}
      >
        Start working
      </Button>
    </Box>
  );
}

// ─── Compact row (denser, glanceable; not the hero) ──────────────────

function CompactUpcomingRow({
  a,
  subject,
}: {
  a: UpcomingItem;
  subject?: Subject;
}) {
  const daysLeft = dayjs(a.dueDate).diff(dayjs(), "day");
  const urgent = daysLeft >= 0 && daysLeft <= 3;
  const dayLabel =
    daysLeft === 0
      ? "Today"
      : urgent
        ? `${daysLeft}d`
        : dayjs(a.dueDate).format("DD MMM");

  return (
    <Box
      component={Link}
      href={`/dashboard/assessments/${a.id}`}
      sx={{
        px: 1.5,
        py: 1.25,
        borderRadius: 1.5,
        display: "flex",
        alignItems: "center",
        gap: 1.5,
        textDecoration: "none",
        color: "inherit",
        transition:
          "background-color 180ms cubic-bezier(0.165, 0.84, 0.44, 1)",
        "&:hover": { bgcolor: (t) => alpha(t.palette.primary.main, 0.04) },
      }}
    >
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 600 }} noWrap>
          {a.title}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {subject?.name ?? "Unlinked"} · {a.type} · {a.weight}%
        </Typography>
      </Box>
      <Chip
        label={dayLabel}
        size="small"
        color={urgent ? "warning" : "default"}
        variant={urgent ? "filled" : "outlined"}
        sx={{ fontWeight: 600, fontVariantNumeric: "tabular-nums" }}
      />
    </Box>
  );
}

// ─── Mastery trend (now carries the predicted average) ────────────────

// Tonal teal ramp for the chart. Replaces MUI X's categorical default
// palette (which would render each subject in an unrelated hue, the
// usual SaaS line-chart look). Inside one ramp the chart commits to the
// Aptiverse brand colour; subject identity is still distinguishable by
// shade, and the visual register reads as "this is our chart", not
// "this is a chart library's output".
const CHART_TEAL_RAMP_LIGHT = [
  brand.teal[700],
  brand.teal[500],
  brand.teal[400],
  brand.teal[300],
  brand.teal[200],
];
const CHART_TEAL_RAMP_DARK = [
  brand.teal[200],
  brand.teal[300],
  brand.teal[400],
  brand.teal[500],
  brand.teal[600],
];

function MasteryTrendCard({
  subjects,
  loading,
  isError,
  onRetry,
  dataUpdatedAt,
}: {
  subjects: Subject[];
  loading: boolean;
  isError: boolean;
  onRetry: () => void;
  dataUpdatedAt: number | undefined;
}) {
  const theme = useTheme();
  const tealRamp =
    theme.palette.mode === "dark" ? CHART_TEAL_RAMP_DARK : CHART_TEAL_RAMP_LIGHT;
  const withData = subjects.filter(
    (s) => s.termAverages && s.termAverages.length > 0,
  );
  const empty = !loading && (subjects.length === 0 || withData.length === 0);

  // Predicted-average pulled in from the deprecated Stat tile. Lives
  // here now because the question "what is my predicted average" is a
  // mastery question, and beside the trend chart it has the context
  // (sample size, direction) the standalone tile lacked.
  //
  // Honest delta calculation: compute both averages as raw floats,
  // take the difference, THEN round. Previously each average was
  // rounded independently which gave the delta up to a 1pt drift
  // from the true value. PRODUCT.md "Honesty before flash" applies
  // even to display arithmetic; a rounded-of-rounded delta isn't
  // honest, it's a fast lie.
  const subjectsWithPredictions = subjects.filter(
    (s) => s.predictedNextTerm != null,
  );
  const n = subjectsWithPredictions.length;
  const rawPredicted =
    n > 0
      ? subjectsWithPredictions.reduce(
          (acc, x) => acc + (x.predictedNextTerm ?? 0),
          0,
        ) / n
      : null;
  const rawCurrent =
    n > 0
      ? subjectsWithPredictions.reduce((acc, x) => {
          const last = (x.termAverages ?? []).at(-1);
          return acc + (last?.mark ?? 0);
        }, 0) / n
      : null;
  const predictedAverage = rawPredicted != null ? Math.round(rawPredicted) : null;
  const delta =
    rawPredicted != null && rawCurrent != null
      ? Math.round(rawPredicted - rawCurrent)
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
              <Typography variant="h5" sx={{ fontWeight: 600 }}>
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

          {isError && <CardError onRetry={onRetry} what="your mastery trend" />}

          {!isError && predictedAverage != null && (
            <Stack
              direction="row"
              alignItems="flex-end"
              spacing={2}
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
                    component="div"
                    sx={{
                      // Display-style numeral. Larger than h4 (1.25rem)
                      // so the predicted mark is the page's bold focal
                      // figure. Clamp keeps it readable across breakpoints.
                      fontSize: { xs: "2.25rem", sm: "2.75rem" },
                      fontWeight: 600,
                      lineHeight: 1,
                      letterSpacing: "-0.02em",
                      color: "primary.main",
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    {predictedAverage}
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: "1rem",
                      fontWeight: 500,
                      color: "primary.main",
                      lineHeight: 1,
                    }}
                  >
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
                    pb: 0.75,
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
          ) : isError ? null : empty ? (
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
              series={withData.slice(0, 5).map((s, i) => ({
                data: (s.termAverages ?? []).map((t) => t.mark),
                label: s.name,
                curve: "monotoneX",
                color: tealRamp[i],
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

// ─── Active goals ─────────────────────────────────────────────────────

function ActiveGoalsCard({
  goals,
  loading,
  isError,
  onRetry,
  isEmpty,
}: {
  goals: Goal[];
  loading: boolean;
  isError: boolean;
  onRetry: () => void;
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
              {/* Overline used to read "In progress" but the list
                  includes at-risk goals, which aren't really "in
                  progress" in the positive sense. "Tracking" is
                  honest cover for both states. */}
              <Typography variant="overline" color="text.secondary">
                Tracking
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 600 }}>
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
              <Skeleton variant="rounded" height={56} />
              <Skeleton variant="rounded" height={56} />
            </Stack>
          ) : isError ? (
            <CardError onRetry={onRetry} what="your goals" />
          ) : isEmpty ? (
            <Typography variant="body2" color="text.secondary">
              No active goals yet. Set one to start tracking.
            </Typography>
          ) : (
            <Stack spacing={1.5}>
              {goals.map((g) => (
                <GoalRow key={g.id} g={g} />
              ))}
            </Stack>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

// Goal row clarifies three things the previous version didn't:
//   1. What is the percentage progress AGAINST? -- surface the target
//      string under the title so "62%" reads as "62% of [target]".
//   2. What does "at_risk" mean? -- pair the warning colour with the
//      words "Falling behind" so colour isn't the only signal
//      (DESIGN.md: colour is never the only signal).
//   3. Why am I looking at this if I can't act on it? -- wrap the
//      whole row as a Link to /dashboard/goals/{id}, matching the SBA
//      row's interaction model. Hover state matches too.

function GoalRow({ g }: { g: Goal }) {
  const atRisk = g.status === "at_risk";
  return (
    <Box
      component={Link}
      href={`/dashboard/goals/${g.id}`}
      sx={{
        display: "block",
        textDecoration: "none",
        color: "inherit",
        px: 1.5,
        py: 1.25,
        mx: -1.5,
        borderRadius: 1.5,
        transition:
          "background-color 180ms cubic-bezier(0.165, 0.84, 0.44, 1)",
        "&:hover": { bgcolor: (t) => alpha(t.palette.primary.main, 0.04) },
      }}
    >
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="flex-start"
        sx={{ mb: 0.75, gap: 1 }}
      >
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography
            variant="body2"
            sx={{ fontWeight: 600 }}
            noWrap
          >
            {g.title}
          </Typography>
          {g.target && (
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ display: "block", mt: 0.25 }}
              noWrap
            >
              Target: {g.target}
            </Typography>
          )}
        </Box>
        <Stack alignItems="flex-end" spacing={0.25} sx={{ flexShrink: 0 }}>
          <Typography
            variant="subtitle2"
            sx={{ fontWeight: 700, fontVariantNumeric: "tabular-nums" }}
          >
            {g.progress}%
          </Typography>
          {atRisk && (
            <Typography
              variant="caption"
              sx={{ color: "warning.dark", fontWeight: 600 }}
            >
              Falling behind
            </Typography>
          )}
        </Stack>
      </Stack>
      <LinearProgress
        variant="determinate"
        value={g.progress}
        color={atRisk ? "warning" : "primary"}
        aria-label={`${g.title}: ${g.progress}% complete${atRisk ? ", falling behind" : ""}`}
      />
    </Box>
  );
}
