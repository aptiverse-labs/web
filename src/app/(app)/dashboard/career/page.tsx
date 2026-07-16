"use client";

import { useMemo, useState } from "react";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CardActionArea from "@mui/material/CardActionArea";
import Grid from "@mui/material/Grid";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Skeleton from "@mui/material/Skeleton";
import LinearProgress from "@mui/material/LinearProgress";
import { alpha, useTheme, type Theme } from "@mui/material/styles";
import Link from "next/link";
import {
  GraduationCap,
  Plus,
  TriangleAlert,
  CalendarClock,
  ChevronRight,
  Compass,
  FlaskConical,
} from "lucide-react";
import Alert from "@mui/material/Alert";
import { PageHeader } from "@/components/common/PageHeader";
import { EmptyState } from "@/components/common/EmptyState";
import { CardError } from "@/components/common/CardError";
import { AtmosphericBackdrop } from "@/components/common/AtmosphericBackdrop";
import { TargetDialog } from "@/components/career/TargetDialog";
import { WhatIfPanel, type WhatIfUnit } from "@/components/career/WhatIfPanel";
import { ReachChip, targetTone, toneHex } from "@/components/career/ReachChip";
import {
  useAcademicUnits,
  useAcademicSignals,
  useAcademicProfile,
  useCurriculumSubjects,
  type AcademicUnit,
} from "@/lib/api/queries";
import { useAdmissionTargets } from "@/lib/api/targets";
import {
  triage,
  reachLabel,
  stageLabel,
  type ReachInputs,
  type TargetReach,
} from "@/lib/targets/reach";
import { formatDate } from "@/lib/format";

// Career navigator.
//
// What this page does NOT do: score you against a career catalogue, quote a
// salary, rate a degree's "demand", or tell you what UCT requires. There is no
// such data in this system and there is not going to be. The old page rendered
// an "87% match" ring against `/api/careers`, which is a stub that returns an
// empty array, and then blamed the student for the empty result.
//
// What it does instead is the thing the student actually cannot do alone. They
// research what a place requires and enter it. We hold the other half: the
// marks, the term predictions, the topic mastery, all computed from real work.
// Putting the two side by side turns "I want to study engineering" into "you
// need 70 in Maths, you are at 58, that is 12 to find, and here are the three
// topics costing you the most". Aim, gap, drill, proof.
//
// The ordering is the feature. A student applying to five institutions carries
// five vague dreads; a list sorted by reach converts that into one sentence.

function band(v: number): { color: "success" | "primary" | "warning"; label: string } {
  if (v >= 80) return { color: "success", label: "Strong" };
  if (v >= 50) return { color: "primary", label: "Building" };
  return { color: "warning", label: "Keep going" };
}

function bandHex(t: Theme, v: number): string {
  if (v >= 80) return t.palette.success.main;
  if (v >= 50) return t.palette.primary.main;
  return t.palette.warning.main;
}

type RankedUnit = {
  unit: AcademicUnit;
  currentMark: number | null;
  mastery: { avg: number; topics: number } | null;
  score: number | null;
};

export default function CareerPage() {
  const profile = useAcademicProfile();
  const academic = useAcademicUnits();
  const signals = useAcademicSignals();
  const targetsQuery = useAdmissionTargets();

  // educationLevel is undefined until the profile resolves. Key off isSuccess,
  // never off the value, or the wrong cohort's UI flashes on first paint.
  const isTertiary = profile.isSuccess && profile.data?.educationLevel === "tertiary";
  const catalog = useCurriculumSubjects(
    profile.isSuccess && !isTertiary ? profile.data?.curriculumId : null,
  );

  const [dialogOpen, setDialogOpen] = useState(false);
  const [overrides, setOverrides] = useState<Record<string, number>>({});

  const inputs: ReachInputs = useMemo(
    () => ({
      units: academic.units,
      signalsFor: signals.signalsFor,
      catalog: catalog.data ?? [],
      overrides,
    }),
    [academic.units, signals.signalsFor, catalog.data, overrides],
  );

  const targets = targetsQuery.data ?? [];
  const active = targets.filter((t) => t.status === "active");
  const ranked = useMemo(() => triage(active, inputs), [active, inputs]);
  const blocked = ranked.filter((r) => r.status === "blocked");

  // Only offer a what-if on units a plan actually depends on and the student is
  // actually enrolled in. A slider for a subject no plan mentions would answer
  // a question nobody asked.
  const whatIfUnits: WhatIfUnit[] = useMemo(() => {
    const needed = new Set(active.flatMap((t) => t.requirements.map((r) => r.unitId)));
    return academic.units
      .filter((u) => needed.has(u.id))
      .map((u) => {
        const s = signals.signalsFor(u.id);
        return { id: u.id, name: u.name, actual: s.currentMark ?? s.mastery?.avg ?? null };
      });
  }, [active, academic.units, signals]);

  const whatIfActive = Object.keys(overrides).length > 0;

  const rankedUnits: RankedUnit[] = academic.units
    .map((unit) => {
      const s = signals.signalsFor(unit.id);
      return {
        unit,
        currentMark: s.currentMark,
        mastery: s.mastery,
        score: s.currentMark ?? s.mastery?.avg ?? null,
      };
    })
    .sort((a, b) => (b.score ?? -1) - (a.score ?? -1));

  const loading =
    profile.isLoading || academic.isLoading || signals.isLoading || targetsQuery.isLoading;
  const withEvidence = rankedUnits.filter((r) => r.score !== null).length;

  return (
    <AtmosphericBackdrop>
      <PageHeader
        title="Career navigator"
        description="What you're aiming at, how far off you are, and what to do about it. You bring the requirements, we bring the marks."
        breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Career" }]}
        actions={
          <Button
            variant="contained"
            color="secondary"
            startIcon={<Plus size={16} />}
            onClick={() => setDialogOpen(true)}
          >
            Add a plan
          </Button>
        }
      />

      {loading ? (
        <CareerSkeleton />
      ) : targetsQuery.isError ? (
        <Card>
          <CardContent sx={{ p: 3 }}>
            <CardError onRetry={() => void targetsQuery.refetch()} what="your plans" />
          </CardContent>
        </Card>
      ) : (
        <Stack spacing={3}>
          {blocked.length > 0 && (
            <SubjectChoiceAlert blocked={blocked} unitNoun={academic.unitNoun} />
          )}

          {whatIfActive && (
            <Alert severity="info" icon={<FlaskConical size={18} />}>
              You&apos;re looking at hypothetical marks, not your real ones. Nothing here is saved.
            </Alert>
          )}

          <Grid container spacing={3}>
            <Grid size={{ xs: 12, lg: 7 }}>
              <Stack spacing={3}>
                <PlansCard
                  ranked={ranked}
                  hasAny={targets.length > 0}
                  isTertiary={isTertiary}
                  onAdd={() => setDialogOpen(true)}
                />
                {whatIfUnits.length > 0 && (
                  <WhatIfPanel
                    units={whatIfUnits}
                    overrides={overrides}
                    onChange={(unitId, value) => setOverrides((o) => ({ ...o, [unitId]: value }))}
                    onReset={() => setOverrides({})}
                  />
                )}
              </Stack>
            </Grid>
            <Grid size={{ xs: 12, lg: 5 }}>
              <EvidenceCard
                ranked={rankedUnits}
                withEvidence={withEvidence}
                hasUnits={academic.units.length > 0}
                unitNoun={academic.unitNoun}
                unitNounPlural={academic.unitNounPlural}
                addHref={academic.addHref}
              />
            </Grid>
          </Grid>
        </Stack>
      )}

      <TargetDialog open={dialogOpen} onClose={() => setDialogOpen(false)} />
    </AtmosphericBackdrop>
  );
}

// ── states ────────────────────────────────────────────────────────────

function CareerSkeleton() {
  return (
    <Grid container spacing={3}>
      <Grid size={{ xs: 12, lg: 7 }}>
        <Skeleton variant="rounded" height={420} />
      </Grid>
      <Grid size={{ xs: 12, lg: 5 }}>
        <Skeleton variant="rounded" height={420} />
      </Grid>
    </Grid>
  );
}

// ── the subject-choice warning ────────────────────────────────────────

// The most valuable thing on this page, which is why it sits above everything.
//
// In South Africa a subject choice made at fourteen quietly decides eligibility
// at eighteen: Mathematical Literacy instead of Mathematics closes off
// engineering, actuarial science and most BScs, and nobody tells the student
// until it is far too late to switch. We are not predicting anything here and
// we are not consulting a table of which degrees need which subjects. We are
// pointing out that two things the student told us contradict each other: their
// plan names a subject their enrolment does not.
function SubjectChoiceAlert({ blocked, unitNoun }: { blocked: TargetReach[]; unitNoun: string }) {
  const substituted = blocked.flatMap((r) => r.blocked.filter((b) => b.status === "substituted"));

  return (
    <Card
      sx={{
        borderLeft: 3,
        borderColor: "error.main",
        bgcolor: (t) => alpha(t.palette.error.main, 0.04),
      }}
    >
      <CardContent sx={{ p: { xs: 2.5, sm: 3 } }}>
        <Stack direction="row" spacing={2} alignItems="flex-start">
          <Box sx={{ color: "error.main", flexShrink: 0, pt: 0.25 }}>
            <TriangleAlert size={20} />
          </Box>
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.75 }}>
              {substituted.length > 0
                ? "A subject choice is blocking a plan"
                : `A plan needs a ${unitNoun} you're not taking`}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2, maxWidth: "68ch" }}>
              Worth knowing now rather than later. This isn&apos;t a prediction: it&apos;s your own
              plan asking for a {unitNoun} your own enrolment doesn&apos;t list.
            </Typography>

            <Stack spacing={1.25}>
              {blocked.map((r) =>
                r.blocked.map((b) => (
                  <Box key={`${r.target.id}-${b.id}`}>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {r.target.programme} at {r.target.institution}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {b.status === "substituted"
                        ? `Needs ${b.unitName} at ${b.minimumPercent}%. You're taking ${b.substituteName} instead.`
                        : `Needs ${b.unitName} at ${b.minimumPercent}%. You're not taking it.`}
                    </Typography>
                  </Box>
                )),
              )}
            </Stack>

            {substituted.length > 0 && (
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ display: "block", mt: 2, maxWidth: "68ch" }}
              >
                If that&apos;s wrong, fix whichever half is out of date: update your subjects, or
                edit the plan. If it&apos;s right, talk to someone at school about it this term.
                Switching gets harder every year, and it is not always possible.
              </Typography>
            )}
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
}

// ── plans ─────────────────────────────────────────────────────────────

function PlansCard({
  ranked,
  hasAny,
  isTertiary,
  onAdd,
}: {
  ranked: TargetReach[];
  hasAny: boolean;
  isTertiary: boolean;
  onAdd: () => void;
}) {
  return (
    <Card sx={{ height: "100%" }}>
      <CardContent sx={{ p: 3 }}>
        <Typography variant="overline" color="text.secondary">
          Your plans
        </Typography>
        <Typography variant="h6" sx={{ mb: ranked.length ? 0.5 : 0 }}>
          Sorted by how far off you are
        </Typography>

        {ranked.length === 0 ? (
          <Box sx={{ py: 4 }}>
            <EmptyState
              icon={<Compass />}
              title={hasAny ? "No active plans" : "What are you aiming at?"}
              description={
                hasAny
                  ? "Your plans are all archived. Add a new one, or reopen an archived plan to start tracking it again."
                  : isTertiary
                    ? "Look up what the programme asks for, then enter it here: the average it wants, and the mark each course needs. We'll track it against your real marks and show you exactly where the gap is."
                    : "Look up what your institution asks for, then enter it here: the APS or average, and the mark each subject needs. We'll track it against your real marks and show you exactly where the gap is."
              }
              action={
                <Button variant="contained" color="secondary" startIcon={<Plus size={16} />} onClick={onAdd}>
                  Add a plan
                </Button>
              }
            />
          </Box>
        ) : (
          <>
            <PlansOverview ranked={ranked} />
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5, maxWidth: "60ch" }}>
              Closest first. The number is your biggest single gap, because an application is
              judged on the requirement you missed, not the average of the ones you met.
            </Typography>
            <Stack spacing={1.5}>
              {ranked.map((r) => (
                <PlanRow key={r.target.id} reach={r} />
              ))}
            </Stack>
          </>
        )}
      </CardContent>
    </Card>
  );
}

// A one-glance rollup across every active plan. It exists for the exact student
// this feature is for: the one carrying five applications at once. Every count
// here is read straight off the same triage the list below is built from, so the
// summary and the list can never disagree. Shown only from two plans up, because
// with one plan the row below already says everything this would.
function PlansOverview({ ranked }: { ranked: TargetReach[] }) {
  if (ranked.length < 2) return null;

  const onTrack = ranked.filter((r) => r.status === "clear").length;
  const shortCount = ranked.filter((r) => r.status === "short").length;
  const blockedCount = ranked.filter((r) => r.status === "blocked").length;
  const unmeasured = ranked.filter((r) => r.status === "unknown" || r.status === "empty").length;

  const nearest = ranked
    .map((r) => r.target.deadline)
    .filter((d): d is string => !!d)
    .map((d) => Math.ceil((Number(new Date(d)) - Date.now()) / 86_400_000))
    .filter((days) => days >= 0)
    .sort((a, b) => a - b)[0];

  return (
    <Stack
      direction="row"
      spacing={1}
      flexWrap="wrap"
      useFlexGap
      alignItems="center"
      sx={{ mt: 1.5, mb: 2.5 }}
    >
      {onTrack > 0 && <ReachChip tone="success" label={`${onTrack} on track`} />}
      {shortCount > 0 && <ReachChip tone="warning" label={`${shortCount} short`} />}
      {blockedCount > 0 && (
        <ReachChip tone="error" label={blockedCount === 1 ? "1 blocked" : `${blockedCount} blocked`} />
      )}
      {unmeasured > 0 && <ReachChip tone="neutral" label={`${unmeasured} to measure`} />}
      {nearest !== undefined && (
        <Stack direction="row" spacing={0.5} alignItems="center" sx={{ ml: 0.5 }}>
          <Box sx={{ color: nearest <= 30 ? "warning.main" : "text.disabled", display: "flex" }}>
            <CalendarClock size={13} />
          </Box>
          <Typography
            variant="caption"
            sx={{ color: nearest <= 30 ? "warning.main" : "text.secondary" }}
          >
            {nearest === 0
              ? "Nearest deadline today"
              : `Nearest deadline in ${nearest} day${nearest === 1 ? "" : "s"}`}
          </Typography>
        </Stack>
      )}
    </Stack>
  );
}

function PlanRow({ reach }: { reach: TargetReach }) {
  const theme = useTheme();
  const tone = targetTone(reach.status);
  const hex = toneHex(theme, tone);
  const { target } = reach;

  const parts: string[] = [];
  if (reach.clearCount) parts.push(`${reach.clearCount} clear`);
  if (reach.short.length) parts.push(`${reach.short.length} short`);
  if (reach.blocked.length) parts.push(`${reach.blocked.length} missing`);
  if (reach.unknownCount) parts.push(`${reach.unknownCount} unmarked`);

  const daysLeft = target.deadline
    ? Math.ceil((Number(new Date(target.deadline)) - Date.now()) / 86_400_000)
    : null;

  return (
    <Card variant="outlined" sx={{ borderLeft: 3, borderLeftColor: hex }}>
      <CardActionArea component={Link} href={`/dashboard/career/targets/${target.id}`}>
        <Box sx={{ p: 2 }}>
          <Stack direction="row" spacing={1.5} alignItems="flex-start">
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography variant="body2" sx={{ fontWeight: 700 }} noWrap>
                {target.programme}
              </Typography>
              <Typography variant="caption" color="text.secondary" noWrap sx={{ display: "block" }}>
                {target.institution}
                {target.kind === "progression" && target.stage ? ` · ${stageLabel(target.stage)}` : ""}
              </Typography>
            </Box>
            <ReachChip tone={tone} label={reachLabel(reach)} />
            <Box sx={{ color: "text.disabled", flexShrink: 0, pt: 0.25 }}>
              <ChevronRight size={16} />
            </Box>
          </Stack>

          {parts.length > 0 && (
            <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1 }}>
              {parts.join(" · ")}
            </Typography>
          )}

          {daysLeft !== null && (
            <Stack direction="row" spacing={0.75} alignItems="center" sx={{ mt: 1 }}>
              <Box sx={{ color: daysLeft <= 30 ? "warning.main" : "text.disabled", display: "flex" }}>
                <CalendarClock size={13} />
              </Box>
              <Typography
                variant="caption"
                sx={{ color: daysLeft <= 30 ? "warning.main" : "text.secondary" }}
              >
                {daysLeft < 0
                  ? `Closed ${formatDate(target.deadline!)}`
                  : daysLeft === 0
                    ? "Closes today"
                    : `${daysLeft} day${daysLeft === 1 ? "" : "s"} to apply · ${formatDate(target.deadline!)}`}
              </Typography>
            </Stack>
          )}
        </Box>
      </CardActionArea>
    </Card>
  );
}

// ── evidence ──────────────────────────────────────────────────────────

function EvidenceCard({
  ranked,
  withEvidence,
  hasUnits,
  unitNoun,
  unitNounPlural,
  addHref,
}: {
  ranked: RankedUnit[];
  withEvidence: number;
  hasUnits: boolean;
  unitNoun: string;
  unitNounPlural: string;
  addHref: string;
}) {
  return (
    <Card sx={{ height: "100%" }}>
      <CardContent sx={{ p: 3 }}>
        <Typography variant="overline" color="text.secondary">
          Your record
        </Typography>
        <Typography variant="h6" sx={{ mb: 0.5 }}>
          Where you stand, {unitNoun} by {unitNoun}
        </Typography>

        {!hasUnits ? (
          // The one case where asking for units is honest: there are none.
          <Box sx={{ py: 4 }}>
            <EmptyState
              icon={<GraduationCap />}
              title={`Add your ${unitNounPlural} first`}
              description={`Your marks and practice are what this page reads. Once your ${unitNounPlural} are in, your record builds itself from the work you log.`}
              action={
                <Button variant="contained" component={Link} href={addHref}>
                  Add {unitNounPlural}
                </Button>
              }
            />
          </Box>
        ) : withEvidence === 0 ? (
          // They have units. Never ask for them again. Ask for the work.
          <Box sx={{ py: 5, textAlign: "center" }}>
            <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 420, mx: "auto", mb: 2.5 }}>
              Your {unitNounPlural} are set up, but there&apos;s nothing to rank yet. Log a graded
              mark or take a practice test and this fills in from your real results.
            </Typography>
            <Stack direction="row" spacing={1.5} justifyContent="center" flexWrap="wrap" useFlexGap>
              <Button component={Link} href="/dashboard/assessments" variant="contained" color="secondary" size="small">
                Log a mark
              </Button>
              <Button component={Link} href="/dashboard/practice" variant="outlined" size="small">
                Take a practice test
              </Button>
            </Stack>
          </Box>
        ) : (
          <>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
              Your current term mark, or practice mastery where you haven&apos;t been graded yet.
              This is what every plan is measured against.
            </Typography>
            <Stack spacing={2}>
              {ranked.map((r) => (
                <UnitRow key={r.unit.id} r={r} />
              ))}
            </Stack>
          </>
        )}
      </CardContent>
    </Card>
  );
}

function UnitRow({ r }: { r: RankedUnit }) {
  const theme = useTheme();
  const { unit, currentMark, mastery, score } = r;
  const hex = score !== null ? bandHex(theme, score) : theme.palette.text.disabled;

  return (
    <Box>
      <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 0.75 }}>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography
            component={Link}
            href={unit.href}
            variant="body2"
            sx={{
              fontWeight: 600,
              color: "text.primary",
              textDecoration: "none",
              display: "block",
              "&:hover": { color: "primary.main" },
            }}
            noWrap
          >
            {unit.name}
          </Typography>
          <Typography variant="caption" color="text.secondary" noWrap sx={{ display: "block" }}>
            {/* Only ever states what exists. No graded work says so plainly. */}
            {currentMark !== null
              ? `Current mark${mastery ? ` · ${mastery.topics} topic${mastery.topics === 1 ? "" : "s"} practised` : ""}`
              : mastery
                ? `Practice mastery · ${mastery.topics} topic${mastery.topics === 1 ? "" : "s"}`
                : "No marks or practice yet"}
          </Typography>
        </Box>
        <Box
          sx={{
            px: 1,
            py: 0.25,
            minWidth: 52,
            textAlign: "center",
            borderRadius: 1,
            fontWeight: 700,
            fontSize: "0.8125rem",
            fontVariantNumeric: "tabular-nums",
            color: hex,
            bgcolor: alpha(hex, 0.14),
            flexShrink: 0,
          }}
        >
          {score !== null ? `${score}%` : "-"}
        </Box>
      </Stack>
      <LinearProgress
        variant="determinate"
        value={score ?? 0}
        color={score !== null ? band(score).color : "inherit"}
        sx={{ opacity: score !== null ? 1 : 0.35 }}
      />
    </Box>
  );
}
