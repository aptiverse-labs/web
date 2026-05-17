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
import { motion } from "framer-motion";
import { PageHeader } from "@/components/common/PageHeader";
import { QueryStates } from "@/components/common/QueryStates";
import { useSubjects } from "@/lib/api/queries";
import type { Subject } from "@/lib/mockData";
import { enter, enterStagger } from "@/lib/motion";
import RouteIcon from "@mui/icons-material/RouteOutlined";
import CheckCircleIcon from "@mui/icons-material/CheckCircleOutlined";
import TrendingUpIcon from "@mui/icons-material/TrendingUpOutlined";
import RadioButtonUncheckedIcon from "@mui/icons-material/RadioButtonUncheckedOutlined";
import ArrowForwardIcon from "@mui/icons-material/ArrowForwardOutlined";

type Topic = { name: string; mastery: number; subject: string; subjectId: string };

const MASTERED_THRESHOLD = 70;
const IN_PROGRESS_THRESHOLD = 40;

export default function JourneyPage() {
  const query = useSubjects();

  return (
    <>
      <PageHeader
        title="Your learning journey"
        description="Each landmark is a topic mastered. Growth, not ranking — celebrate every step."
        breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Journey" }]}
      />

      <QueryStates
        query={query}
        empty={{
          icon: <RouteIcon />,
          title: "Your journey starts with a subject",
          description: "Add your subjects to see topics tracked as you move from upcoming → in progress → mastered.",
          action: (
            <Button component={Link} href="/dashboard/subjects" variant="contained" endIcon={<ArrowForwardIcon />}>
              Add subjects
            </Button>
          ),
        }}
      >
        {(subjects) => <JourneyView subjects={subjects} />}
      </QueryStates>
    </>
  );
}

function JourneyView({ subjects }: { subjects: Subject[] }) {
  const topics: Topic[] = useMemo(
    () =>
      subjects.flatMap((s) =>
        (s.topics ?? []).map((t) => ({
          name: t.name,
          mastery: t.mastery,
          subject: s.name,
          subjectId: s.id,
        })),
      ),
    [subjects],
  );

  const mastered   = topics.filter((t) => t.mastery >= MASTERED_THRESHOLD);
  const inProgress = topics.filter((t) => t.mastery >= IN_PROGRESS_THRESHOLD && t.mastery < MASTERED_THRESHOLD);
  const upcoming   = topics.filter((t) => t.mastery < IN_PROGRESS_THRESHOLD);

  const total = topics.length;
  const masteredPct = total > 0 ? Math.round((mastered.length / total) * 100) : 0;
  const overallAvg = total > 0
    ? Math.round(topics.reduce((acc, t) => acc + t.mastery, 0) / total)
    : 0;

  // The "what to look at next" beat: the lowest-mastery topic in the
  // in-progress band. If nothing's in progress, pull the highest-mastery
  // upcoming topic instead — that's the next one to nudge.
  const nextUp =
    inProgress.length > 0
      ? [...inProgress].sort((a, b) => a.mastery - b.mastery)[0]
      : upcoming.length > 0
        ? [...upcoming].sort((a, b) => b.mastery - a.mastery)[0]
        : undefined;

  if (total === 0) {
    return <NoTopicsYet />;
  }

  return (
    <Stack spacing={3}>
      <JourneyHero
        total={total}
        mastered={mastered.length}
        inProgress={inProgress.length}
        upcoming={upcoming.length}
        masteredPct={masteredPct}
        overallAvg={overallAvg}
        nextUp={nextUp}
      />

      <Grid container spacing={2.5}>
        <Grid size={{ xs: 12, md: 4 }}>
          <Column
            tone="mastered"
            label="Mastered"
            count={mastered.length}
            topics={mastered}
            emptyHint="Nothing mastered yet — every expert started where you are now."
          />
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <Column
            tone="progress"
            label="In progress"
            count={inProgress.length}
            topics={inProgress}
            emptyHint="Nothing in progress — pick a topic from upcoming to start."
          />
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <Column
            tone="upcoming"
            label="Upcoming"
            count={upcoming.length}
            topics={upcoming}
            emptyHint="You've started on every topic — beautiful."
          />
        </Grid>
      </Grid>

      <BySubjectBreakdown subjects={subjects} />
    </Stack>
  );
}

// ─── Hero: the at-a-glance summary + next-up suggestion ──────────────

function JourneyHero({
  total,
  mastered,
  inProgress,
  upcoming,
  masteredPct,
  overallAvg,
  nextUp,
}: {
  total: number;
  mastered: number;
  inProgress: number;
  upcoming: number;
  masteredPct: number;
  overallAvg: number;
  nextUp?: Topic;
}) {
  return (
    <motion.div {...enter}>
      <Card>
        <CardContent sx={{ p: { xs: 2.5, sm: 3.5 } }}>
          <Grid container spacing={3} alignItems="center">
            <Grid size={{ xs: 12, md: 7 }}>
              <Typography variant="overline" color="text.secondary" sx={{ letterSpacing: "0.08em" }}>
                Overall mastery
              </Typography>
              <Stack direction="row" alignItems="baseline" spacing={1} sx={{ mt: 0.5, mb: 1.5 }}>
                <Typography variant="h3" component="div" sx={{ fontWeight: 600, lineHeight: 1.05 }}>
                  {masteredPct}
                </Typography>
                <Typography variant="h6" color="text.secondary" sx={{ fontWeight: 500 }}>
                  % of topics mastered
                </Typography>
              </Stack>

              <LinearProgress
                variant="determinate"
                value={masteredPct}
                sx={{ height: 8, borderRadius: 999, mb: 2.5 }}
              />

              <Grid container spacing={2.5}>
                <Grid size={4}>
                  <SmallStat label="Mastered" value={`${mastered}`} sub={`of ${total}`} />
                </Grid>
                <Grid size={4}>
                  <SmallStat label="In progress" value={`${inProgress}`} sub="moving" />
                </Grid>
                <Grid size={4}>
                  <SmallStat label="Upcoming" value={`${upcoming}`} sub="to start" />
                </Grid>
              </Grid>
            </Grid>

            <Grid size={{ xs: 12, md: 5 }}>
              {nextUp ? (
                <Box
                  sx={{
                    p: 2.5,
                    borderRadius: 2,
                    border: 1,
                    borderColor: "divider",
                    bgcolor: (t) =>
                      t.palette.mode === "dark"
                        ? "rgba(255,255,255,0.02)"
                        : "rgba(0,0,0,0.02)",
                  }}
                >
                  <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                    <TrendingUpIcon fontSize="small" sx={{ color: "primary.main" }} />
                    <Typography variant="overline" color="primary.main" sx={{ letterSpacing: "0.08em" }}>
                      Next up
                    </Typography>
                  </Stack>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
                    {nextUp.name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1.5 }}>
                    {nextUp.subject} · {nextUp.mastery}% mastery · average across all topics is {overallAvg}%
                  </Typography>
                  <Stack direction="row" spacing={1}>
                    <Button
                      component={Link}
                      href={`/dashboard/practice?topic=${encodeURIComponent(nextUp.name)}`}
                      variant="contained"
                      size="small"
                      endIcon={<ArrowForwardIcon />}
                    >
                      Practice this
                    </Button>
                    <Button
                      component={Link}
                      href={`/dashboard/subjects/${nextUp.subjectId}`}
                      variant="text"
                      size="small"
                    >
                      Open subject
                    </Button>
                  </Stack>
                </Box>
              ) : (
                <Box sx={{ textAlign: "center", py: 4 }}>
                  <Typography variant="body2" color="text.secondary">
                    Every topic is mastered. Take a victory lap.
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

function SmallStat({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <Box>
      <Typography variant="caption" color="text.secondary" sx={{ display: "block", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600 }}>
        {label}
      </Typography>
      <Stack direction="row" alignItems="baseline" spacing={0.5} sx={{ mt: 0.25 }}>
        <Typography variant="h5" sx={{ fontWeight: 600, lineHeight: 1.1 }}>
          {value}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {sub}
        </Typography>
      </Stack>
    </Box>
  );
}

// ─── Column: one of mastered / in-progress / upcoming ────────────────

function Column({
  tone,
  label,
  count,
  topics,
  emptyHint,
}: {
  tone: "mastered" | "progress" | "upcoming";
  label: string;
  count: number;
  topics: Topic[];
  emptyHint: string;
}) {
  const sorted = [...topics].sort((a, b) =>
    tone === "upcoming" ? b.mastery - a.mastery : b.mastery - a.mastery,
  );
  const accentColor = tone === "mastered" ? "success.main" : tone === "progress" ? "primary.main" : "text.secondary";
  const Icon =
    tone === "mastered" ? CheckCircleIcon : tone === "progress" ? TrendingUpIcon : RadioButtonUncheckedIcon;

  return (
    <motion.div {...enter} style={{ height: "100%" }}>
      <Card sx={{ height: "100%" }}>
        <CardContent sx={{ p: { xs: 2.5, sm: 3 } }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
            <Stack direction="row" alignItems="center" spacing={1}>
              <Icon fontSize="small" sx={{ color: accentColor }} />
              <Typography variant="overline" color="text.secondary" sx={{ letterSpacing: "0.08em" }}>
                {label}
              </Typography>
            </Stack>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
              {count}
            </Typography>
          </Stack>

          {sorted.length === 0 ? (
            <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
              {emptyHint}
            </Typography>
          ) : (
            <Stack spacing={1}>
              {sorted.map((t, i) => (
                <motion.div key={`${t.subjectId}-${t.name}`} {...enterStagger(i)}>
                  <Box
                    sx={{
                      p: 1.5,
                      borderRadius: 1.5,
                      border: 1,
                      borderColor: tone === "upcoming" ? "divider" : "divider",
                      transition: "border-color 150ms ease, background-color 150ms ease",
                      "&:hover": {
                        borderColor: tone === "mastered" ? "success.main" : tone === "progress" ? "primary.main" : "text.secondary",
                      },
                    }}
                  >
                    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.5 }}>
                      <Typography variant="body2" sx={{ fontWeight: 500 }} noWrap>
                        {t.name}
                      </Typography>
                      <Typography variant="caption" sx={{ fontWeight: 600, color: accentColor, flexShrink: 0, ml: 1 }}>
                        {t.mastery}%
                      </Typography>
                    </Stack>
                    <Typography variant="caption" color="text.secondary" noWrap sx={{ display: "block" }}>
                      {t.subject}
                    </Typography>
                  </Box>
                </motion.div>
              ))}
            </Stack>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

// ─── Per-subject mastery rollup ──────────────────────────────────────

function BySubjectBreakdown({ subjects }: { subjects: Subject[] }) {
  const rows = subjects
    .map((s) => {
      const topics = s.topics ?? [];
      const avg = topics.length > 0
        ? Math.round(topics.reduce((acc, t) => acc + t.mastery, 0) / topics.length)
        : 0;
      const masteredCount = topics.filter((t) => t.mastery >= MASTERED_THRESHOLD).length;
      return {
        id: s.id,
        name: s.name,
        topicsCount: topics.length,
        masteredCount,
        avg,
      };
    })
    .filter((r) => r.topicsCount > 0)
    .sort((a, b) => b.avg - a.avg);

  if (rows.length === 0) return null;

  return (
    <motion.div {...enter}>
      <Card>
        <CardContent sx={{ p: { xs: 2.5, sm: 3 } }}>
          <Stack direction="row" justifyContent="space-between" alignItems="flex-end" sx={{ mb: 2 }}>
            <Box>
              <Typography variant="overline" color="text.secondary" sx={{ letterSpacing: "0.08em" }}>
                Per subject
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Where you stand
              </Typography>
            </Box>
          </Stack>

          <Stack spacing={1.5}>
            {rows.map((r, i) => (
              <motion.div key={r.id} {...enterStagger(i)}>
                <Box
                  component={Link}
                  href={`/dashboard/subjects/${r.id}`}
                  sx={{
                    display: "block",
                    p: 2,
                    borderRadius: 1.5,
                    border: 1,
                    borderColor: "divider",
                    textDecoration: "none",
                    color: "inherit",
                    transition: "border-color 150ms ease",
                    "&:hover": { borderColor: "text.secondary" },
                  }}
                >
                  <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                    <Box>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                        {r.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {r.masteredCount} of {r.topicsCount} mastered
                      </Typography>
                    </Box>
                    <Typography
                      variant="h6"
                      sx={{
                        fontWeight: 600,
                        color: r.avg >= MASTERED_THRESHOLD
                          ? "success.main"
                          : r.avg >= IN_PROGRESS_THRESHOLD
                            ? "primary.main"
                            : "text.secondary",
                      }}
                    >
                      {r.avg}%
                    </Typography>
                  </Stack>
                  <LinearProgress
                    variant="determinate"
                    value={r.avg}
                    color={
                      r.avg >= MASTERED_THRESHOLD
                        ? "success"
                        : r.avg >= IN_PROGRESS_THRESHOLD
                          ? "primary"
                          : "secondary"
                    }
                    sx={{ height: 6, borderRadius: 999 }}
                  />
                </Box>
              </motion.div>
            ))}
          </Stack>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// ─── Sub-empty: subjects exist but no topics on them yet ─────────────

function NoTopicsYet() {
  return (
    <motion.div {...enter}>
      <Card>
        <CardContent sx={{ p: 6, textAlign: "center" }}>
          <Box
            sx={{
              width: 56,
              height: 56,
              borderRadius: "50%",
              mx: "auto",
              mb: 2,
              display: "grid",
              placeItems: "center",
              bgcolor: (t) =>
                t.palette.mode === "dark"
                  ? "rgba(116, 181, 174, 0.12)"
                  : "rgba(15, 105, 99, 0.08)",
              color: "primary.main",
            }}
          >
            <RouteIcon />
          </Box>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
            Your subjects don't have topics tracked yet
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 420, mx: "auto", mb: 3 }}>
            Mastery is tracked as you log marks against SBA tasks. Add an assessment with a topic tag to seed your first landmark.
          </Typography>
          <Button
            component={Link}
            href="/dashboard/assessments/new"
            variant="contained"
            endIcon={<ArrowForwardIcon />}
          >
            Log an assessment
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
}
