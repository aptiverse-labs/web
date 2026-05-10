"use client";

import { use } from "react";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Grid from "@mui/material/Grid";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import LinearProgress from "@mui/material/LinearProgress";
import Chip from "@mui/material/Chip";
import AssignmentIcon from "@mui/icons-material/AssignmentOutlined";
import { PageHeader } from "@/components/common/PageHeader";
import { StatCard } from "@/components/common/StatCard";
import { StatusChip } from "@/components/common/StatusChip";
import { QueryStates } from "@/components/common/QueryStates";
import { useAssessment, useSubjects } from "@/lib/api/queries";
import type { Assessment, Subject } from "@/lib/mockData";
import { formatDate } from "@/lib/format";
import Link from "next/link";

export default function AssessmentDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const assessmentQuery = useAssessment(id);
  const subjectsQuery = useSubjects();

  const subject = (subjectsQuery.data ?? []).find((s) => s.id === assessmentQuery.data?.subjectId);

  return (
    <>
      <PageHeader
        title={assessmentQuery.data?.title ?? "Assessment"}
        description={
          assessmentQuery.data
            ? `${subject?.name ?? ""} · ${assessmentQuery.data.type} · weighting ${assessmentQuery.data.weight}%`
            : undefined
        }
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Assessments", href: "/dashboard/assessments" },
          { label: assessmentQuery.data?.title ?? "Assessment" },
        ]}
        actions={
          <>
            <Button variant="outlined">Generate practice</Button>
            <Button component={Link} href="/dashboard/workspace" variant="contained">
              Open in workspace
            </Button>
          </>
        }
        meta={
          assessmentQuery.data ? (
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              <StatusChip
                kind={
                  assessmentQuery.data.status === "graded"
                    ? "success"
                    : assessmentQuery.data.status === "in_progress"
                    ? "info"
                    : assessmentQuery.data.status === "submitted"
                    ? "primary"
                    : "neutral"
                }
                label={assessmentQuery.data.status.replace("_", " ")}
                sx={{ textTransform: "capitalize" }}
              />
              <Chip label={`Due ${formatDate(assessmentQuery.data.dueDate)}`} size="small" variant="outlined" />
            </Stack>
          ) : null
        }
      />

      <QueryStates
        query={assessmentQuery}
        isEmpty={() => false}
        empty={{
          icon: <AssignmentIcon />,
          title: "Assessment not found",
          description: "This SBA doesn't exist or has been removed.",
          action: (
            <Button variant="outlined" href="/dashboard/assessments">
              All assessments
            </Button>
          ),
        }}
      >
        {(a) => <AssessmentBody assessment={a} />}
      </QueryStates>
    </>
  );
}

function AssessmentBody({ assessment: a }: { assessment: Assessment }) {
  const daysLeft = Math.max(0, Math.ceil((+new Date(a.dueDate) - Date.now()) / 86400000));

  return (
    <>
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard label="Predicted" value={a.predictedMark != null ? `${a.predictedMark}%` : "—"} hint="AI estimate" color="primary" />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard label="Weight" value={`${a.weight}%`} hint="of term grade" color="info" />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard label="Days left" value={daysLeft} color="warning" />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard label="Readiness" value="70%" hint="based on practice" color="success" />
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, lg: 7 }}>
          <Card>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Tasks
              </Typography>
              <Stack spacing={1.5}>
                {(a.tasks ?? ["Read brief", "Outline answer", "Practice 10 past-paper questions", "Self-review against rubric"]).map((t, i) => (
                  <Box key={i} sx={{ p: 2, borderRadius: 1.5, border: 1, borderColor: "divider" }}>
                    <Stack direction="row" justifyContent="space-between">
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {t}
                      </Typography>
                      <Button size="small">Mark done</Button>
                    </Stack>
                  </Box>
                ))}
              </Stack>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, lg: 5 }}>
          <Card>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ mb: 1 }}>
                Rubric
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {a.rubric ? "Used to mark this assessment" : "No rubric attached"}
              </Typography>
              {a.rubric ? (
                <Stack spacing={2}>
                  {a.rubric.map((r) => (
                    <Box key={r.criterion}>
                      <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {r.criterion}
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {r.weight}%
                        </Typography>
                      </Stack>
                      <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 0.5 }}>
                        {r.description}
                      </Typography>
                      <LinearProgress variant="determinate" value={r.weight} color="primary" />
                    </Box>
                  ))}
                </Stack>
              ) : null}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </>
  );
}
