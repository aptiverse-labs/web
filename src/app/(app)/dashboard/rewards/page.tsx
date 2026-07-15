"use client";

import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Grid from "@mui/material/Grid";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import LinearProgress from "@mui/material/LinearProgress";
import Divider from "@mui/material/Divider";
import Tooltip from "@mui/material/Tooltip";
import { alpha } from "@mui/material/styles";
import Link from "next/link";
import {
  Flag,
  Flame,
  Trophy,
  Award,
  HandCoins,
  Check,
  ClipboardCheck,
  CalendarCheck,
} from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { QueryStates } from "@/components/common/QueryStates";
import { AtmosphericBackdrop } from "@/components/common/AtmosphericBackdrop";
import { RelativeTime } from "@/components/common/RelativeTime";
import {
  useStudentPoints,
  usePointsLedger,
  useAchievements,
  useAllowances,
} from "@/lib/api/queries";
import type { StudentPoints, Achievement, Allowance } from "@/lib/mockData";
import { formatCurrency } from "@/lib/format";

export default function RewardsPage() {
  const pointsQuery = useStudentPoints();

  return (
    <AtmosphericBackdrop>
      <PageHeader
        title="Rewards"
        description="Everything here is counted from work you actually did. Points come from goals the system checked against your practice, your marks and your check-ins."
        breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Rewards" }]}
        actions={
          <Button
            component={Link}
            href="/dashboard/goals"
            variant="contained"
            color="secondary"
            startIcon={<Flag size={18} />}
          >
            Set a goal
          </Button>
        }
      />

      {/* Never empty: a student who has done nothing still gets a points object
          of zeros, and "Level 1, no points yet" is a truthful starting state
          worth rendering. An empty state here would just hide the ladder from
          the person who most needs to see it. */}
      <QueryStates
        query={pointsQuery}
        isEmpty={() => false}
        empty={{ title: "No points yet", description: "" }}
      >
        {(points) => (
          <Stack spacing={3}>
            <LevelCard points={points} />

            <Grid container spacing={3}>
              <Grid size={{ xs: 12, lg: 7 }}>
                <AchievementsCard />
              </Grid>
              <Grid size={{ xs: 12, lg: 5 }}>
                <Stack spacing={3}>
                  <AllowancesCard />
                  <LedgerCard />
                </Stack>
              </Grid>
            </Grid>
          </Stack>
        )}
      </QueryStates>
    </AtmosphericBackdrop>
  );
}

/**
 * Level, rank and the two streaks. The streaks sit here rather than on their
 * own card because they are the thing a student can move today, and a number
 * they can move belongs next to the number it moves.
 */
function LevelCard({ points }: { points: StudentPoints }) {
  const toNext = Math.max(0, points.pointsPerLevel - points.pointsIntoLevel);
  const pct = points.pointsPerLevel
    ? Math.round((points.pointsIntoLevel / points.pointsPerLevel) * 100)
    : 0;

  return (
    <Card
      sx={{
        bgcolor: (t) => alpha(t.palette.achievement.main, 0.1),
        borderColor: (t) => alpha(t.palette.achievement.main, 0.3),
      }}
    >
      <CardContent sx={{ p: { xs: 2.5, sm: 4 } }}>
        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={{ xs: 3, md: 4 }}
          alignItems={{ md: "center" }}
        >
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Typography variant="overline" color="text.secondary">
              Level {points.level}
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
              {points.rank}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {points.balance.toLocaleString()} points
              {points.totalEarned !== points.balance
                ? ` · ${points.totalEarned.toLocaleString()} earned all time`
                : ""}
            </Typography>

            <Box sx={{ mt: 2.5, maxWidth: 420 }}>
              <LinearProgress
                variant="determinate"
                value={pct}
                color="secondary"
                sx={{ height: 8, borderRadius: 999 }}
                aria-label={`${pct}% of the way to level ${points.level + 1}`}
              />
              <Typography variant="caption" color="text.secondary" sx={{ mt: 0.75, display: "block" }}>
                {toNext === 0
                  ? `Level ${points.level + 1} unlocked on your next verified goal.`
                  : `${toNext.toLocaleString()} points to level ${points.level + 1}.`}
              </Typography>
            </Box>
          </Box>

          <Divider
            orientation="vertical"
            flexItem
            sx={{ display: { xs: "none", md: "block" }, borderColor: (t) => alpha(t.palette.achievement.main, 0.25) }}
          />

          <Stack
            direction="row"
            spacing={{ xs: 2, sm: 4 }}
            sx={{ flexShrink: 0 }}
            divider={<Divider orientation="vertical" flexItem />}
          >
            <Counter
              icon={<Flame size={18} />}
              value={points.practiceStreakDays}
              label="Practice streak"
            />
            <Counter
              icon={<CalendarCheck size={18} />}
              value={points.checkinStreakDays}
              label="Check-in streak"
            />
            <Counter
              icon={<ClipboardCheck size={18} />}
              value={points.testsSubmitted}
              label="Tests done"
            />
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
}

function Counter({
  icon,
  value,
  label,
}: {
  icon: React.ReactNode;
  value: number;
  label: string;
}) {
  return (
    <Box sx={{ textAlign: "center", minWidth: 76 }}>
      <Box sx={{ color: "text.secondary", mb: 0.25, display: "flex", justifyContent: "center" }}>
        {icon}
      </Box>
      <Typography
        variant="h5"
        sx={{ fontWeight: 700, fontVariantNumeric: "tabular-nums", lineHeight: 1.1 }}
      >
        {value}
      </Typography>
      <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
        {label}
      </Typography>
    </Box>
  );
}

function AchievementsCard() {
  const query = useAchievements();

  return (
    <Card sx={{ height: "100%" }}>
      <CardContent sx={{ p: { xs: 2.5, sm: 3 } }}>
        <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2.5 }}>
          <Trophy size={20} />
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            Achievements
          </Typography>
        </Stack>

        <QueryStates
          query={query}
          empty={{
            icon: <Trophy />,
            title: "Nothing to show yet",
            description: "Achievements appear as you practise.",
          }}
        >
          {(achievements) => {
            const earned = achievements.filter((a) => a.earned);
            const inProgress = achievements.filter((a) => !a.earned);
            return (
              <Stack spacing={2.5}>
                {earned.length > 0 && (
                  <Stack spacing={1.5}>
                    {earned.map((a) => (
                      <AchievementRow key={a.code} achievement={a} />
                    ))}
                  </Stack>
                )}
                {earned.length > 0 && inProgress.length > 0 && <Divider />}
                {inProgress.length > 0 && (
                  <Stack spacing={1.5}>
                    {inProgress.map((a) => (
                      <AchievementRow key={a.code} achievement={a} />
                    ))}
                  </Stack>
                )}
              </Stack>
            );
          }}
        </QueryStates>
      </CardContent>
    </Card>
  );
}

function AchievementRow({ achievement: a }: { achievement: Achievement }) {
  const pct = a.target > 0 ? Math.round((a.progress / a.target) * 100) : 0;

  return (
    <Stack direction="row" spacing={2} alignItems="center">
      <Box
        sx={{
          width: 36,
          height: 36,
          flexShrink: 0,
          borderRadius: "50%",
          display: "grid",
          placeItems: "center",
          bgcolor: (t) =>
            a.earned ? alpha(t.palette.achievement.main, 0.18) : alpha(t.palette.text.primary, 0.06),
          color: (t) => (a.earned ? t.palette.achievement.dark : t.palette.text.disabled),
        }}
      >
        {a.earned ? <Check size={18} /> : <Award size={18} />}
      </Box>

      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography sx={{ fontWeight: 600 }} noWrap>
          {a.title}
        </Typography>
        <Typography variant="caption" color="text.secondary" noWrap sx={{ display: "block" }}>
          {a.description}
        </Typography>
        {!a.earned && (
          <LinearProgress
            variant="determinate"
            value={pct}
            sx={{ height: 4, borderRadius: 999, mt: 0.75, maxWidth: 220 }}
          />
        )}
      </Box>

      <Typography
        variant="caption"
        color={a.earned ? "text.secondary" : "text.disabled"}
        sx={{ flexShrink: 0, fontVariantNumeric: "tabular-nums" }}
      >
        {a.earned ? "Earned" : `${a.progress} / ${a.target}`}
      </Typography>
    </Stack>
  );
}

/**
 * Money a parent has promised against a goal. The status here is the honest
 * part: it only reaches "earned" when the goal verified against real evidence,
 * so there is nothing to argue about. Paid is the parent's word, because only
 * they know whether the cash actually changed hands.
 */
function AllowancesCard() {
  const query = useAllowances();

  return (
    <Card>
      <CardContent sx={{ p: { xs: 2.5, sm: 3 } }}>
        <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2 }}>
          <HandCoins size={20} />
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            Allowances
          </Typography>
        </Stack>

        <QueryStates
          query={query}
          empty={{
            icon: <HandCoins />,
            title: "No allowances pledged",
            description:
              "A parent linked to your account can promise an allowance against any goal you set.",
          }}
        >
          {(allowances) => (
            <Stack spacing={2} divider={<Divider />}>
              {allowances.map((a) => (
                <AllowanceRow key={a.id} allowance={a} />
              ))}
              <Typography variant="caption" color="text.secondary">
                Aptiverse records the promise and whether it was paid. The money moves between you
                and your parent, never through us.
              </Typography>
            </Stack>
          )}
        </QueryStates>
      </CardContent>
    </Card>
  );
}

function AllowanceRow({ allowance: a }: { allowance: Allowance }) {
  const tone =
    a.status === "paid"
      ? "success"
      : a.status === "earned"
      ? "achievement"
      : a.status === "cancelled"
      ? "default"
      : "primary";

  const statusLabel =
    a.status === "pledged"
      ? "Not yet earned"
      : a.status === "earned"
      ? "Earned, awaiting payment"
      : a.status === "paid"
      ? "Paid"
      : "Cancelled";

  return (
    <Stack spacing={1}>
      <Stack direction="row" spacing={1.5} alignItems="baseline" justifyContent="space-between">
        <Typography sx={{ fontWeight: 600, minWidth: 0 }} noWrap>
          {a.goalTitle}
        </Typography>
        <Typography
          sx={{ fontWeight: 700, flexShrink: 0, fontVariantNumeric: "tabular-nums" }}
          color={a.status === "cancelled" ? "text.disabled" : "text.primary"}
        >
          {formatCurrency(a.amountZar)}
        </Typography>
      </Stack>

      <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
        <Chip
          size="small"
          label={statusLabel}
          sx={
            tone === "default"
              ? undefined
              : {
                  bgcolor: (t) => alpha(t.palette[tone].main, 0.14),
                  color: (t) => t.palette[tone].dark,
                  fontWeight: 600,
                }
          }
        />
        <Typography variant="caption" color="text.secondary">
          from {a.sponsorName}
        </Typography>
        {a.paidAt && (
          <Typography variant="caption" color="text.secondary">
            · paid <RelativeTime iso={a.paidAt} />
          </Typography>
        )}
      </Stack>

      {a.status === "pledged" && (
        <Tooltip title={a.goalTarget}>
          <Box>
            <LinearProgress
              variant="determinate"
              value={a.goalProgress}
              sx={{ height: 4, borderRadius: 999 }}
            />
            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: "block" }}>
              {a.goalProgress}% of the way there
            </Typography>
          </Box>
        </Tooltip>
      )}

      {a.note && (
        <Typography variant="caption" color="text.secondary" sx={{ fontStyle: "italic" }}>
          {a.note}
        </Typography>
      )}
    </Stack>
  );
}

function LedgerCard() {
  const query = usePointsLedger();

  return (
    <Card>
      <CardContent sx={{ p: { xs: 2.5, sm: 3 } }}>
        <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
          Recent points
        </Typography>

        <QueryStates
          query={query}
          empty={{
            icon: <Trophy />,
            title: "No points yet",
            description: "Verify your first goal and it shows up here.",
          }}
        >
          {(entries) => (
            <Stack spacing={1.5}>
              {entries.slice(0, 8).map((e) => (
                <Stack
                  key={e.id}
                  direction="row"
                  spacing={2}
                  alignItems="center"
                  justifyContent="space-between"
                >
                  <Box sx={{ minWidth: 0 }}>
                    <Typography variant="body2" noWrap>
                      {e.description}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      <RelativeTime iso={e.date} />
                    </Typography>
                  </Box>
                  <Typography
                    sx={{
                      fontWeight: 700,
                      flexShrink: 0,
                      fontVariantNumeric: "tabular-nums",
                      color: e.points >= 0 ? "success.dark" : "text.secondary",
                    }}
                  >
                    {e.points >= 0 ? "+" : ""}
                    {e.points}
                  </Typography>
                </Stack>
              ))}
            </Stack>
          )}
        </QueryStates>
      </CardContent>
    </Card>
  );
}
