"use client";

import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { alpha, useTheme } from "@mui/material/styles";
import { Fragment } from "react";
import {
  ArrowDownRight,
  ArrowUpRight,
  CheckCircle2,
  Minus,
  Sparkles,
  User,
} from "lucide-react";
import {
  AdChip,
  AdEyebrow,
  AdPanel,
  Artboard,
  CitronBlock,
  Wordmark,
  adPanelBg,
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
//   1. THE ROWS ARE NOT EQUAL. Row one is the tallest, with a 44px heading,
//      two bullets and the largest screen; rows two and three are shorter,
//      with a 36px heading and no bullets. The first row is the argument,
//      the other two are the proof, and the type sizes say so. Rows two and
//      three are not equal to each other either, and which of them is taller
//      is decided by what its screen has to hold: the exam paper needs a
//      timer panel, a marked question and a written-answer field, so it took
//      the room the projection chart did not need.
//   2. THE SPLIT MOVES. Row one is 5fr/7fr, the same ratio the features
//      page uses. Row two gives the screen more (7.5fr) because a
//      six-course list needs the width. Row three comes back to 5fr/7fr.
//      The copy column edge therefore never lines up down the page, which
//      is what stops the two outer rows reading as a repeat.
//   3. ONE ACCENT. Row one, and only row one, gets the citron: a citron
//      block on the second line of its heading and a soft citron wash
//      behind its screen, which is the same radial the FeatureShowcase
//      paints behind every demo. Rows two and three are graphite and ink.
//      Spending the accent on all three is how a layout goes flat. With the
//      footer pill gone the citron block on row one is now the only citron
//      on the artboard, which is the rule stated exactly rather than nearly.
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
//       with their tracks, both marks per course and the travel bar between
//       them, the countdown and the exam question, the shape of the chat.
//   thumbnail (~260px)  the three headings, the citron block, the three
//       window silhouettes with their traffic lights and the zigzag they
//       make, and the countdown. In the plot the six tracks, the 50 rule and
//       the coloured travel bars still read as a shape, green rungs with one
//       clay one low down; the numerals, the tick and the disc do not
//       separate at that size. The body lines, the chat text and the exam
//       question go. That is the honest limit, and the zigzag is the thing
//       that still works at that size, which is the point of the
//       composition.
//
// THE GROUND. The artboard carries the campaign-wide dot lattice from
// adkit's Artboard, at 5% ink. It is masked by every window and never sits
// under a run of type, so nothing on here lost contrast for it.
//
// TRUTH. Each screen is drawn from the source the showcase tiles were
// checked against:
//   /dashboard/chatbot   the reply carries the student's level and study
//                        units, which is what BuildTutorPrompt hands the
//                        model. Not citations: nothing in the AI module can
//                        cite anything.
//   /dashboard/mastery   the ProjectionSlope chart. Current mark to
//                        predicted mark per course, from AERO_COURSES, read
//                        off GET /api/mastery/predictions for the seeded
//                        first-year Aeronautical Engineering account. No
//                        band and no interval: MasteryController returns
//                        CurrentTerm, PredictedNextTerm and one scalar
//                        Confidence, so a shaded band would be invented.
//   /dashboard/practice  PracticeRunner on an exam-format paper: the
//                        countdown, the marks position, one long-form
//                        written question with what it is out of, and the
//                        empty answer field. Every part of that is in the
//                        code; see the header on ExamScreen for the file
//                        and symbol behind each element.
//
// AUDIENCE AND LABEL ARE NOT THE SAME THING. What is depicted is a
// university account: semesters, courses the student added, first year, a
// tertiary marking model. What is PRINTED is "For students". Leading with
// "university" on the artwork is a targeting decision made in the wrong
// place, the ad platform already targets by institution and age, and the
// word only narrows who feels spoken to. No CAPS, no matric, no grades
// anywhere in the picture. Nothing here shows a citation, a worked
// past-paper solution, a confidence band, a counsellor, a teacher class, a
// school report, or any statistic about anybody.
// =====================================================================

const SITE = "aptiverse.co.za";

/**
 * Rail URL size, set once for all three windows rather than per panel.
 *
 * The exam window is the constraint: its rail carries the live-attempt pill
 * as well as the path, and at the kit's default 21px the URL ran out of room
 * and ellipsised, which reads as a mistake rather than as chrome. Dropping
 * only that one window's URL would have left three windows on one artboard
 * with two different rail sizes, which is worse than all three being a
 * little smaller. 16px is what the longest of the three needs, measured off
 * the export rather than estimated: at 17 the practice path was eight pixels
 * short and lost its last two characters to the ellipsis.
 */
const RAIL_URL = 16;

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
      urlSize={RAIL_URL}
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
// Screen 2. The projection panel on /dashboard/mastery, PLOTTED.
//
// This row used to be six course names with two numerals beside each, and
// the founder read it as a table, correctly: a list of numbers in rows is a
// list of numbers in rows however it is styled, and the row it sits in is
// asking the reader to believe this is an analytics product.
//
// WHAT IT IS NOW, and what it deliberately is not.
//
// The screen this depicts, /dashboard/mastery, renders ProjectionSlope: a
// LineChart with x = ["Current", "Predicted"], y pinned to 0-100, one line
// per course, coloured by whether the projection rises or falls. That is
// exactly two points per course on a real scale, so it is drawn here as
// exactly two points per course on a real scale, laid horizontally instead
// of vertically. The encoding is identical; only the axis is turned, and it
// is turned for a reason given below.
//
// The alternative brief was marks over time from graded assessments. It was
// not taken: those marks are real but they are not this screen, and a line
// of dated marks next to the words "projected next semester" invites the
// reader to extend it, which is the exact misreading the confidence band was
// removed for.
//
// NO BAND, NO INTERVAL, EVER. MasteryController.GetPredictions returns
// CurrentTerm, PredictedNextTerm and one scalar Confidence per course.
// There is no series and no interval anywhere in the response, so a shaded
// band would be drawing the shape of a feature that does not exist. The
// scalar confidence is not shown either, because the screen being depicted
// does not show it.
//
// WHY HORIZONTAL. Vertically, the six projected marks land on 78, 73, 66,
// 65, 58 and 46. In the height this row can spend, 100 marks is about 165px,
// so 65 and 66 are one and a half pixels apart and the labels for the six
// lines are unplaceable without leader lines and nudging, which is a lot of
// apparatus for an image somebody sees for two seconds. Turned on its side,
// the course name is simply the row label, nothing can collide, and the
// domain gets 240px instead of 165.
//
// THE DOMAIN IS THE FULL 0 TO 100. Cropping to 40-85 would triple the
// apparent size of every gap. Same rule as charts.tsx, same reason.
// ---------------------------------------------------------------------

// WHAT THE TWO MARKERS ARE, and why they are not two dots.
//
// The first plot drew "now" and "projected" as two circles of the same
// family, a small white one and a larger coloured one, each ringed in the
// panel surface. On the six real deltas that fails: Mechanics moves 57 to 58,
// which on this row's axis is under three pixels, so a 13px dot and a 17px
// dot centred three pixels apart are one lumpy blob, and Electrical (+3) and
// Physics (+5) are half eaten. No amount of extra width fixes it either. The
// widest cut in the set gives the domain about 450px, so one mark is still
// only four and a half pixels and a one-mark move still puts two circles
// inside each other.
//
// So the two ends stop being the same kind of object. "Now" is a vertical
// tick, a slim ink capsule that marks a position the way a gate does.
// "Projected" is a filled round terminal at the end of the travel bar. A tick
// and a disc never merge into one shape however close they get: at +1 the
// tick simply sits inside the disc, haloed in the panel surface so its edges
// hold, and the reader sees a dot with a start gate near its middle, which is
// exactly what a one-mark move is. The tick is also the smaller mark and is
// drawn last, so it is never the thing that gets buried.
//
// The travel between them is a bar in the direction colour, thick enough to
// be the loudest thing in the row, because the distance moved is the story.
// A flat course gets no bar and no invented movement: the tick lands dead
// centre on a muted disc, and the symmetry of that glyph is what says "held"
// rather than "broken". The value column says the same thing a third way:
// current, glyph, projected, so 78 - 78 and 70 up 73 read without colour.

/** Row label column. Sized so "Electrical Engineering" sets on one line. */
const PROJ_NAME_W = 186;
/** Current numeral, direction glyph, projected numeral, right aligned. */
const PROJ_VALUE_W = 78;
/**
 * Vertical room one plotted row gets. Must clear the tick and its halo, and
 * six of these plus the caption and the axis have to fit the shortest panel
 * this screen is drawn into, which is the portrait cut's middle row. At 30
 * the axis labels were pushed under the panel's own rounded corner.
 */
const PROJ_ROW_H = 28;
/** The 0-100 track every row sits on. */
const PROJ_TRACK_H = 7;
/** The travel bar between now and projected. Heavier than the track. */
const PROJ_SEG_H = 12;
/**
 * The projected terminal, and the now tick.
 *
 * These are as small as they can be and still read, because every pixel of
 * marker is a pixel of travel bar the marker covers. On a full 0-100 domain
 * in this row's width one mark is under three pixels, so a 15px disc and a
 * 5px tick already eat the whole of a three-mark move. That is a fact about
 * the data and the honest domain, not a bug to style away: Electrical moving
 * 70 to 73 IS a three-percent move, and any drawing where it looks like a
 * long journey is the cropped-axis lie in another costume. What the drawing
 * owes the reader is that the move is visible AS a move, which the numerals,
 * the glyph and the sign do at every delta, and that the big moves look big,
 * which the bar does from about four marks up. The wide cut buys roughly
 * 450px of domain against 260 here, and that is where the bar starts doing
 * real work on the five-mark rows.
 */
const PROJ_DOT = 15;
/**
 * The flat marker runs larger than the moving one. It has to clear the tick
 * that lands in the middle of it plus that tick's halo, or the ring is a
 * grey sliver either side of a white bar and the deliberate glyph reads as a
 * rendering accident, which is the exact failure it exists to fix.
 */
const PROJ_FLAT_DOT = 22;
const PROJ_TICK_W = 5;
const PROJ_TICK_H = 22;

function ProjectionScreen({ scheme }: { scheme: AdScheme }) {
  const s = adSurfaces(scheme);
  // The tick is haloed in the panel's own surface so it holds its edge over
  // the disc it can land inside. Read off the same helper AdPanel fills with,
  // rather than a second copy of the literal that would quietly drift.
  const ring = adPanelBg(scheme);
  // The track and the 50 rule are drawn off the ink rather than off s.hair.
  // s.hair is a 14% hairline meant for borders; at plot scale it recedes into
  // the panel and the six tracks stop reading as a grid at all.
  const track = alpha(s.ink, 0.16);
  const rule = alpha(s.ink, 0.32);
  const rows = AERO_COURSES;

  return (
    <AdPanel
      scheme={scheme}
      url={`${SITE}/dashboard/mastery`}
      traffic
      dotSize={16}
      urlSize={RAIL_URL}
      flex={1}
    >
      <Stack sx={{ height: "100%" }}>
        <Stack direction="row" alignItems="baseline" spacing="14px" sx={{ mb: "10px" }}>
          <AdEyebrow scheme={scheme} size={15}>
            Projected next semester
          </AdEyebrow>
          <Box sx={{ flex: 1 }} />
          <Typography sx={{ fontSize: 15, color: s.muted, whiteSpace: "nowrap" }}>
            mark now, then projected
          </Typography>
        </Stack>

        <Box
          sx={{
            flex: 1,
            minHeight: 0,
            display: "grid",
            gridTemplateColumns: `${PROJ_NAME_W}px 1fr ${PROJ_VALUE_W}px`,
            gridTemplateRows: `repeat(${rows.length}, 1fr)`,
            columnGap: "12px",
            alignItems: "center",
          }}
        >
          {/* One continuous 50 rule behind every track rather than a tick per
              row, so it reads as a single reference line. Spanning the plot
              column of the grid is what keeps it aligned to the tracks
              without anybody measuring anything. It carries a z-index because
              the six row boxes are painted after it and a 2px line at 14% ink
              was disappearing under every one of them. */}
          <Box
            sx={{
              gridColumn: 2,
              gridRow: `1 / span ${rows.length}`,
              position: "relative",
              height: "100%",
            }}
          >
            <Box
              sx={{
                position: "absolute",
                left: "50%",
                top: 0,
                bottom: 0,
                width: 3,
                ml: "-1.5px",
                bgcolor: rule,
                zIndex: 1,
              }}
            />
          </Box>

          {rows.map((c, i) => {
            // Three-way, not two. A flat projection is its own state: giving
            // it the rising colour would claim an improvement the arithmetic
            // did not produce.
            const delta = c.predicted === null ? 0 : c.predicted - c.current;
            const tone = delta > 0 ? CHART_UP : delta < 0 ? CHART_DOWN : s.muted;
            const Glyph = delta > 0 ? ArrowUpRight : delta < 0 ? ArrowDownRight : Minus;
            const lo = Math.min(c.current, c.predicted ?? c.current);
            const hi = Math.max(c.current, c.predicted ?? c.current);

            return (
              <Fragment key={c.name}>
                <Typography
                  noWrap
                  sx={{
                    gridColumn: 1,
                    gridRow: i + 1,
                    fontSize: 18,
                    fontWeight: 600,
                    lineHeight: 1.2,
                    color: s.ink,
                  }}
                >
                  {c.name}
                </Typography>

                <Box
                  sx={{
                    gridColumn: 2,
                    gridRow: i + 1,
                    position: "relative",
                    height: PROJ_ROW_H,
                  }}
                >
                  {/* Percentages are the scale: left edge is 0, right edge
                      is 100. No arithmetic, no magic numbers. */}
                  <Box
                    sx={{
                      position: "absolute",
                      left: 0,
                      right: 0,
                      top: "50%",
                      height: PROJ_TRACK_H,
                      mt: `${-PROJ_TRACK_H / 2}px`,
                      borderRadius: 999,
                      bgcolor: track,
                      zIndex: 0,
                    }}
                  />
                  {/* The travel. Two points on a scale with nothing drawn
                      between them is two facts; the bar is what makes it one
                      movement. Absent, deliberately, where nothing moved. */}
                  {c.predicted !== null && hi > lo && (
                    <Box
                      sx={{
                        position: "absolute",
                        left: `${lo}%`,
                        width: `${hi - lo}%`,
                        top: "50%",
                        height: PROJ_SEG_H,
                        mt: `${-PROJ_SEG_H / 2}px`,
                        borderRadius: 999,
                        bgcolor: tone,
                        zIndex: 2,
                      }}
                    />
                  )}
                  {/* The projected terminal. No surface halo on this one: it
                      sits at the end of its own bar in its own colour, so a
                      ring would only cut the travel two pixels short of where
                      it arrives.

                      A course that did not move gets the same disc HOLLOW.
                      With the tick landing dead centre in it, that glyph is
                      symmetrical and closed, which is what makes a flat
                      projection read as a state the chart drew on purpose
                      rather than as a marker that failed to render. */}
                  {c.predicted !== null && (
                    <Box
                      sx={{
                        position: "absolute",
                        left: `${c.predicted}%`,
                        top: "50%",
                        width: delta === 0 ? PROJ_FLAT_DOT : PROJ_DOT,
                        height: delta === 0 ? PROJ_FLAT_DOT : PROJ_DOT,
                        mt: `${-(delta === 0 ? PROJ_FLAT_DOT : PROJ_DOT) / 2}px`,
                        ml: `${-(delta === 0 ? PROJ_FLAT_DOT : PROJ_DOT) / 2}px`,
                        borderRadius: "50%",
                        bgcolor: delta === 0 ? "transparent" : tone,
                        border: delta === 0 ? `3px solid ${s.muted}` : "none",
                        boxSizing: "border-box",
                        zIndex: 3,
                      }}
                    />
                  )}
                  {/* Now. Last in the paint order and haloed, so it survives
                      landing inside the disc on a one-mark move. */}
                  <Box
                    sx={{
                      position: "absolute",
                      left: `${c.current}%`,
                      top: "50%",
                      width: PROJ_TICK_W,
                      height: PROJ_TICK_H,
                      mt: `${-PROJ_TICK_H / 2}px`,
                      ml: `${-PROJ_TICK_W / 2}px`,
                      borderRadius: 999,
                      bgcolor: s.ink,
                      boxShadow: `0 0 0 2.5px ${ring}`,
                      zIndex: 4,
                    }}
                  />
                </Box>

                {/* Both numbers, current then projected, because a
                    before-and-after that prints only the after is half a
                    chart. The two are told apart by weight and colour as well
                    as by order: the current mark is the quiet one. */}
                <Stack
                  direction="row"
                  spacing="5px"
                  alignItems="center"
                  justifyContent="flex-end"
                  sx={{ gridColumn: 3, gridRow: i + 1 }}
                >
                  <Typography
                    sx={{
                      fontSize: 18,
                      fontWeight: 600,
                      lineHeight: 1.2,
                      color: s.muted,
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    {c.current}
                  </Typography>
                  <Box sx={{ display: "flex", color: tone, flexShrink: 0 }}>
                    <Glyph size={15} />
                  </Box>
                  <Typography
                    sx={{
                      fontSize: 22,
                      fontWeight: 700,
                      lineHeight: 1.2,
                      color: tone,
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    {c.predicted ?? "-"}
                  </Typography>
                </Stack>
              </Fragment>
            );
          })}
        </Box>

        {/* Axis. Three labels: the ends, and the 50 the rule marks. The 50
            is the one that carries meaning, so it is the one set in ink. */}
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: `${PROJ_NAME_W}px 1fr ${PROJ_VALUE_W}px`,
            columnGap: "12px",
            mt: "8px",
          }}
        >
          <Box sx={{ gridColumn: 2, position: "relative", height: 17 }}>
            {[0, 50, 100].map((tick) => (
              <Typography
                key={tick}
                sx={{
                  position: "absolute",
                  left: `${tick}%`,
                  transform:
                    tick === 0 ? "none" : tick === 100 ? "translateX(-100%)" : "translateX(-50%)",
                  fontSize: 16,
                  fontWeight: tick === 50 ? 700 : 500,
                  lineHeight: 1,
                  color: tick === 50 ? s.ink : s.muted,
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {tick}
              </Typography>
            ))}
          </Box>
        </Box>
      </Stack>
    </AdPanel>
  );
}

// ---------------------------------------------------------------------
// Screen 3. The exam paper, mid attempt.
//
// This row was a five-question multiple-choice runner, which undersold the
// thing it was standing for. The practice module ships an "exam" format that
// is a different object from a quiz, and all of it is verifiable:
//
//   PracticeTestGenerator, case "exam"     a full paper in sections A, B
//                                          and C, with its own duration.
//   FrontendQuestionDto.Marks              what each question is out of,
//                                          served BEFORE submit precisely so
//                                          the student can budget the hour.
//   PracticeService.MarkWrittenAnswersAsync  written answers go to a marker
//                                          told to work "strictly against the
//                                          memo and award part marks the way
//                                          a real marker does", with the
//                                          memo injected per question.
//   FrontendScoreSummaryDto.MarksAwarded / MarksTotal, and
//   FrontendMarkedAnswerDto.MarksAwarded / MarksAvailable
//                                          marks per question and per paper.
//   PracticeRunner InstructionsView        timed, one attempt, tutor off,
//                                          leaving the tab is recorded.
//
// So: a countdown, the paper position in marks rather than in questions, one
// long-form written question with what it is out of, and a free-text field
// tall enough that nobody mistakes it for a text input. No options, because
// options are the thing this row exists to stop promising.
//
// The line about memo marking and part marks lives in the copy column rather
// than as a footnote inside the window. At 346px the row cannot hold both,
// and of the two places, the copy column is where a reader is already
// reading sentences.
// ---------------------------------------------------------------------

function ExamScreen({ scheme }: { scheme: AdScheme }) {
  const t = useTheme();
  const s = adSurfaces(scheme);
  // The one warm colour on the artboard, and it is a theme token rather than
  // a hex: a countdown is the only thing on this screen that is urgent, and
  // it is the only thing tinted.
  const alarm = t.palette.error.main;

  return (
    <AdPanel
      scheme={scheme}
      url={`${SITE}/dashboard/practice`}
      traffic
      dotSize={16}
      urlSize={RAIL_URL}
      flex={1}
      badge={
        // The negative inset pulls the kit's standard pill padding in by
        // three each side. This is the one rail in the set carrying a pill
        // and a full path, and six pixels is the difference between the
        // path fitting and ellipsising.
        <Stack
          direction="row"
          spacing="8px"
          alignItems="center"
          sx={{ fontSize: 13, mx: "-3px" }}
        >
          <Box sx={{ width: 9, height: 9, borderRadius: "50%", bgcolor: alarm, flexShrink: 0 }} />
          <span>LIVE · One attempt</span>
        </Stack>
      }
    >
      <ScreenBody gap={10}>
        {/* The clock. Its own panel, because on a real paper the clock is not
            a chip in a corner, it is the thing you keep looking back at. */}
        <Stack
          direction="row"
          alignItems="flex-end"
          spacing="16px"
          sx={{
            px: "16px",
            py: "9px",
            borderRadius: "12px",
            border: `2px solid ${alpha(alarm, 0.5)}`,
            bgcolor: alpha(alarm, 0.09),
          }}
        >
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography
              sx={{
                fontSize: 13,
                fontWeight: 700,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                lineHeight: 1,
                color: s.muted,
              }}
            >
              Time remaining
            </Typography>
            <Typography
              sx={{
                mt: "5px",
                fontFamily: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
                fontSize: 30,
                fontWeight: 700,
                lineHeight: 1,
                letterSpacing: "-0.02em",
                color: s.ink,
                fontVariantNumeric: "tabular-nums",
              }}
            >
              01:23:45
            </Typography>
          </Box>
          <Box sx={{ textAlign: "right", flexShrink: 0 }}>
            <Typography
              sx={{
                fontSize: 13,
                fontWeight: 700,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                lineHeight: 1,
                color: s.muted,
              }}
            >
              Progress
            </Typography>
            <Typography
              sx={{
                mt: "6px",
                fontSize: 18,
                fontWeight: 600,
                lineHeight: 1,
                color: s.ink,
                fontVariantNumeric: "tabular-nums",
              }}
            >
              Q3 of 12 · 18/100 marks
            </Typography>
          </Box>
        </Stack>

        {/* The question. A left rule rather than a box: the row has no spare
            vertical for a second set of paddings, and the rule still binds
            the label, the mark badge and the question into one object. */}
        <Box sx={{ borderLeft: `3px solid ${s.hair}`, pl: "16px" }}>
          <Stack direction="row" alignItems="center" spacing="12px" sx={{ mb: "8px" }}>
            <Typography
              sx={{
                fontSize: 13,
                fontWeight: 700,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                lineHeight: 1,
                color: s.muted,
              }}
            >
              Question 3
            </Typography>
            <Box sx={{ flex: 1 }} />
            <Box
              sx={{
                px: "12px",
                py: "5px",
                borderRadius: 999,
                border: `2px solid ${s.hair}`,
                fontSize: 15,
                fontWeight: 700,
                lineHeight: 1,
                color: s.ink,
                whiteSpace: "nowrap",
              }}
            >
              8 marks
            </Box>
          </Stack>
          <Typography sx={{ fontSize: 18, lineHeight: 1.32, color: s.ink }}>
            Determine the equation of the tangent to the curve f(x) = x³ - 3x² + 2 at the point
            where x = 2.
          </Typography>
        </Box>

        {/* Empty, and tall. An eight-mark question answered in a two-line box
            tells the student to write two lines. */}
        <Box
          sx={{
            height: 48,
            borderRadius: "10px",
            border: `2px solid ${s.hair}`,
            bgcolor: alpha(s.ink, 0.03),
            px: "14px",
            pt: "9px",
          }}
        >
          <Typography sx={{ fontSize: 17, lineHeight: 1, color: s.muted }}>
            Write your full answer…
          </Typography>
        </Box>
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
  body: "Every course plotted from the mark it is on now to the mark projected for next semester, out of the graded work already logged.",
};

const ROW3 = {
  eyebrow: "Exam simulator",
  heading: "One paper. One attempt. The clock running.",
  body: "Written answers, not four options, marked against the memo at submission with part marks per question.",
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

/**
 * Footer. Wordmark and domain, and nothing else.
 *
 * The "Start free" pill was removed on the same reasoning showcase.tsx was:
 * an image travels further than the campaign that placed it, and a button
 * painted into a PNG is a control nobody can press. What has to survive the
 * screenshot and the repost is attribution, so the wordmark and the domain
 * stay and the ask moves to the placement, where it is a real link.
 */
function CardFooter({ scheme, size = 28 }: { scheme: AdScheme; size?: number }) {
  const s = adSurfaces(scheme);
  return (
    <Stack direction="row" alignItems="baseline" spacing="14px">
      <Wordmark scheme={scheme} size={size} />
      <Typography sx={{ fontSize: size * 0.76, color: s.muted }}>{SITE}</Typography>
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
    <Artboard width={1080} height={1350} scheme={scheme} pad={40}>
      <AdEyebrow scheme={scheme} size={20}>
        For students
      </AdEyebrow>
      <Box sx={{ height: 26 }} />
      {/* 408 + 350 + 342 and 24px gutters is the 1148 the three rows have
          between the eyebrow and the footer. The exam paper is the row that
          grew first: a timer panel, a marked question and a written-answer
          field do not fit in the 300 the multiple-choice runner used. The
          projection row grew second, and this is the cut that forced it: six
          plotted rows, a caption and an axis need about 350 of row here, and
          at 328 the axis labels were sliding under the panel's bottom
          corner. Rows 1 and 3 gave up five and four pixels for it. The
          hierarchy is intact, row one is still the tallest and still the only
          44px heading.

          The pad came down from 48 to 40, and the 16px that freed went to the
          screens rather than the copy: the copy column is set to a comfortable
          measure already, and the plot is the element on this artboard that
          was actually short of room. */}
      <Stack spacing="24px" sx={{ flex: 1, minHeight: 0, justifyContent: "center" }}>
        <Row
          scheme={scheme}
          copySide="left"
          height={408}
          copyWidth={392}
          screenWidth={564}
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
          height={350}
          copyWidth={368}
          screenWidth={588}
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
          height={342}
          copyWidth={392}
          screenWidth={564}
          eyebrow={ROW3.eyebrow}
          heading={ROW3.heading}
          headingSize={36}
          body={ROW3.body}
          bodySize={21}
          screen={() => <ExamScreen scheme={scheme} />}
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
// copy squeezed to a line each. What goes is the exam paper, because the
// alternating rhythm needs at least one swap to exist at all and the first
// swap is the tutor into the projection. The paper keeps its own full-size
// row in the portrait and story cuts, and it is the row that least
// tolerates being squeezed: a written-answer field that is not tall is a
// written-answer field nobody believes.
// ---------------------------------------------------------------------

function CardsSquare() {
  const scheme: AdScheme = "dark";
  return (
    <Artboard width={1080} height={1080} scheme={scheme} pad={40}>
      <AdEyebrow scheme={scheme} size={20}>
        For students
      </AdEyebrow>
      <Box sx={{ height: 24 }} />
      <Stack spacing="44px" sx={{ flex: 1, minHeight: 0, justifyContent: "center" }}>
        <Row
          scheme={scheme}
          copySide="left"
          height={452}
          copyWidth={398}
          screenWidth={558}
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
          screenWidth={586}
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
    <Artboard width={1080} height={1920} scheme={scheme} pad={36}>
      <Box sx={{ height: 140 }} />
      <AdEyebrow scheme={scheme} size={24}>
        For students
      </AdEyebrow>
      <Box sx={{ height: 30 }} />
      {/* Pad 36 rather than 48. The story is the cut with the most vertical
          air and the least horizontal, so it is the one where the side
          margins were costing the most: the 24px freed goes straight into the
          screens, and the projection row gets almost all of it. The top and
          bottom edges are unaffected in practice because the platform-safe
          spacers above and below are absolute, not derived from the pad. */}
      <Stack spacing="60px" sx={{ flex: 1, minHeight: 0, justifyContent: "center" }}>
        <Row
          scheme={scheme}
          copySide="left"
          height={490}
          copyWidth={396}
          screenWidth={568}
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
          copyWidth={370}
          screenWidth={594}
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
          copyWidth={396}
          screenWidth={568}
          eyebrow={ROW3.eyebrow}
          heading={ROW3.heading}
          headingSize={38}
          body={ROW3.body}
          screen={() => <ExamScreen scheme={scheme} />}
        />
      </Stack>
      <Box sx={{ height: 34 }} />
      <CardFooter scheme={scheme} size={32} />
      <Box sx={{ height: 140 }} />
    </Artboard>
  );
}

// ---------------------------------------------------------------------
// UNIT 4. The wide cut, 1350x1920, dark.
//
// WHY 1350x1920 AND NOT SOMETHING ELSE. The brief was "the entire image a bit
// wider", and the constraint is that the composition is a copy column beside
// a screen column, three times over, in a portrait frame. 1350x1920 is 45:64,
// which is a hair wider than 3:4 and a long way off the 9:16 the story cut
// is: wide enough that both columns get a real increase, tall enough that
// three unequal rows still have somewhere to go. 1350 is also the width every
// other portrait unit in the registry already uses as a HEIGHT, so nothing
// new entered the set of numbers this campaign is authored on.
//
// The two rejected alternatives, briefly. 1080x1350 turned on its side gives
// a landscape frame, and three stacked rows in a landscape frame are three
// letterbox strips: the screens would have to shrink vertically, and the exam
// paper is the row that already cannot lose height. 1200x1920 is only 120px
// wider than the story and spends all of it on margins nobody notices.
//
// WHERE THE EXTRA WIDTH GOES. Not evenly. The copy column takes about a fifth
// of it, which is enough for the headings to break where they want to rather
// than where the measure forces them, and the screen column takes the rest.
// The projection row is the largest beneficiary and it is meant to be: its
// 0-100 domain gets roughly 450px here against roughly 260 on the 1080 cuts,
// which is the difference between a one-mark move being three pixels and
// being nearly five.
//
// No platform-safe spacers on this one. A 45:64 image is not a story, so
// nothing is covering the top and bottom of it.
// ---------------------------------------------------------------------

function CardsWide() {
  const scheme: AdScheme = "dark";
  return (
    <Artboard width={1350} height={1920} scheme={scheme} pad={44}>
      <AdEyebrow scheme={scheme} size={24}>
        For students
      </AdEyebrow>
      <Box sx={{ height: 34 }} />
      <Stack spacing="64px" sx={{ flex: 1, minHeight: 0, justifyContent: "center" }}>
        <Row
          scheme={scheme}
          copySide="left"
          height={560}
          copyWidth={470}
          screenWidth={748}
          eyebrow={ROW1.eyebrow}
          heading={<Row1Heading size={52} />}
          headingSize={52}
          body={ROW1.body}
          bodySize={24}
          bullets={ROW1.bullets}
          glow
          screen={() => <TutorScreen scheme={scheme} />}
        />
        <Row
          scheme={scheme}
          copySide="right"
          height={470}
          copyWidth={442}
          screenWidth={776}
          eyebrow={ROW2.eyebrow}
          heading={ROW2.heading}
          headingSize={42}
          body={ROW2.body}
          bodySize={23}
          screen={() => <ProjectionScreen scheme={scheme} />}
        />
        <Row
          scheme={scheme}
          copySide="left"
          height={440}
          copyWidth={470}
          screenWidth={748}
          eyebrow={ROW3.eyebrow}
          heading={ROW3.heading}
          headingSize={42}
          body={ROW3.body}
          bodySize={23}
          screen={() => <ExamScreen scheme={scheme} />}
        />
      </Stack>
      <Box sx={{ height: 38 }} />
      <CardFooter scheme={scheme} size={32} />
    </Artboard>
  );
}

export const CARD_UNITS = {
  CardsPortrait,
  CardsSquare,
  CardsStory,
  CardsWide,
};
