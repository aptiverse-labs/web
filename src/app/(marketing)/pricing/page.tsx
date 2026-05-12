"use client";

import { useState } from "react";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Grid from "@mui/material/Grid";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import Divider from "@mui/material/Divider";
import Tooltip from "@mui/material/Tooltip";
import IconButton from "@mui/material/IconButton";
import Accordion from "@mui/material/Accordion";
import AccordionSummary from "@mui/material/AccordionSummary";
import AccordionDetails from "@mui/material/AccordionDetails";
import CheckIcon from "@mui/icons-material/CheckCircleOutline";
import CloseIcon from "@mui/icons-material/Close";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesomeOutlined";
import SmsOutlinedIcon from "@mui/icons-material/SmsOutlined";
import Link from "next/link";
import { Section } from "@/components/common/Section";
import { GradientBackdrop } from "@/components/common/GradientBackdrop";

// Pricing is sized for the South African market and our AI cost basis.
// Claude Haiku ~R0.018 / Sonnet ~R0.18 per typical exchange; WhatsApp
// Business API ~R0.05–0.30 per conversation. Quotas below leave ~30–40%
// gross margin after API + hosting at small scale, with room to widen
// as volume grows.
type Plan = {
  code: "free" | "student" | "family" | "school";
  name: string;
  tagline: string;
  audience: string;
  monthly: number | null;     // null = custom
  annual?: number;            // typically monthly × 10 (≈17% saving)
  monthlyHint?: string;       // shown when monthly is null
  highlight?: boolean;
  comingSoon?: boolean;
  cta: { label: string; href: string };
  aiQuickPerMonth: number | "Unlimited";   // Claude Haiku exchanges
  aiDeepPerMonth: number | "Unlimited";    // Claude Sonnet exchanges
  whatsappPerMonth: number | "Unlimited";  // WhatsApp Business messages
  features: string[];
  notIncluded?: string[];
};

const PLANS: Plan[] = [
  {
    code: "free",
    name: "Free",
    tagline: "Genuinely useful — start here",
    audience: "Any FET student",
    monthly: 0,
    aiQuickPerMonth: 20,
    aiDeepPerMonth: 0,
    whatsappPerMonth: 0,
    cta: { label: "Create free account", href: "/register" },
    features: [
      "SBA tracking (up to 3 subjects)",
      "Basic goal tracking",
      "Daily diary & mood check-in",
      "Wellbeing break library",
      "Past papers — DBE archive links",
      "Bursaries — directory links",
      "Universities — apply links",
    ],
    notIncluded: [
      "Unlimited subjects + milestones",
      "AI tutor / past-paper walk-throughs",
      "Tutor marketplace",
      "WhatsApp assistant",
    ],
  },
  {
    code: "student",
    name: "Student",
    tagline: "The full AI toolkit",
    audience: "Individual student",
    monthly: 149,
    annual: 1490,
    highlight: true,
    aiQuickPerMonth: 200,
    aiDeepPerMonth: 30,
    whatsappPerMonth: 50,
    comingSoon: true,
    cta: { label: "Start 14-day trial", href: "/register?plan=student" },
    features: [
      "Unlimited subjects + goals + milestones",
      "AI quick-assists (Claude Haiku)",
      "AI deep tutor sessions (Claude Sonnet)",
      "Past papers with worked solutions",
      "Mastery predictions & forecasts",
      "Career & university navigator",
      "Bursary application checklist",
      "Tutor marketplace + booking",
      "Verified rewards programme",
      "WhatsApp assistant — log SBAs by text",
      "Email support, 1-day response",
    ],
  },
  {
    code: "family",
    name: "Family",
    tagline: "For parents & guardians",
    audience: "Up to 4 learners on one plan",
    monthly: 349,
    annual: 3490,
    aiQuickPerMonth: 500,
    aiDeepPerMonth: 80,
    whatsappPerMonth: 200,
    comingSoon: true,
    cta: { label: "Choose Family", href: "/register?plan=family" },
    features: [
      "Everything in Student × 4 learners",
      "Parent dashboard — calm, never invasive",
      "Realtime activity & celebration alerts",
      "Family wellbeing summary (anonymised)",
      "Shared family calendar",
      "1 free counselling session / quarter",
      "Parent WhatsApp assistant — receive nudges, send check-ins",
      "Priority support, 4-hour response",
    ],
  },
  {
    code: "school",
    name: "School",
    tagline: "Whole-school deployment",
    audience: "Schools & districts",
    monthly: null,
    monthlyHint: "from R59 / learner",
    aiQuickPerMonth: "Unlimited",
    aiDeepPerMonth: "Unlimited",
    whatsappPerMonth: "Unlimited",
    cta: { label: "Talk to sales", href: "/for-schools/contact" },
    features: [
      "Everything in Family for every learner",
      "Teacher gap-analysis & differentiator",
      "School admin analytics & readiness",
      "SSO & student-info-system integration",
      "Bursary partnership pipeline",
      "Dedicated school WhatsApp number",
      "Dedicated success manager",
      "Volume discount past 200 learners",
    ],
  },
];

const FAQ = [
  {
    q: "Are AI message limits hard?",
    a: "Yes — when you hit your monthly limit the AI politely declines further requests until your billing cycle resets. We've sized the quotas so the typical student or family won't hit them in normal use. If you do, you'll get a nudge to upgrade or wait. We won't silently bill you for overages.",
  },
  {
    q: "What's the difference between Quick and Deep AI?",
    a: "Quick (Claude Haiku) is for short answers, recall, formulas, definitions — fast and cheap. Deep (Claude Sonnet) is for long walk-throughs, marking essays, building study plans — slower but does serious work. Both end-to-end in the same chat — we pick the right model behind the scenes; you just see a 'quick' or 'deep' tag on each reply.",
  },
  {
    q: "How does the WhatsApp assistant work?",
    a: "We give you a WhatsApp number. Message it to log an SBA your teacher just announced, ask the AI tutor a quick question, or get a celebration when your child hits a goal. It's the full Aptiverse experience through chat — no app needed in the moment.",
  },
  {
    q: "Can my school sponsor my plan?",
    a: "Yes. Schools on our School plan can sponsor individual learners (often via bursary partners). If your school is on Aptiverse, ask your SchoolAdmin — they can enrol you at no cost to you.",
  },
  {
    q: "What's your refund policy?",
    a: "14-day no-questions refund on any monthly subscription. Annual plans are pro-rated. Cancel any time — we won't make you fight a chat-bot. (We use a real human or a clearly-labelled AI.)",
  },
  {
    q: "Why aren't you on Stripe?",
    a: "We use Paystack — South African payment processor, supports EFT, instant EFT, and all the cards Stripe takes. Local fees are roughly half what Stripe charges, which is why our prices can stay lower.",
  },
  {
    q: "Is my data safe?",
    a: "POPIA-compliant. Data resides in af-south-1 (Cape Town). Your diary is end-to-end encrypted by default — even Aptiverse staff can't read it. We never sell data; bursary funders only see what you explicitly opt to share.",
  },
];

export default function PricingPage() {
  const [billing, setBilling] = useState<"monthly" | "annual">("monthly");

  return (
    <>
      <GradientBackdrop variant="soft">
        <Box sx={{ maxWidth: 1240, mx: "auto", px: { xs: 2.5, sm: 4, lg: 6 }, py: { xs: 8, md: 12 } }}>
          <Stack spacing={2.5} sx={{ textAlign: "center", maxWidth: 760, mx: "auto" }}>
            <Typography variant="overline" color="primary.main">
              Pricing
            </Typography>
            <Typography variant="h1" component="h1">
              Real tools. Honest pricing.
            </Typography>
            <Typography variant="h6" color="text.secondary" sx={{ fontWeight: 400 }}>
              We use Claude (Anthropic's leading AI) under the hood. That costs us
              real money per message — so plans include monthly quotas, never silent
              overages. You'll always know what you're using and when to upgrade.
            </Typography>

            <Stack direction="row" justifyContent="center" sx={{ pt: 1 }}>
              <ToggleButtonGroup
                value={billing}
                exclusive
                onChange={(_, v) => v && setBilling(v)}
                size="small"
              >
                <ToggleButton value="monthly" sx={{ px: 3 }}>
                  Monthly
                </ToggleButton>
                <ToggleButton value="annual" sx={{ px: 3 }}>
                  Annual <Chip label="−17%" size="small" color="primary" sx={{ ml: 1, height: 18 }} />
                </ToggleButton>
              </ToggleButtonGroup>
            </Stack>
          </Stack>
        </Box>
      </GradientBackdrop>

      <Section py={6}>
        <Grid container spacing={3} alignItems="stretch">
          {PLANS.map((p) => (
            <Grid key={p.code} size={{ xs: 12, sm: 6, md: 3 }}>
              <PlanCard plan={p} billing={billing} />
            </Grid>
          ))}
        </Grid>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={1.5}
          justifyContent="center"
          alignItems="center"
          sx={{ mt: 4 }}
          flexWrap="wrap"
          useFlexGap
        >
          <Chip icon={<AutoAwesomeIcon />} label="AI by Claude (Anthropic)" variant="outlined" size="small" />
          <Chip icon={<SmsOutlinedIcon />} label="WhatsApp Business API" variant="outlined" size="small" />
          <Chip label="Payments by Paystack — EFT + cards" variant="outlined" size="small" />
          <Chip label="POPIA compliant · ZA data residency" variant="outlined" size="small" />
        </Stack>
        <Typography variant="caption" color="text.secondary" sx={{ display: "block", textAlign: "center", mt: 2 }}>
          All prices in ZAR, incl. VAT. Cancel any time. Bursary partners can sponsor seats — talk to your school's admin.
        </Typography>
      </Section>

      <Section bg="paper" py={6}>
        <Box sx={{ maxWidth: 960, mx: "auto" }}>
          <Stack spacing={1.5} sx={{ textAlign: "center", mb: 4 }}>
            <Typography variant="overline" color="primary.main">
              Compare
            </Typography>
            <Typography variant="h3" component="h2" sx={{ fontWeight: 700 }}>
              What's in each plan
            </Typography>
          </Stack>
          <ComparisonTable />
        </Box>
      </Section>

      <Section py={6}>
        <Box sx={{ maxWidth: 800, mx: "auto" }}>
          <Stack spacing={1.5} sx={{ textAlign: "center", mb: 4 }}>
            <Typography variant="overline" color="primary.main">
              FAQ
            </Typography>
            <Typography variant="h3" component="h2" sx={{ fontWeight: 700 }}>
              The questions everyone asks
            </Typography>
          </Stack>
          <Stack spacing={1}>
            {FAQ.map((f) => (
              <Accordion key={f.q} disableGutters elevation={0} sx={{ border: 1, borderColor: "divider", borderRadius: 1, "&:before": { display: "none" } }}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography sx={{ fontWeight: 600 }}>{f.q}</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Typography variant="body2" color="text.secondary">
                    {f.a}
                  </Typography>
                </AccordionDetails>
              </Accordion>
            ))}
          </Stack>
        </Box>
      </Section>

      <Section bg="paper" eyebrow="Bursary partnerships" title="A pipeline that finds the talent" subtitle="If you fund students, we surface verified progress and university readiness — making allocations more accurate and impactful.">
        <Stack direction="row" justifyContent="center">
          <Button component={Link} href="/for-schools/contact" variant="contained" size="large">
            Partner with us
          </Button>
        </Stack>
      </Section>
    </>
  );
}

function PlanCard({ plan, billing }: { plan: Plan; billing: "monthly" | "annual" }) {
  const isFree = plan.monthly === 0;
  const isCustom = plan.monthly === null;

  return (
    <Card
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        position: "relative",
        ...(plan.highlight && {
          borderColor: "primary.main",
          borderWidth: 1.5,
          borderStyle: "solid",
          boxShadow: (t) =>
            t.palette.mode === "dark"
              ? "0 0 0 1px rgba(63,157,149,0.5)"
              : "0 12px 40px -12px rgba(15,105,99,0.30)",
        }),
      }}
    >
      <CardContent sx={{ p: 3, flex: 1, display: "flex", flexDirection: "column" }}>
        {plan.highlight && (
          <Chip
            label="Most popular"
            color="primary"
            size="small"
            sx={{ alignSelf: "flex-start", mb: 1.5, fontWeight: 600 }}
          />
        )}
        <Typography variant="h5" sx={{ fontWeight: 700 }}>
          {plan.name}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5, minHeight: 36 }}>
          {plan.tagline}
        </Typography>

        <Box sx={{ mb: 2.5 }}>
          {isCustom ? (
            <Stack direction="row" alignItems="baseline" spacing={1}>
              <Typography variant="h3" sx={{ fontWeight: 700 }}>
                Custom
              </Typography>
            </Stack>
          ) : isFree ? (
            <Stack direction="row" alignItems="baseline" spacing={1}>
              <Typography variant="h3" sx={{ fontWeight: 700 }}>
                R0
              </Typography>
              <Typography variant="body2" color="text.secondary">
                forever
              </Typography>
            </Stack>
          ) : billing === "annual" && plan.annual ? (
            <>
              <Stack direction="row" alignItems="baseline" spacing={1}>
                <Typography variant="h3" sx={{ fontWeight: 700 }}>
                  R{Math.round(plan.annual / 12)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  / month
                </Typography>
              </Stack>
              <Typography variant="caption" color="text.secondary">
                R{plan.annual} billed annually
              </Typography>
            </>
          ) : (
            <Stack direction="row" alignItems="baseline" spacing={1}>
              <Typography variant="h3" sx={{ fontWeight: 700 }}>
                R{plan.monthly}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                / month
              </Typography>
            </Stack>
          )}
          <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.5 }}>
            {plan.monthlyHint ?? plan.audience}
          </Typography>
        </Box>

        {!isFree && !isCustom && (
          <Box sx={{ p: 1.5, bgcolor: "action.hover", borderRadius: 1, mb: 2 }}>
            <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 0.5, fontWeight: 600 }}>
              MONTHLY ALLOWANCE
            </Typography>
            <Quota label="Quick AI replies" value={plan.aiQuickPerMonth} />
            <Quota label="Deep AI sessions" value={plan.aiDeepPerMonth} />
            <Quota label="WhatsApp messages" value={plan.whatsappPerMonth} />
          </Box>
        )}
        {isFree && (
          <Box sx={{ p: 1.5, bgcolor: "action.hover", borderRadius: 1, mb: 2 }}>
            <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 0.5, fontWeight: 600 }}>
              MONTHLY ALLOWANCE
            </Typography>
            <Quota label="Quick AI replies" value={20} />
            <Quota label="Deep AI sessions" value={0} muted />
            <Quota label="WhatsApp messages" value={0} muted />
          </Box>
        )}
        {isCustom && (
          <Box sx={{ p: 1.5, bgcolor: "action.hover", borderRadius: 1, mb: 2 }}>
            <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 0.5, fontWeight: 600 }}>
              FAIR-USE AT SCHOOL SCALE
            </Typography>
            <Typography variant="body2">Unmetered AI within fair use</Typography>
            <Typography variant="body2">Dedicated WhatsApp number</Typography>
          </Box>
        )}

        <Stack spacing={1} sx={{ mb: 3, flex: 1 }}>
          {plan.features.map((f) => (
            <Stack key={f} direction="row" spacing={1} alignItems="flex-start">
              <CheckIcon sx={{ color: "primary.main", fontSize: 18, mt: 0.25, flexShrink: 0 }} />
              <Typography variant="body2">{f}</Typography>
            </Stack>
          ))}
          {plan.notIncluded?.map((f) => (
            <Stack key={f} direction="row" spacing={1} alignItems="flex-start" sx={{ opacity: 0.45 }}>
              <CloseIcon sx={{ fontSize: 18, mt: 0.25, flexShrink: 0 }} />
              <Typography variant="body2" sx={{ textDecoration: "line-through" }}>
                {f}
              </Typography>
            </Stack>
          ))}
        </Stack>

        {plan.comingSoon ? (
          <Stack spacing={1}>
            <Button variant={plan.highlight ? "contained" : "outlined"} fullWidth disabled>
              Coming soon
            </Button>
            <Typography variant="caption" color="text.secondary" sx={{ textAlign: "center" }}>
              Available once Paystack billing is live
            </Typography>
          </Stack>
        ) : (
          <Button component={Link} href={plan.cta.href} variant={plan.highlight ? "contained" : "outlined"} fullWidth size="large">
            {plan.cta.label}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

function Quota({ label, value, muted }: { label: string; value: number | "Unlimited"; muted?: boolean }) {
  return (
    <Stack direction="row" justifyContent="space-between" sx={{ opacity: muted ? 0.5 : 1, py: 0.25 }}>
      <Typography variant="body2" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="body2" sx={{ fontWeight: 600 }}>
        {value === "Unlimited" ? "∞" : value === 0 ? "—" : value.toLocaleString()}
      </Typography>
    </Stack>
  );
}

type Row = { label: string; tip?: string; free: React.ReactNode; student: React.ReactNode; family: React.ReactNode; school: React.ReactNode };

const COMPARE_ROWS: Row[] = [
  { label: "Subjects tracked", free: "Up to 3", student: "Unlimited", family: "Unlimited × 4", school: "Unlimited" },
  { label: "Goals + milestones", free: "Basic", student: "Unlimited", family: "Unlimited × 4", school: "Unlimited" },
  { label: "Daily diary & wellbeing", free: <Yes />, student: <Yes />, family: <Yes />, school: <Yes /> },
  { label: "Quick AI replies / month", tip: "Short answers, recall, formulas — Claude Haiku.", free: "20", student: "200", family: "500", school: "Unlimited" },
  { label: "Deep AI sessions / month", tip: "Long walk-throughs, essay marking, study plans — Claude Sonnet.", free: "—", student: "30", family: "80", school: "Unlimited" },
  { label: "WhatsApp assistant", tip: "Message a WhatsApp number to log SBAs, get nudges, ask the AI tutor without opening the app.", free: "—", student: "50 msgs/mo", family: "200 msgs/mo", school: "Dedicated number" },
  { label: "Past papers — DBE links", free: <Yes />, student: <Yes />, family: <Yes />, school: <Yes /> },
  { label: "Past papers — worked solutions", free: <No />, student: <Yes />, family: <Yes />, school: <Yes /> },
  { label: "Mastery predictions & forecasts", free: <No />, student: <Yes />, family: <Yes />, school: <Yes /> },
  { label: "Career & university navigator", free: <No />, student: <Yes />, family: <Yes />, school: <Yes /> },
  { label: "Tutor marketplace + booking", free: <No />, student: <Yes />, family: <Yes />, school: <Yes /> },
  { label: "Parent dashboard", free: <No />, student: <No />, family: <Yes />, school: <Yes /> },
  { label: "Counselling sessions", free: <No />, student: <No />, family: "1 / quarter", school: "Included" },
  { label: "Teacher gap-analysis + differentiator", free: <No />, student: <No />, family: <No />, school: <Yes /> },
  { label: "School admin analytics & readiness", free: <No />, student: <No />, family: <No />, school: <Yes /> },
  { label: "SSO & SIS integration", free: <No />, student: <No />, family: <No />, school: <Yes /> },
  { label: "Support", free: "Community", student: "Email · 1 day", family: "Email · 4 hours", school: "Success manager" },
];

function ComparisonTable() {
  return (
    <Card variant="outlined">
      <Box sx={{ overflowX: "auto" }}>
        <Box component="table" sx={{ width: "100%", borderCollapse: "collapse", minWidth: 700 }}>
          <Box component="thead" sx={{ bgcolor: "action.hover" }}>
            <Box component="tr">
              <Box component="th" sx={{ p: 2, textAlign: "left", fontWeight: 600, width: "30%" }}>Feature</Box>
              <Box component="th" sx={{ p: 2, textAlign: "center", fontWeight: 600 }}>Free</Box>
              <Box component="th" sx={{ p: 2, textAlign: "center", fontWeight: 600, color: "primary.main" }}>Student</Box>
              <Box component="th" sx={{ p: 2, textAlign: "center", fontWeight: 600 }}>Family</Box>
              <Box component="th" sx={{ p: 2, textAlign: "center", fontWeight: 600 }}>School</Box>
            </Box>
          </Box>
          <Box component="tbody">
            {COMPARE_ROWS.map((r, i) => (
              <Box
                component="tr"
                key={r.label}
                sx={{ "&:not(:last-of-type)": { borderBottom: 1, borderColor: "divider" }, "&:hover": { bgcolor: "action.hover" } }}
              >
                <Box component="td" sx={{ p: 2 }}>
                  <Stack direction="row" spacing={0.5} alignItems="center">
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {r.label}
                    </Typography>
                    {r.tip && (
                      <Tooltip title={r.tip} arrow placement="right">
                        <IconButton size="small" sx={{ p: 0.25 }}>
                          <InfoOutlinedIcon sx={{ fontSize: 14, color: "text.disabled" }} />
                        </IconButton>
                      </Tooltip>
                    )}
                  </Stack>
                </Box>
                <Box component="td" sx={{ p: 2, textAlign: "center" }}>{r.free}</Box>
                <Box component="td" sx={{ p: 2, textAlign: "center", bgcolor: i % 2 === 0 ? "action.hover" : undefined }}>{r.student}</Box>
                <Box component="td" sx={{ p: 2, textAlign: "center" }}>{r.family}</Box>
                <Box component="td" sx={{ p: 2, textAlign: "center" }}>{r.school}</Box>
              </Box>
            ))}
          </Box>
        </Box>
      </Box>
    </Card>
  );
}

function Yes() {
  return <CheckIcon sx={{ color: "primary.main", fontSize: 20 }} />;
}
function No() {
  return <CloseIcon sx={{ color: "text.disabled", fontSize: 20 }} />;
}
