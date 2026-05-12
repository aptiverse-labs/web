"use client";

import { useMemo } from "react";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Grid from "@mui/material/Grid";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Box from "@mui/material/Box";
import LinearProgress from "@mui/material/LinearProgress";
import Divider from "@mui/material/Divider";
import Link from "next/link";
import CreditCardIcon from "@mui/icons-material/CreditCardOutlined";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import { PageHeader } from "@/components/common/PageHeader";
import { DataList } from "@/components/data/DataList";
import { formatCurrency, formatDate } from "@/lib/format";
import { usePlanCode } from "@/lib/hooks/useFeature";
import { useUsage } from "@/lib/hooks/useUsage";
import { PLAN_LABELS, type PlanCode } from "@/lib/features";
import dayjs from "dayjs";

// Catalog mirror of api/Modules/Entitlements/.../EntitlementsCatalogSeeder.cs
// for student-track plans. Quotas + price stay in sync with the seeder by
// hand for now — when the entitlements API exposes the catalog this page
// should fetch it instead of hard-coding.
const STUDENT_CATALOG: Record<PlanCode, {
  price: number | null;
  description: string;
  quotas: { aiQuick: number; aiDeep: number; whatsapp: number };
}> = {
  "free":          { price: 0,    description: "Genuinely useful — start here.",                                  quotas: { aiQuick: 15,   aiDeep: 0,   whatsapp: 0 } },
  "student":       { price: 79,   description: "Unlimited subjects, basic AI practice, daily diary.",             quotas: { aiQuick: 60,   aiDeep: 5,   whatsapp: 10 } },
  "student.pro":   { price: 149,  description: "The AI moat — curriculum-aware tutor, SBA coach, adaptive.",      quotas: { aiQuick: 300,  aiDeep: 30,  whatsapp: 50 } },
  "student.max":   { price: 299,  description: "For exam finalists — simulator, debrief, audio, study plan.",     quotas: { aiQuick: 1200, aiDeep: 100, whatsapp: 200 } },
  // Family / tutor / school plans don't manage their billing from this
  // page (parents have /parent/billing; tutors have /tutor/earnings;
  // schools are billed by sales). Stub entries so PlanCode is exhaustive.
  "family":        { price: 199,  description: "Up to 2 learners on one bill — managed by parent.",               quotas: { aiQuick: 200,  aiDeep: 15,  whatsapp: 40 } },
  "family.pro":    { price: 349,  description: "Up to 4 learners — managed by parent.",                           quotas: { aiQuick: 800,  aiDeep: 80,  whatsapp: 200 } },
  "family.max":    { price: 649,  description: "Up to 6 learners — managed by parent.",                           quotas: { aiQuick: 2400, aiDeep: 200, whatsapp: 500 } },
  "tutor.free":    { price: 0,    description: "Tutor on commission — see /tutor/earnings.",                      quotas: { aiQuick: 15,   aiDeep: 0,   whatsapp: 10 } },
  "tutor.pro":     { price: 149,  description: "Tutor on Pro tier — see /tutor/earnings.",                        quotas: { aiQuick: 300,  aiDeep: 20,  whatsapp: 100 } },
  "tutor.max":     { price: 349,  description: "Tutor on Max tier — see /tutor/earnings.",                        quotas: { aiQuick: 1500, aiDeep: 80,  whatsapp: 500 } },
  "school":        { price: null, description: "Sponsored by your school — no learner billing.",                  quotas: { aiQuick: -1,   aiDeep: -1,  whatsapp: -1 } },
};

const INVOICES = Array.from({ length: 6 }).map((_, i) => ({
  id: `inv-${1000 + i}`,
  date: dayjs().subtract(i, "month").toISOString(),
  amount: 149,
  status: "paid" as const,
}));

export default function BillingPage() {
  const planCode = usePlanCode();
  const plan = STUDENT_CATALOG[planCode];
  const planName = PLAN_LABELS[planCode];
  const usage = useUsage();
  const nextCharge = dayjs().add(14, "day").toISOString();
  const isFree = plan.price === 0;
  const isSchoolSponsored = planCode === "school";
  const isParentManaged = planCode.startsWith("family");
  const isTutor = planCode.startsWith("tutor");

  // Tomorrow's price if they upgraded one step.
  const upgradeTarget = useMemo<{ code: PlanCode; label: string; delta: number } | null>(() => {
    if (planCode === "free") return { code: "student", label: "Student", delta: 79 };
    if (planCode === "student") return { code: "student.pro", label: "Student Pro", delta: 70 };
    if (planCode === "student.pro") return { code: "student.max", label: "Student Max", delta: 150 };
    return null;
  }, [planCode]);

  return (
    <>
      <PageHeader
        title="Billing"
        description="Your plan, monthly allowance, payment method and invoices."
        breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Billing" }]}
      />

      {/* Different page layouts based on who pays for this student. */}
      {isSchoolSponsored && (
        <Card sx={{ mb: 3, bgcolor: "primary.main", color: "primary.contrastText" }}>
          <CardContent sx={{ p: 3 }}>
            <Stack direction="row" spacing={2} alignItems="center">
              <Box>
                <Typography variant="overline" sx={{ opacity: 0.85 }}>
                  Sponsored by your school
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  No payment needed — your school covers everything.
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.9, mt: 0.5 }}>
                  If you leave the school, your plan reverts to Free. Talk to your school admin to enable a personal plan instead.
                </Typography>
              </Box>
            </Stack>
          </CardContent>
        </Card>
      )}

      {isParentManaged && (
        <Card sx={{ mb: 3 }}>
          <CardContent sx={{ p: 3 }}>
            <Typography variant="overline" color="text.secondary">
              Family plan
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>
              Your plan is managed by your parent or guardian.
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Changes to payment method, plan tier and invoices live on your parent&apos;s account. You can still see your own monthly AI usage below.
            </Typography>
          </CardContent>
        </Card>
      )}

      {isTutor && (
        <Card sx={{ mb: 3 }}>
          <CardContent sx={{ p: 3 }}>
            <Typography variant="overline" color="text.secondary">
              Tutor account
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
              Your billing lives on the Earnings page.
            </Typography>
            <Button component={Link} href="/tutor/earnings" variant="contained" endIcon={<OpenInNewIcon />}>
              Go to Earnings
            </Button>
          </CardContent>
        </Card>
      )}

      <Grid container spacing={3}>
        {/* ============================================
            Current plan card
        ============================================ */}
        <Grid size={{ xs: 12, md: 5 }}>
          <Card sx={{ height: "100%" }}>
            <CardContent sx={{ p: 3 }}>
              <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 2 }}>
                <Box>
                  <Chip
                    label={planName}
                    color={isFree ? "default" : "primary"}
                    size="small"
                    sx={{ mb: 1, fontWeight: 600 }}
                  />
                  <Stack direction="row" alignItems="baseline" spacing={1}>
                    <Typography variant="h3" sx={{ fontWeight: 700 }}>
                      {isFree ? "R0" : isSchoolSponsored ? "Sponsored" : formatCurrency(plan.price ?? 0)}
                    </Typography>
                    {!isFree && !isSchoolSponsored && (
                      <Typography variant="body2" color="text.secondary">
                        / month
                      </Typography>
                    )}
                  </Stack>
                </Box>
              </Stack>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
                {plan.description}
              </Typography>

              {!isFree && !isSchoolSponsored && !isParentManaged && !isTutor && (
                <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 2 }}>
                  Next charge {formatDate(nextCharge)}
                </Typography>
              )}

              {!isParentManaged && !isTutor && !isSchoolSponsored && (
                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                  {upgradeTarget && (
                    <Button variant="contained" disabled>
                      Upgrade to {upgradeTarget.label} (+{formatCurrency(upgradeTarget.delta)})
                    </Button>
                  )}
                  <Button component={Link} href="/pricing" variant="outlined">
                    Compare plans
                  </Button>
                </Stack>
              )}
              {!isFree && !isParentManaged && !isTutor && !isSchoolSponsored && (
                <>
                  <Divider sx={{ my: 2.5 }} />
                  <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1 }}>
                    Cancel any time. Annual plans are pro-rated.
                  </Typography>
                  <Button variant="text" color="error" size="small" disabled>
                    Cancel subscription
                  </Button>
                </>
              )}
              {isFree && (
                <Typography variant="caption" color="text.secondary">
                  Paid plans become available once paid billing is live. We&apos;ll email you when it is.
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* ============================================
            This month's allowance / usage
        ============================================ */}
        <Grid size={{ xs: 12, md: 7 }}>
          <Card sx={{ height: "100%" }}>
            <CardContent sx={{ p: 3 }}>
              <Stack direction="row" justifyContent="space-between" alignItems="baseline" sx={{ mb: 2.5 }}>
                <Box>
                  <Typography variant="overline" color="text.secondary">
                    This month
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>
                    Monthly AI allowance
                  </Typography>
                </Box>
                <Typography variant="caption" color="text.secondary">
                  Resets {formatDate(dayjs().endOf("month").toISOString())}
                </Typography>
              </Stack>

              <Stack spacing={2.25}>
                <QuotaBar
                  label="Quick AI replies"
                  used={usage.data?.aiQuick.used ?? 0}
                  total={usage.data?.aiQuick.limit ?? plan.quotas.aiQuick}
                  loading={usage.isLoading}
                  hint="Short answers, recall, formulas, help-bot queries."
                />
                <QuotaBar
                  label="Deep AI sessions"
                  used={usage.data?.aiDeep.used ?? 0}
                  total={usage.data?.aiDeep.limit ?? plan.quotas.aiDeep}
                  loading={usage.isLoading}
                  hint="Long walk-throughs, essay marking, weekly debrief."
                />
                <QuotaBar
                  label="WhatsApp messages"
                  used={usage.data?.whatsapp.used ?? 0}
                  total={usage.data?.whatsapp.limit ?? plan.quotas.whatsapp}
                  loading={usage.isLoading}
                  hint="Outbound messages from the WhatsApp tutor."
                />
              </Stack>

              {upgradeTarget && (
                <Box
                  sx={{
                    mt: 3,
                    p: 1.75,
                    borderRadius: 1.5,
                    bgcolor: "action.hover",
                    border: 1,
                    borderColor: "divider",
                  }}
                >
                  <Stack direction="row" spacing={1.5} alignItems="center" justifyContent="space-between" flexWrap="wrap" useFlexGap>
                    <Typography variant="body2" color="text.secondary">
                      Hit a limit?{" "}
                      <strong>{upgradeTarget.label}</strong> bumps your allowance significantly.
                    </Typography>
                    <Button component={Link} href="/pricing" size="small" variant="outlined">
                      See what changes
                    </Button>
                  </Stack>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* ============================================
            Payment method
        ============================================ */}
        {!isFree && !isParentManaged && !isTutor && !isSchoolSponsored && (
          <Grid size={{ xs: 12, md: 5 }}>
            <Card>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="overline" color="text.secondary">
                  Payment method
                </Typography>
                <Stack direction="row" spacing={2} alignItems="center" sx={{ mt: 1.5, mb: 2 }}>
                  <Box
                    sx={{
                      width: 48,
                      height: 32,
                      borderRadius: 1,
                      bgcolor: "action.hover",
                      display: "grid",
                      placeItems: "center",
                    }}
                  >
                    <CreditCardIcon sx={{ color: "text.secondary" }} />
                  </Box>
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      Visa ending 4242
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Expires 09/28
                    </Typography>
                  </Box>
                </Stack>
                <Stack direction="row" spacing={1}>
                  <Button variant="outlined" size="small" disabled>
                    Update card
                  </Button>
                  <Button variant="text" size="small" disabled>
                    Add bank (EFT)
                  </Button>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* ============================================
            Invoices
        ============================================ */}
        {!isFree && !isParentManaged && !isTutor && !isSchoolSponsored && (
          <Grid size={{ xs: 12, md: 7 }}>
            <DataList
              title="Invoices"
              rows={INVOICES}
              rowKey={(r) => r.id}
              columns={[
                { key: "id", header: "Invoice" },
                { key: "date", header: "Date", render: (r) => formatDate(r.date) },
                { key: "amount", header: "Amount", align: "right", render: (r) => formatCurrency(r.amount) },
                { key: "status", header: "Status", render: () => <Chip label="Paid" size="small" color="success" /> },
              ]}
              rowActions={() => (
                <Button size="small" variant="outlined" disabled>
                  Download
                </Button>
              )}
              pageSize={5}
              searchable={false}
            />
          </Grid>
        )}
      </Grid>
    </>
  );
}

// ============================================================
// QuotaBar — usage progress bar with smart colour cues.
// ============================================================
function QuotaBar({
  label,
  used,
  total,
  hint,
  loading,
}: {
  label: string;
  used: number;
  total: number;
  hint: string;
  loading?: boolean;
}) {
  const isUnlimited = total < 0;
  const isZero = total === 0;
  const pct = isUnlimited || isZero ? 0 : Math.min(100, Math.round((used / total) * 100));
  const color = pct >= 95 ? "error" : pct >= 75 ? "warning" : "primary";

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="baseline" sx={{ mb: 0.5 }}>
        <Typography variant="body2" sx={{ fontWeight: 600 }}>
          {label}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {loading
            ? "Loading…"
            : isUnlimited
              ? `${used.toLocaleString()} used · unlimited`
              : isZero
                ? "Not included on this plan"
                : `${used.toLocaleString()} / ${total.toLocaleString()}`}
        </Typography>
      </Stack>
      <LinearProgress
        variant={loading ? "indeterminate" : "determinate"}
        value={isUnlimited ? 35 : pct}
        color={isUnlimited ? "primary" : color}
        sx={{
          height: 8,
          borderRadius: 4,
          bgcolor: "action.hover",
          opacity: isZero ? 0.4 : 1,
          "& .MuiLinearProgress-bar": { borderRadius: 4 },
        }}
      />
      <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.5 }}>
        {hint}
      </Typography>
    </Box>
  );
}
