"use client";

import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { alpha, useTheme } from "@mui/material/styles";
import {
  ArrowDownRight,
  ArrowUpRight,
  CheckCircle2,
  Clock,
  Minus,
  Sparkles,
  User,
} from "lucide-react";
import {
  AdChip,
  AdCta,
  AdEyebrow,
  AdPanel,
  Artboard,
  CitronBlock,
  Wordmark,
  adSurfaces,
  CITRON,
  GRAPHITE,
  type AdScheme,
} from "./adkit";
import { AERO_COURSES, CHART_UP, CHART_DOWN } from "./charts";

// =====================================================================
// THREE-SCREEN UNIT. The features page, compressed into one image.
//
// THE COMPOSITION, and why it is this one.
//
// The first attempt at this brief was three windows stacked down the page
// with a caption over each. That is an inventory, not a layout: three
// identical bands, the eye reads straight down, and nothing anywhere says
// which of the three matters. The founder called it correctly.
//
// This is the alternating editorial rhythm the site already uses, in
// components/marketing/FeatureShowcase.tsx: a copy column and a screen
// column, sides swapping every row, vertically centred against each other.
// Copy left / screen right, then screen left / copy right, then copy left /
// screen right. The reader's eye travels left, right, left, and the zigzag
// is what carries them down a static image with no scroll to do it for
// them.
//
// Four things keep it from flattening back into three rows of stuff:
//
//   1. THE ROWS ARE NOT EQUAL. Row one is 430px with a 44px heading, two
//      bullets and the largest screen; rows two and three are 340 and 300
//      with a 36px heading and no bullets. The first row is the argument,
//      the other two are the proof, and the type sizes say so.
//   2. THE SPLIT MOVES. Row one is 5fr/7fr, the same ratio the features
//      page uses. Row two gives the screen more (7.5fr) because a
//      six-course list needs the width. Row three comes back to 5fr/7fr.
//      The copy column edge therefore never lines up down the page, which
//      is what stops the two outer rows reading as a repeat.
//   3. ONE ACCENT. Row one, and only row one, gets the citron: a citron
//      block on the second line of its heading and a soft citron wash
//      behind its screen, which is the same radial the FeatureShowcase
//      paints behind every demo. Rows two and three are graphite and ink.
//      Spending the accent on all three is how a layout goes flat. The
//      footer pill stays citron because it is the ask, not decoration, and
//      every unit in the registry carries it.
//   4. THE SCREENS BREATHE PAST THE GUTTER. Each window is 24px wider than
//      its column and pulled toward the copy, so it crosses the gutter
//      line instead of sitting in a tidy box. The chrome always keeps its
//      left edge, because the traffic lights live there.
//
// WHY THE WINDOW CHROME IS DIFFERENT HERE. Every other panel in the kit
// draws its rail dots as hairlines. This unit turns on the real macOS hues
// (#FF5F57, #FEBC2E, #28C840) via AdPanel's `traffic` flag. That is the one
// place the citron-and-graphite rule is deliberately not applied: those
// three dots are recognised as a shape rather than read as a colour, and
// repainting them brand colours makes a window stop looking like a window.
// Nothing else on the artboard borrows them. The badges the other units put
// on the rail are dropped here: at 540px wide the rail is only comfortable
// with dots and a URL, and the copy column is already saying the thing the
// badge would say.
//
// WHAT READS AT WHAT SIZE, checked at scale rather than guessed:
//   full size (1080 wide, or the 2160 export)  everything.
//   half feed (~540px)  every heading, every body line, the course names
//       and both numerals beside each, the timer, the shape of the chat.
//   thumbnail (~260px)  the three headings, the citron block, the three
//       window silhouettes with their traffic lights and the zigzag they
//       make, and the course numerals. The body lines and the chat text
//       go. That is the honest limit, and the zigzag is the thing that
//       still works at that size, which is the point of the composition.
//
// TRUTH. Each screen is drawn from the source the showcase tiles were
// checked against:
//   /dashboard/chatbot   the reply carries the student's level and study
//                        units, which is what BuildTutorPrompt hands the
//                        model. Not citations: nothing in the AI module can
//                        cite anything.
//   /dashboard/mastery   the Projection panel, "Where each course is
//                        heading". Current mark to predicted mark per
//                        course, from AERO_COURSES, read off
//                        GET /api/mastery/predictions for the seeded
//                        first-year Aeronautical Engineering account. No
//                        band and no interval: MasteryController returns
//                        CurrentTerm, PredictedNextTerm and one scalar
//                        Confidence, so a shaded band would be invented.
//   /dashboard/practice  PracticeRunner mid test: the countdown, the
//                        question count, and the tutor locked off.
//
// The audience is university: semesters, courses the student added, first
// year. No CAPS, no matric, no grades. Nothing here shows a citation, a
// worked past-paper solution, a counsellor, a teacher class, a school
// report, or any statistic about anybody.
// =====================================================================

const SITE = "aptiverse.co.za";

// ---------------------------------------------------------------------
// The row. Copy on one side, screen on the other, vertically centred.
// ---------------------------------------------------------------------

type RowProps = {
  scheme: AdScheme;
  /** Which side the copy sits on. The screen takes the other. */
  copySide: "left" | "right";
  height: number;
  copyWidth: number;
  screenWidth: number;
  eyebrow: string;
  heading: React.ReactNode;
  headingSize: number;
  body: string;
  bodySize?: number;
  bullets?: string[];
  /** The citron wash behind the screen. Row one only. */
  glow?: boolean;
  screen: (w: number, h: number) => React.ReactNode;
};

function Row({
  scheme,
  copySide,
  height,
  copyWidth,
  screenWidth,
  eyebrow,
  heading,
  headingSize,
  body,
  bodySize = 22,
  bullets,
  glow,
  screen,
}: RowProps) {
  const s = adSurfaces(scheme);
  // The window overruns its column toward the copy. Its left edge is never
  // the one that moves, because the traffic lights are on it.
  const bleed = 24;
  const drawnWidth = screenWidth + bleed;

  const copy = (
    <Box sx={{ width: copyWidth, flexShrink: 0 }}>
      <Stack spacing="14px">
        <AdEyebrow scheme={scheme} size={18}>
          {eyebrow}
        </AdEyebrow>
        <Typography
          component="p"
          sx={{
            fontSize: headingSize,
            fontWeight: 700,
            lineHeight: 1.1,
            letterSpacing: "-0.03em",
            color: s.ink,
            textWrap: "balance",
          }}
        >
          {heading}
        </Typography>
        <Typography sx={{ fontSize: bodySize, lineHeight: 1.4, color: s.muted }}>{body}</Typography>
        {bullets && (
          <Stack spacing="10px" sx={{ pt: "2px" }}>
            {bullets.map((b) => (
              <Stack key={b} direction="row" spacing="12px" alignItems="flex-start">
                <Box sx={{ display: "flex", color: s.ink, pt: "3px", flexShrink: 0 }}>
                  <CheckCircle2 size={19} />
                </Box>
                <Typography sx={{ fontSize: 20, lineHeight: 1.35, color: s.ink }}>{b}</Typography>
              </Stack>
            ))}
          </Stack>
        )}
      </Stack>
    </Box>
  );

  const window = (
    <Box
      sx={{
        width: drawnWidth,
        height,
        flexShrink: 0,
        position: "relative",
        // A real flex column, so the panel's flex:1 resolves against the row
        // height instead of the panel sizing itself to its content and
        // running into the row below.
        display: "flex",
        flexDirection: "column",
        // The overrun goes toward the copy column, which is the inside edge.
        ml: copySide === "left" ? `${-bleed}px` : 0,
        mr: copySide === "right" ? `${-bleed}px` : 0,
      }}
    >
      {glow && (
        // The same radial FeatureShowcase paints behind every demo, in the
        // one colour this kit allows as a surface.
        <Box
          sx={{
            position: "absolute",
            inset: -40,
            borderRadius: "40px",
            background: `radial-gradient(58% 58% at 50% 50%, ${alpha(CITRON, 0.22)} 0%, ${alpha(
              CITRON,
              0,
            )} 70%)`,
            filter: "blur(28px)",
            zIndex: 0,
          }}
        />
      )}
      <Box
        sx={{
          position: "relative",
          zIndex: 1,
          flex: 1,
          minHeight: 0,
          display: "flex",
          flexDirection: "column",
        }}
      >
        {screen(drawnWidth, height)}
      </Box>
    </Box>
  );

  return (
    <Stack
      direction="row"
      spacing="44px"
      alignItems="center"
      sx={{ height, flexShrink: 0, minWidth: 0 }}
    >
      {copySide === "left" ? (
        <>
          {copy}
          {window}
        </>
      ) : (
        <>
          {window}
          {copy}
        </>
      )}
    </Stack>
  );
}

/** Window body, centred so a taller artboard just gives the screen air. */
function ScreenBody({ gap = 12, children }: { gap?: number; children: React.ReactNode }) {
  return (
    <Stack spacing={`${gap}px`} sx={{ height: "100%", justifyContent: "center" }}>
      {children}
    </Stack>
  );
}

function Avatarish({ bg, fg, children }: { bg: string; fg: string; children: React.ReactNode }) {
  return (
    <Box
      sx={{
        width: 38,
        height: 38,
        borderRadius: "50%",
        bgcolor: bg,
        color: fg,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}
    >
      {children}
    </Box>
  );
}

// ---------------------------------------------------------------------
// Screen 1. The AI tutor, mid conversation.
// ---------------------------------------------------------------------

function TutorScreen({ scheme }: { scheme: AdScheme }) {
  const t = useTheme();
  const s = adSurfaces(scheme);
  const bubble = scheme === "dark" ? "#1B1D22" : "#F1F2EF";

  return (
    <AdPanel
      scheme={scheme}
      url={`${SITE}/dashboard/chatbot`}
      traffic
      dotSize={16}
      flex={1}
    >
      <ScreenBody gap={14}>
        <Stack direction="row" spacing="12px" justifyContent="flex-end" alignItems="flex-start">
          <Box
            sx={{
              maxWidth: "82%",
              px: "18px",
              py: "11px",
              borderRadius: "14px",
              bgcolor: t.palette.primary.main,
              color: t.palette.primary.contrastText,
              fontSize: 22,
              lineHeight: 1.3,
            }}
          >
            I keep losing marks on friction problems. Where do I start?
          </Box>
          <Avatarish bg={CITRON} fg={GRAPHITE}>
            <User size={19} />
          </Avatarish>
        </Stack>

        <Stack direction="row" spacing="12px" alignItems="flex-start">
          <Avatarish bg={t.palette.primary.main} fg={t.palette.primary.contrastText}>
            <Sparkles size={19} />
          </Avatarish>
          <Box
            sx={{
              maxWidth: "96%",
              px: "18px",
              py: "12px",
              borderRadius: "14px",
              bgcolor: bubble,
              color: s.ink,
              fontSize: 22,
              lineHeight: 1.35,
            }}
          >
            Start with the free body diagram. Most friction marks are lost before any arithmetic
            happens.
            {/* What the tutor is handed, not what it cites. There is no
                retrieval and no citation path anywhere in the AI module. */}
            <Stack direction="row" spacing="8px" sx={{ mt: "10px" }} flexWrap="wrap" useFlexGap>
              <AdChip scheme={scheme}>Knows you take Mechanics I</AdChip>
              <AdChip scheme={scheme}>Pitched at first year</AdChip>
            </Stack>
          </Box>
        </Stack>
      </ScreenBody>
    </AdPanel>
  );
}

// ---------------------------------------------------------------------
// Screen 2. The projection panel on /dashboard/mastery.
// ---------------------------------------------------------------------

function ProjectionScreen({ scheme }: { scheme: AdScheme }) {
  const s = adSurfaces(scheme);

  return (
    <AdPanel scheme={scheme} url={`${SITE}/dashboard/mastery`} traffic dotSize={16} flex={1}>
      <ScreenBody gap={8}>
        {AERO_COURSES.map((c) => {
          // Three-way, not two. A flat projection is its own state: giving it
          // the rising colour would claim an improvement the arithmetic did
          // not produce.
          const delta = c.predicted === null ? 0 : c.predicted - c.current;
          const tone = delta > 0 ? CHART_UP : delta < 0 ? CHART_DOWN : s.muted;
          const Glyph = delta > 0 ? ArrowUpRight : delta < 0 ? ArrowDownRight : Minus;
          return (
            <Stack
              key={c.name}
              direction="row"
              spacing="14px"
              alignItems="baseline"
              sx={{ minWidth: 0 }}
            >
              <Typography
                sx={{ fontSize: 21, fontWeight: 600, lineHeight: 1.2, color: s.ink, flex: 1, minWidth: 0 }}
                noWrap
              >
                {c.name}
              </Typography>
              {c.predicted === null ? (
                <Typography sx={{ fontSize: 20, lineHeight: 1.2, color: s.muted, flexShrink: 0 }}>
                  no projection yet
                </Typography>
              ) : (
                <Stack direction="row" spacing="9px" alignItems="center" sx={{ flexShrink: 0 }}>
                  <Typography
                    sx={{
                      fontSize: 24,
                      fontWeight: 700,
                      lineHeight: 1.2,
                      color: s.ink,
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    {c.current}
                  </Typography>
                  <Box sx={{ display: "flex", color: tone }}>
                    <Glyph size={19} />
                  </Box>
                  <Typography
                    sx={{
                      fontSize: 24,
                      fontWeight: 700,
                      lineHeight: 1.2,
                      color: tone,
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    {c.predicted}
                  </Typography>
                </Stack>
              )}
            </Stack>
          );
        })}
      </ScreenBody>
    </AdPanel>
  );
}

// ---------------------------------------------------------------------
// Screen 3. The practice runner, mid test.
// ---------------------------------------------------------------------

function RunnerScreen({ scheme }: { scheme: AdScheme }) {
  const t = useTheme();
  const s = adSurfaces(scheme);
  const answers = [
    { text: "Weight of the ladder", picked: false },
    { text: "Reaction at the wall", picked: true },
  ];

  return (
    <AdPanel scheme={scheme} url={`${SITE}/dashboard/practice`} traffic dotSize={16} flex={1}>
      <ScreenBody gap={10}>
        <Stack direction="row" spacing="14px" alignItems="center">
          <Typography sx={{ fontSize: 19, color: s.muted, flex: 1, minWidth: 0 }} noWrap>
            Question 3 of 5
          </Typography>
          <AdChip scheme={scheme} icon={<Clock size={16} />}>
            17:42
          </AdChip>
        </Stack>

        <Typography sx={{ fontSize: 22, fontWeight: 600, color: s.ink, lineHeight: 1.3 }}>
          Which force balances the friction at the base of the ladder?
        </Typography>

        {/* Side by side rather than stacked. The window is 570 wide and only
            300 tall in the portrait row, so the answers spend width, which
            there is, instead of height, which there is not. */}
        <Stack direction="row" spacing="10px">
          {answers.map((o) => (
            <Stack
              key={o.text}
              direction="row"
              spacing="12px"
              alignItems="center"
              sx={{
                flex: 1,
                minWidth: 0,
                px: "14px",
                py: "9px",
                borderRadius: "11px",
                border: `2px solid ${o.picked ? t.palette.primary.main : s.hair}`,
                bgcolor: o.picked ? alpha(t.palette.primary.main, 0.14) : "transparent",
              }}
            >
              <Box
                sx={{
                  width: 17,
                  height: 17,
                  borderRadius: "50%",
                  flexShrink: 0,
                  border: `3px solid ${o.picked ? t.palette.primary.main : s.hair}`,
                  bgcolor: o.picked ? t.palette.primary.main : "transparent",
                }}
              />
              <Typography sx={{ fontSize: 19, color: s.ink }} noWrap>
                {o.text}
              </Typography>
            </Stack>
          ))}
        </Stack>
      </ScreenBody>
    </AdPanel>
  );
}

// ---------------------------------------------------------------------
// Copy. Written once and shared by all three cuts.
// ---------------------------------------------------------------------

const ROW1 = {
  eyebrow: "Study assistant",
  body: "Your level, your courses, your marks and what is due next go into every reply.",
  bullets: ["Explains it, then sets you one to try", "Original questions, with the working shown"],
};

const ROW2 = {
  eyebrow: "Projection",
  heading: "Six courses, and where each one is heading.",
  body: "Log a mark and Aptiverse projects the semester ahead for that course, from the marks already in and the topics you have not locked down.",
};

const ROW3 = {
  eyebrow: "Practice",
  heading: "A test written for you, not pulled from a bank.",
  body: "Name a topic and you get a fresh set at the difficulty you pick. Timed, one attempt, tutor switched off.",
};

/** Row one's heading, the only citron on the artboard. */
function Row1Heading({ size }: { size: number }) {
  return (
    <>
      Ask it anything.{" "}
      <CitronBlock size={size} px={14} py={2}>
        It knows the course.
      </CitronBlock>
    </>
  );
}

function CardFooter({ scheme, size = 28 }: { scheme: AdScheme; size?: number }) {
  const s = adSurfaces(scheme);
  return (
    <Stack direction="row" alignItems="center" justifyContent="space-between" spacing="20px">
      <Stack direction="row" spacing="14px" alignItems="baseline">
        <Wordmark scheme={scheme} size={size} />
        <Typography sx={{ fontSize: size * 0.76, color: s.muted }}>{SITE}</Typography>
      </Stack>
      <AdCta size={size * 0.8}>Start free</AdCta>
    </Stack>
  );
}

// ---------------------------------------------------------------------
// UNIT 1. Portrait feed, 1080x1350, dark. The primary.
//
// Three rows want the vertical room, which is why portrait is the cut this
// composition is authored at and the other two are adaptations of it.
// ---------------------------------------------------------------------

function CardsPortrait() {
  const scheme: AdScheme = "dark";
  return (
    <Artboard width={1080} height={1350} scheme={scheme} pad={48}>
      <AdEyebrow scheme={scheme} size={20}>
        For university students
      </AdEyebrow>
      <Box sx={{ height: 26 }} />
      <Stack spacing="32px" sx={{ flex: 1, minHeight: 0, justifyContent: "center" }}>
        <Row
          scheme={scheme}
          copySide="left"
          height={430}
          copyWidth={390}
          screenWidth={550}
          eyebrow={ROW1.eyebrow}
          heading={<Row1Heading size={44} />}
          headingSize={44}
          body={ROW1.body}
          bullets={ROW1.bullets}
          glow
          screen={() => <TutorScreen scheme={scheme} />}
        />
        <Row
          scheme={scheme}
          copySide="right"
          height={340}
          copyWidth={366}
          screenWidth={574}
          eyebrow={ROW2.eyebrow}
          heading={ROW2.heading}
          headingSize={36}
          body={ROW2.body}
          bodySize={21}
          screen={() => <ProjectionScreen scheme={scheme} />}
        />
        <Row
          scheme={scheme}
          copySide="left"
          height={300}
          copyWidth={390}
          screenWidth={550}
          eyebrow={ROW3.eyebrow}
          heading={ROW3.heading}
          headingSize={36}
          body={ROW3.body}
          bodySize={21}
          screen={() => <RunnerScreen scheme={scheme} />}
        />
      </Stack>
      <Box sx={{ height: 26 }} />
      <CardFooter scheme={scheme} />
    </Artboard>
  );
}

// ---------------------------------------------------------------------
// UNIT 2. Square feed, 1080x1080, dark.
//
// TWO rows, not three. A square is 270px shorter than the portrait, which
// is most of a row, and three rows in it would mean 250px bands with the
// copy squeezed to a line each. What goes is the practice runner, because
// the alternating rhythm needs at least one swap to exist at all and the
// first swap is the tutor into the projection. The runner keeps its own
// full-size row in the portrait and story cuts.
// ---------------------------------------------------------------------

function CardsSquare() {
  const scheme: AdScheme = "dark";
  return (
    <Artboard width={1080} height={1080} scheme={scheme} pad={44}>
      <AdEyebrow scheme={scheme} size={20}>
        For university students
      </AdEyebrow>
      <Box sx={{ height: 24 }} />
      <Stack spacing="44px" sx={{ flex: 1, minHeight: 0, justifyContent: "center" }}>
        <Row
          scheme={scheme}
          copySide="left"
          height={452}
          copyWidth={396}
          screenWidth={552}
          eyebrow={ROW1.eyebrow}
          heading={<Row1Heading size={46} />}
          headingSize={46}
          body={ROW1.body}
          bullets={ROW1.bullets}
          glow
          screen={() => <TutorScreen scheme={scheme} />}
        />
        <Row
          scheme={scheme}
          copySide="right"
          height={372}
          copyWidth={370}
          screenWidth={578}
          eyebrow={ROW2.eyebrow}
          heading={ROW2.heading}
          headingSize={38}
          body={ROW2.body}
          bodySize={21}
          screen={() => <ProjectionScreen scheme={scheme} />}
        />
      </Stack>
      <Box sx={{ height: 24 }} />
      <CardFooter scheme={scheme} size={26} />
    </Artboard>
  );
}

// ---------------------------------------------------------------------
// UNIT 3. Story and reel, 1080x1920, dark.
//
// The platform covers roughly the top 250 and the bottom 350 with its own
// furniture, so the rows sit in the middle band. The extra height goes into
// air: taller rows and bigger gaps, with the same copy and the same screens.
// A story that adds content is a story nobody finishes.
// ---------------------------------------------------------------------

function CardsStory() {
  const scheme: AdScheme = "dark";
  return (
    <Artboard width={1080} height={1920} scheme={scheme} pad={48}>
      <Box sx={{ height: 140 }} />
      <AdEyebrow scheme={scheme} size={24}>
        For university students
      </AdEyebrow>
      <Box sx={{ height: 30 }} />
      <Stack spacing="60px" sx={{ flex: 1, minHeight: 0, justifyContent: "center" }}>
        <Row
          scheme={scheme}
          copySide="left"
          height={490}
          copyWidth={390}
          screenWidth={550}
          eyebrow={ROW1.eyebrow}
          heading={<Row1Heading size={46} />}
          headingSize={46}
          body={ROW1.body}
          bullets={ROW1.bullets}
          glow
          screen={() => <TutorScreen scheme={scheme} />}
        />
        <Row
          scheme={scheme}
          copySide="right"
          height={410}
          copyWidth={366}
          screenWidth={574}
          eyebrow={ROW2.eyebrow}
          heading={ROW2.heading}
          headingSize={38}
          body={ROW2.body}
          screen={() => <ProjectionScreen scheme={scheme} />}
        />
        <Row
          scheme={scheme}
          copySide="left"
          height={380}
          copyWidth={390}
          screenWidth={550}
          eyebrow={ROW3.eyebrow}
          heading={ROW3.heading}
          headingSize={38}
          body={ROW3.body}
          screen={() => <RunnerScreen scheme={scheme} />}
        />
      </Stack>
      <Box sx={{ height: 34 }} />
      <CardFooter scheme={scheme} size={32} />
      <Box sx={{ height: 140 }} />
    </Artboard>
  );
}

export const CARD_UNITS = {
  CardsPortrait,
  CardsSquare,
  CardsStory,
};
