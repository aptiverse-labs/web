"use client";

import { useMemo } from "react";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Grid from "@mui/material/Grid";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import LinearProgress from "@mui/material/LinearProgress";
import Button from "@mui/material/Button";
import Link from "next/link";
import dayjs from "dayjs";
import { motion } from "framer-motion";
import { alpha, useTheme } from "@mui/material/styles";
import { CardError } from "@/components/common/CardError";
import { PageHeader } from "@/components/common/PageHeader";
import { AtmosphericBackdrop } from "@/components/common/AtmosphericBackdrop";
import { AptiverseLineChart } from "@/components/common/AptiverseLineChart";
import { GroupedList } from "@/components/common/GroupedList";
import { StatusChip } from "@/components/common/StatusChip";
import {
  useAcademicUnits,
  useAssessments,
  useGoals,
  useTermPredictions,
  useTopicMastery,
  type AcademicUnit,
  type TermPrediction,
  type TopicMastery,
} from "@/lib/api/queries";
import { ASSESSMENT_TYPE_LABELS, type Assessment, type Goal } from "@/lib/mockData";
import { prettifyUnitId } from "@/lib/format";
import { enter, enterStagger } from "@/lib/motion";
import { ArrowRight, Route, Flag, CircleCheck, CalendarClock } from "lucide-react";

const PASS_MARK = 50;

export default function JourneyPage() {
  // Reads academic units, not subjects. On useSubjects this whole page was a
  // dead end for a university student: that hook only returns high-school
  // subjects, so their courses came back empty and they were shown "Your
  // journey starts with a subject" pointing at a page they cannot use.
  const academic = useAcademicUnits();
  const assessmentsQuery = useAssessments();
  const predictionsQuery = useTermPredictions();
  const masteryQuery = useTopicMastery();
  const goalsQuery = useGoals();

  // Assessments are the spine of this page: dated, marked events are what a
  // journey is made of. Predictions, mastery and goals enrich it, so they
  // degrade to empty rather than taking the whole page down with them.
  const isLoading =
    academic.isLoading ||
    assessmentsQuery.isLoading ||
    predictionsQuery.isLoading ||
    masteryQuery.isLoading ||
    goalsQuery.isLoading;
  const isError = assessmentsQuery.isError;

  return (
    <AtmosphericBackdrop>
      <PageHeader
        title="Your learning journey"
        description="The record of what you have actually done: every mark logged, how it compared to your own call, and where each result is pointing next."
        breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Journey" }]}
        actions={
          <Button
            component={Link}
            href="/dashboard/assessments/new"
            variant="contained"
            color="secondary"
            size="small"
          >
            Log an assessment
          </Button>
        }
      />

      {isLoading ? (
        <LoadingSkeleton />
      ) : isError ? (
        <Card>
          <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
            <CardError what="your journey" onRetry={() => assessmentsQuery.refetch()} />
          </CardContent>
        </Card>
      ) : (
        <JourneyView
          units={academic.units}
          assessments={assessmentsQuery.data ?? []}
          predictions={predictionsQuery.data ?? []}
          mastery={masteryQuery.data ?? []}
          goals={goalsQuery.data ?? []}
          unitNoun={academic.unitNoun}
          unitNounPlural={academic.unitNounPlural}
          addHref={academic.addHref}
          // TermPrediction.subject / TopicMastery.subject carry the practice key,
          // not a display name. Resolving through the unit list keeps slugs like
          // "uct:calculus-i" out of the UI, with prettify as the last resort.
          nameFor={(id) => academic.nameFor(id) ?? prettifyUnitId(id)}
        />
      )}
    </AtmosphericBackdrop>
  );
}

// ─── Derived model ────────────────────────────────────────────────────

type UnitRow = {
  unit: AcademicUnit;
  total: number;
  graded: number;
  upcoming: number;
  /** Weighted term average from the mastery engine. Null until something is graded. */
  currentMark: number | null;
  predictedMark: number | null;
  /** 0-1, grows with evidence. Null when there is no prediction at all. */
  confidence: number | null;
  mastery: { avg: number; topics: number } | null;
  nextUp: Assessment | null;
};

/** A dated thing that actually happened. Never synthesised. */
type Landmark =
  | {
      kind: "mark";
      id: string;
      date: string;
      title: string;
      unitName: string;
      mark: number;
      predicted: number | null;
      type: Assessment["type"];
      weight: number;
    }
  | {
      kind: "goal";
      id: string;
      date: string;
      title: string;
      category: Goal["category"];
    };

function JourneyView({
  units,
  assessments,
  predictions,
  mastery,
  goals,
  unitNoun,
  unitNounPlural,
  addHref,
  nameFor,
}: {
  units: AcademicUnit[];
  assessments: Assessment[];
  predictions: TermPrediction[];
  mastery: TopicMastery[];
  goals: Goal[];
  unitNoun: string;
  unitNounPlural: string;
  addHref: string;
  nameFor: (id: string) => string;
}) {
  // Every derivation lives above the early returns. The previous version called
  // useMemo after `if (units.length === 0) return ...`, which is a conditional
  // hook: the first student to land here with no units changed the hook order
  // on the next render.
  const rows = useMemo<UnitRow[]>(() => {
    const cutoff = Date.now() - 86_400_000; // today's still-due work stays "upcoming"
    return units.map((unit) => {
      const mine = assessments.filter((a) => a.subjectId === unit.id);
      const prediction = predictions.find((p) => p.subjectId === unit.id);
      const topics = mastery.filter((m) => m.subjectId === unit.id);
      const upcoming = mine
        .filter((a) => a.status !== "graded" && +new Date(a.dueDate) >= cutoff)
        .sort((a, b) => +new Date(a.dueDate) - +new Date(b.dueDate));

      return {
        unit,
        total: mine.length,
        graded: mine.filter((a) => a.actualMark != null).length,
        upcoming: upcoming.length,
        currentMark:
          prediction && prediction.currentTerm > 0 ? Math.round(prediction.currentTerm) : null,
        predictedMark:
          prediction && prediction.predictedNextTerm > 0
            ? Math.round(prediction.predictedNextTerm)
            : null,
        confidence: prediction ? prediction.confidence : null,
        mastery: topics.length
          ? {
              avg: Math.round(topics.reduce((s, t) => s + t.mastery, 0) / topics.length),
              topics: topics.length,
            }
          : null,
        nextUp: upcoming[0] ?? null,
      };
    });
  }, [units, assessments, predictions, mastery]);

  // Graded work in the order it happened. This is the actual journey.
  const graded = useMemo(
    () =>
      assessments
        .filter((a) => a.actualMark != null)
        .sort((a, b) => +new Date(a.dueDate) - +new Date(b.dueDate)),
    [assessments],
  );

  const landmarks = useMemo<Landmark[]>(() => {
    const marks: Landmark[] = graded.map((a) => ({
      kind: "mark",
      id: a.id,
      date: a.dueDate,
      title: a.title,
      unitName: nameFor(a.subjectId),
      mark: a.actualMark as number,
      predicted: a.predictedMark ?? null,
      type: a.type,
      weight: a.weight,
    }));
    // A goal is a landmark only once it has actually been reached: achievedAt
    // is a real server timestamp, so an unreached goal contributes nothing.
    const reached: Landmark[] = goals
      .filter((g) => g.achievedAt != null)
      .map((g) => ({
        kind: "goal",
        id: g.id,
        date: g.achievedAt as string,
        title: g.title,
        category: g.category,
      }));
    return [...marks, ...reached].sort((a, b) => +new Date(b.date) - +new Date(a.date));
  }, [graded, goals, nameFor]);

  const upcoming = useMemo(() => {
    const cutoff = Date.now() - 86_400_000;
    return assessments
      .filter((a) => a.status !== "graded" && +new Date(a.dueDate) >= cutoff)
      .sort((a, b) => +new Date(a.dueDate) - +new Date(b.dueDate));
  }, [assessments]);

  const overallAverage = graded.length
    ? Math.round(graded.reduce((s, a) => s + (a.actualMark ?? 0), 0) / graded.length)
    : null;

  // How close the student's own call has been. Only assessments carrying both
  // their prediction and a real mark can answer this.
  const called = graded.filter((a) => a.predictedMark != null);
  const predictionGap = called.length
    ? Math.round(
        called.reduce((s, a) => s + Math.abs((a.predictedMark as number) - (a.actualMark as number)), 0) /
          called.length,
      )
    : null;

  const nextUp = upcoming[0];
  const nextUpName = nextUp ? nameFor(nextUp.subjectId) : undefined;

  if (units.length === 0) {
    return <NoUnitsYet unitNoun={unitNoun} unitNounPlural={unitNounPlural} addHref={addHref} />;
  }

  if (landmarks.length === 0 && upcoming.length === 0) {
    return <NoAssessmentsYet unitCount={units.length} unitNoun={unitNoun} />;
  }

  return (
    <Stack spacing={3}>
      <Trajectory
        graded={graded}
        overallAverage={overallAverage}
        totalAssessments={assessments.length}
        upcomingCount={upcoming.length}
        topicsPracticed={mastery.length}
        predictionGap={predictionGap}
        calledCount={called.length}
        nextUp={nextUp}
        nextUpName={nextUpName}
      />

      <UnitProgress rows={rows} unitNoun={unitNoun} />

      <Landmarks landmarks={landmarks} />
    </Stack>
  );
}

// ─── Trajectory: the marks in the order they happened ────────────────

function Trajectory({
  graded,
  overallAverage,
  totalAssessments,
  upcomingCount,
  topicsPracticed,
  predictionGap,
  calledCount,
  nextUp,
  nextUpName,
}: {
  graded: Assessment[];
  overallAverage: number | null;
  totalAssessments: number;
  upcomingCount: number;
  topicsPracticed: number;
  predictionGap: number | null;
  calledCount: number;
  nextUp?: Assessment;
  nextUpName?: string;
}) {
  const theme = useTheme();

  // Two series over the same dated points: what the student predicted when they
  // logged the assessment, and what they actually scored. The gap between the
  // lines is the whole story, and it is the one view the analytics page (which
  // plots a line per course) does not give.
  const labels = graded.map((a) => dayjs(a.dueDate).format("DD MMM"));
  const series = [
    {
      label: "You scored",
      data: graded.map((a) => a.actualMark ?? null),
      color: theme.palette.primary.main,
      showMark: true,
      curve: "linear" as const,
    },
    // Only plotted once the student has actually called at least one mark.
    // An all-null series still claims a legend entry, which would advertise a
    // line that isn't there.
    ...(calledCount > 0
      ? [
          {
            label: "You predicted",
            data: graded.map((a) => a.predictedMark ?? null),
            color: theme.palette.text.secondary,
            showMark: true,
            connectNulls: true,
            curve: "linear" as const,
          },
        ]
      : []),
  ];

  const stats: { label: string; value: string; unit?: string; hint: string }[] = [];
  if (overallAverage != null) {
    stats.push({
      label: "Average",
      value: `${overallAverage}`,
      unit: "%",
      hint: `Across ${graded.length} graded`,
    });
  }
  stats.push({
    label: "Logged",
    value: `${totalAssessments}`,
    hint: `${graded.length} graded, ${upcomingCount} to come`,
  });
  if (topicsPracticed > 0) {
    stats.push({
      label: "Topics practised",
      value: `${topicsPracticed}`,
      hint: "Built from your real answers",
    });
  }
  if (predictionGap != null) {
    stats.push({
      label: "Your call",
      value: `${predictionGap}`,
      unit: predictionGap === 1 ? "pt off" : "pts off",
      hint: `Across ${calledCount} you predicted`,
    });
  }

  return (
    <motion.div {...enter}>
      <Card>
        <CardContent sx={{ p: { xs: 2.5, sm: 3.5 } }}>
          <Grid container spacing={{ xs: 3, md: 4 }}>
            <Grid size={{ xs: 12, md: 8 }}>
              <Typography variant="overline" color="text.secondary" sx={{ letterSpacing: "0.08em" }}>
                Predicted against scored
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                Every mark, in order
              </Typography>

              <Grid container spacing={2.5} sx={{ mb: 3 }}>
                {stats.map((s) => (
                  <Grid key={s.label} size={{ xs: 6, sm: 3 }}>
                    <Stat {...s} />
                  </Grid>
                ))}
              </Grid>

              {graded.length >= 2 ? (
                <>
                  <AptiverseLineChart
                    height={260}
                    xAxis={[{ data: labels, scaleType: "point" }]}
                    yAxis={[{ min: 0, max: 100 }]}
                    series={series}
                    margin={{ top: 8, right: 8, bottom: 24, left: 32 }}
                  />
                  <Typography variant="caption" color="text.secondary">
                    {calledCount > 0
                      ? "The gap between the two lines is how well you read your own work."
                      : "Add a predicted mark when you log an assessment and your own call gets plotted against the result."}
                  </Typography>
                </>
              ) : (
                <Box
                  sx={{
                    py: 5,
                    px: 2,
                    textAlign: "center",
                    borderRadius: 2,
                    border: 1,
                    borderStyle: "dashed",
                    borderColor: "divider",
                  }}
                >
                  <Typography variant="body2" color="text.secondary">
                    {graded.length === 1
                      ? "One mark logged. The trajectory needs a second before it can draw a line."
                      : "No graded marks yet. Log one and your trajectory starts here."}
                  </Typography>
                </Box>
              )}
            </Grid>

            <Grid size={{ xs: 12, md: 4 }}>
              {nextUp ? (
                <Box
                  sx={{
                    p: 2.5,
                    height: "100%",
                    borderRadius: 2,
                    border: 1,
                    borderColor: "divider",
                    bgcolor: (t) =>
                      t.palette.mode === "dark" ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.02)",
                  }}
                >
                  <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                    <Box sx={{ display: "flex", color: "primary.main" }}>
                      <CalendarClock size={16} />
                    </Box>
                    <Typography
                      variant="overline"
                      color="primary.main"
                      sx={{ letterSpacing: "0.08em" }}
                    >
                      Next up
                    </Typography>
                  </Stack>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
                    {nextUp.title}
                  </Typography>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ display: "block", mb: 0.5 }}
                  >
                    {nextUpName} · {ASSESSMENT_TYPE_LABELS[nextUp.type]} · {nextUp.weight}% weight
                  </Typography>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ display: "block", mb: 2 }}
                  >
                    Due {dayjs(nextUp.dueDate).format("DD MMM")}
                    {nextUp.predictedMark != null
                      ? ` · you predicted ${nextUp.predictedMark}%`
                      : ""}
                  </Typography>
                  <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                    <Button
                      component={Link}
                      href={`/dashboard/assessments/${nextUp.id}`}
                      variant="contained"
                      color="secondary"
                      size="small"
                      endIcon={<ArrowRight size={16} />}
                    >
                      Open
                    </Button>
                    <Button component={Link} href="/dashboard/workspace" variant="text" size="small">
                      Workspace
                    </Button>
                  </Stack>
                  <AssessmentNote assessment={nextUp} />
                </Box>
              ) : (
                <Box
                  sx={{
                    p: 2.5,
                    height: "100%",
                    display: "grid",
                    placeItems: "center",
                    textAlign: "center",
                    borderRadius: 2,
                    border: 1,
                    borderStyle: "dashed",
                    borderColor: "divider",
                  }}
                >
                  <Typography variant="body2" color="text.secondary">
                    Nothing due. Everything you have logged is graded.
                  </Typography>
                </Box>
              )}
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// Kept separate so the "Next up" panel stays readable. Renders nothing unless
// the assessment carries a real note the student wrote themselves.
function AssessmentNote({ assessment: a }: { assessment: Assessment }) {
  if (!a.notes) return null;
  return (
    <Typography
      variant="caption"
      color="text.secondary"
      sx={{
        display: "-webkit-box",
        WebkitLineClamp: 2,
        WebkitBoxOrient: "vertical",
        overflow: "hidden",
        mt: 2,
      }}
    >
      {a.notes}
    </Typography>
  );
}

function Stat({
  label,
  value,
  unit,
  hint,
}: {
  label: string;
  value: string;
  unit?: string;
  hint: string;
}) {
  return (
    <Box>
      <Typography variant="overline" color="text.secondary" sx={{ letterSpacing: "0.08em" }}>
        {label}
      </Typography>
      <Stack direction="row" alignItems="baseline" spacing={0.5}>
        <Typography
          variant="h5"
          component="div"
          sx={{ fontWeight: 600, lineHeight: 1.1, fontVariantNumeric: "tabular-nums" }}
        >
          {value}
        </Typography>
        {unit && (
          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
            {unit}
          </Typography>
        )}
      </Stack>
      <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.25 }}>
        {hint}
      </Typography>
    </Box>
  );
}

// ─── Where each unit is heading ──────────────────────────────────────

function UnitProgress({ rows, unitNoun }: { rows: UnitRow[]; unitNoun: string }) {
  // A unit with nothing logged and nothing predicted has no journey to show.
  // Listing it anyway just pads the page with dashes.
  const active = rows
    .filter((r) => r.total > 0 || r.currentMark != null || r.mastery != null)
    .sort((a, b) => (b.currentMark ?? -1) - (a.currentMark ?? -1) || b.total - a.total);

  if (active.length === 0) return null;

  return (
    <motion.div {...enter}>
      <Card>
        <CardContent sx={{ p: { xs: 2.5, sm: 3 } }}>
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="flex-end"
            spacing={2}
            sx={{ mb: 2.5 }}
          >
            <Box>
              <Typography variant="overline" color="text.secondary" sx={{ letterSpacing: "0.08em" }}>
                Where each {unitNoun} is heading
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Now, and next term
              </Typography>
            </Box>
            <Button
              component={Link}
              href="/dashboard/mastery"
              endIcon={<ArrowRight size={16} />}
              size="small"
            >
              Mastery
            </Button>
          </Stack>

          <Stack spacing={2}>
            {active.map((row, i) => (
              <motion.div key={row.unit.id} {...enterStagger(i)}>
                <UnitRowCard row={row} />
              </motion.div>
            ))}
          </Stack>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function UnitRowCard({ row }: { row: UnitRow }) {
  const { unit, total, graded, upcoming, currentMark, predictedMark, confidence, mastery, nextUp } =
    row;
  const hasMark = currentMark != null;
  const aboveBar = hasMark && currentMark >= PASS_MARK;
  // Only a real pair of numbers can describe a direction.
  const drift = hasMark && predictedMark != null ? predictedMark - currentMark : null;

  return (
    <Box
      component={Link}
      href={unit.href}
      sx={{
        display: "block",
        p: 2.5,
        borderRadius: 2,
        border: 1,
        borderColor: "divider",
        color: "inherit",
        textDecoration: "none",
        transition: "border-color 150ms ease",
        "&:hover": { borderColor: "primary.main" },
      }}
    >
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={2}>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }} noWrap>
            {unit.name}
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ display: "block" }} noWrap>
            {unit.meta}
          </Typography>
        </Box>

        <Stack direction="row" alignItems="baseline" spacing={1} sx={{ flexShrink: 0 }}>
          <Box sx={{ textAlign: "right" }}>
            <Typography
              variant="h5"
              sx={{
                fontWeight: 600,
                lineHeight: 1.1,
                fontVariantNumeric: "tabular-nums",
                color: hasMark ? (aboveBar ? "success.main" : "warning.main") : "text.secondary",
              }}
            >
              {hasMark ? `${currentMark}%` : "No mark"}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {hasMark ? "Term average" : "Nothing graded"}
            </Typography>
          </Box>
          {drift != null && (
            <Stack direction="row" alignItems="center" spacing={0.5} sx={{ pl: 1 }}>
              <ArrowRight size={14} />
              <Box sx={{ textAlign: "right" }}>
                <Typography
                  variant="h6"
                  sx={{ fontWeight: 600, lineHeight: 1.1, fontVariantNumeric: "tabular-nums" }}
                >
                  {predictedMark}%
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Next term
                </Typography>
              </Box>
            </Stack>
          )}
        </Stack>
      </Stack>

      {hasMark && (
        <LinearProgress
          variant="determinate"
          value={Math.min(currentMark, 100)}
          color={aboveBar ? "success" : "warning"}
          sx={{ height: 6, borderRadius: 999, mt: 1.5 }}
        />
      )}

      <Stack direction="row" spacing={0.75} sx={{ mt: 1.5 }} flexWrap="wrap" useFlexGap>
        <MiniChip label={`${graded} of ${total} graded`} />
        {upcoming > 0 && <MiniChip label={`${upcoming} upcoming`} />}
        {mastery && <MiniChip label={`${mastery.avg}% across ${mastery.topics} topics`} />}
        {confidence != null && confidence > 0 && (
          <MiniChip label={`${Math.round(confidence * 100)}% confidence`} />
        )}
      </Stack>

      {nextUp && (
        <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1.5 }}>
          Next: {nextUp.title}, due {dayjs(nextUp.dueDate).format("DD MMM")}
        </Typography>
      )}
    </Box>
  );
}

function MiniChip({ label }: { label: string }) {
  return (
    <Box
      sx={{
        px: 1,
        py: 0.25,
        borderRadius: 0.75,
        border: 1,
        borderColor: "divider",
        color: "text.secondary",
      }}
    >
      <Typography variant="caption" sx={{ fontWeight: 500 }}>
        {label}
      </Typography>
    </Box>
  );
}

// ─── Landmarks: the dated record ─────────────────────────────────────

function Landmarks({ landmarks }: { landmarks: Landmark[] }) {
  return (
    <motion.div {...enter}>
      <Card>
        <CardContent sx={{ p: { xs: 2.5, sm: 3 } }}>
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="flex-end"
            spacing={2}
            sx={{ mb: 2.5 }}
          >
            <Box>
              <Typography variant="overline" color="text.secondary" sx={{ letterSpacing: "0.08em" }}>
                {landmarks.length} landmark{landmarks.length === 1 ? "" : "s"}
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                What you have passed
              </Typography>
            </Box>
            <Button
              component={Link}
              href="/dashboard/assessments"
              endIcon={<ArrowRight size={16} />}
              size="small"
            >
              All assessments
            </Button>
          </Stack>

          {landmarks.length === 0 ? (
            <Box
              sx={{
                py: 5,
                px: 2,
                textAlign: "center",
                borderRadius: 2,
                border: 1,
                borderStyle: "dashed",
                borderColor: "divider",
              }}
            >
              <Typography variant="body2" color="text.secondary">
                Nothing behind you yet. The first mark you log, and the first goal you reach, land
                here.
              </Typography>
            </Box>
          ) : (
            <GroupedList
              items={landmarks}
              groupBy={(l) => dayjs(l.date).format("MMMM YYYY")}
              groupIcon={() => <Flag size={14} />}
              groupSummary={(_key, items) => {
                const marks = items.filter((i) => i.kind === "mark");
                if (marks.length === 0) return null;
                const avg = Math.round(
                  marks.reduce((s, m) => s + (m as Extract<Landmark, { kind: "mark" }>).mark, 0) /
                    marks.length,
                );
                return (
                  <Typography variant="caption" color="text.secondary">
                    {marks.length} mark{marks.length === 1 ? "" : "s"}, {avg}% average
                  </Typography>
                );
              }}
              renderItem={(l) => <LandmarkRow landmark={l} />}
            />
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

function LandmarkRow({ landmark }: { landmark: Landmark }) {
  const theme = useTheme();

  if (landmark.kind === "goal") {
    return (
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1.5,
          p: 1.5,
          borderRadius: 2,
          border: 1,
          borderColor: "divider",
        }}
      >
        <Box
          sx={{
            width: 32,
            height: 32,
            borderRadius: 1,
            flexShrink: 0,
            display: "grid",
            placeItems: "center",
            color: "achievement.main",
            bgcolor: alpha(theme.palette.achievement.main, 0.12),
          }}
        >
          <CircleCheck size={16} />
        </Box>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>
            {landmark.title}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Goal reached · {dayjs(landmark.date).format("DD MMM")}
          </Typography>
        </Box>
        <StatusChip kind="achievement" label="Reached" sx={{ flexShrink: 0 }} />
      </Box>
    );
  }

  const above = landmark.mark >= PASS_MARK;
  // The delta only exists where the student made a call before the mark landed.
  const delta = landmark.predicted != null ? landmark.mark - landmark.predicted : null;

  return (
    <Box
      component={Link}
      href={`/dashboard/assessments/${landmark.id}`}
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 1.5,
        p: 1.5,
        borderRadius: 2,
        border: 1,
        borderColor: "divider",
        color: "inherit",
        textDecoration: "none",
        transition: "border-color 150ms ease",
        "&:hover": { borderColor: "primary.main" },
      }}
    >
      <Box
        sx={{
          width: 44,
          height: 44,
          borderRadius: 1,
          flexShrink: 0,
          display: "grid",
          placeItems: "center",
          fontVariantNumeric: "tabular-nums",
          color: above ? "success.main" : "warning.main",
          bgcolor: (t) =>
            alpha(above ? t.palette.success.main : t.palette.warning.main, 0.12),
        }}
      >
        <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
          {landmark.mark}
        </Typography>
      </Box>

      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>
          {landmark.title}
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ display: "block" }} noWrap>
          {landmark.unitName} · {ASSESSMENT_TYPE_LABELS[landmark.type]} · {landmark.weight}% weight
        </Typography>
      </Box>

      <Box sx={{ textAlign: "right", flexShrink: 0 }}>
        <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
          {dayjs(landmark.date).format("DD MMM")}
        </Typography>
        {delta != null && (
          <Typography
            variant="caption"
            sx={{
              fontWeight: 600,
              fontVariantNumeric: "tabular-nums",
              color:
                delta > 0 ? "success.main" : delta < 0 ? "warning.main" : "text.secondary",
            }}
          >
            {delta > 0 ? `+${delta}` : delta} vs your call
          </Typography>
        )}
      </Box>
    </Box>
  );
}

// ─── Empty states ─────────────────────────────────────────────────────

function NoUnitsYet({
  unitNoun,
  unitNounPlural,
  addHref,
}: {
  unitNoun: string;
  unitNounPlural: string;
  addHref: string;
}) {
  return (
    <motion.div {...enter}>
      <Card>
        <CardContent sx={{ p: 6, textAlign: "center" }}>
          <CenterIcon>
            <Route size={24} />
          </CenterIcon>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
            Your journey starts with a {unitNoun}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 420, mx: "auto", mb: 3 }}>
            Add your {unitNounPlural} so we can track each assessment as a landmark on your way
            through the year.
          </Typography>
          <Button component={Link} href={addHref} variant="contained" endIcon={<ArrowRight size={16} />}>
            Add {unitNounPlural}
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function NoAssessmentsYet({ unitCount, unitNoun }: { unitCount: number; unitNoun: string }) {
  return (
    <motion.div {...enter}>
      <Card>
        <CardContent sx={{ p: 6, textAlign: "center" }}>
          <CenterIcon>
            <Route size={24} />
          </CenterIcon>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
            Log your first assessment
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 460, mx: "auto", mb: 3 }}>
            You are enrolled in {unitCount} {unitNoun}
            {unitCount === 1 ? "" : "s"}. Each assessment you log becomes a landmark here: your own
            prediction first, then the real mark, then the next one.
          </Typography>
          <Stack direction="row" spacing={1.5} justifyContent="center" flexWrap="wrap" useFlexGap>
            <Button
              component={Link}
              href="/dashboard/assessments/new"
              variant="contained"
              endIcon={<ArrowRight size={16} />}
            >
              Log an assessment
            </Button>
            <Button component={Link} href="/dashboard/practice" variant="text">
              Take a practice test
            </Button>
          </Stack>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function CenterIcon({ children }: { children: React.ReactNode }) {
  return (
    <Box
      sx={{
        width: 56,
        height: 56,
        borderRadius: "50%",
        mx: "auto",
        mb: 2,
        display: "grid",
        placeItems: "center",
        bgcolor: (t) => alpha(t.palette.primary.main, t.palette.mode === "dark" ? 0.12 : 0.08),
        color: "primary.main",
      }}
    >
      {children}
    </Box>
  );
}

function LoadingSkeleton() {
  return (
    <Stack spacing={3}>
      <Card>
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ height: 320, bgcolor: "action.hover", borderRadius: 1 }} />
        </CardContent>
      </Card>
      <Card>
        <CardContent sx={{ p: 3 }}>
          <Stack spacing={2}>
            <Box sx={{ height: 88, bgcolor: "action.hover", borderRadius: 1 }} />
            <Box sx={{ height: 88, bgcolor: "action.hover", borderRadius: 1 }} />
          </Stack>
        </CardContent>
      </Card>
    </Stack>
  );
}
