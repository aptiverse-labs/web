"use client";

import { useEffect, useRef, useState } from "react";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import Popover from "@mui/material/Popover";
import Tooltip from "@mui/material/Tooltip";
import Skeleton from "@mui/material/Skeleton";
import MoreHorizIcon from "@mui/icons-material/MoreHorizOutlined";

// Aptiverse math editor — scientific-calculator style.
//
// The writing surface is MathLive's <math-field>, which renders real
// 2D maths as the student types (fractions stack, roots cover, integrals
// show bounds above/below). Critically: MathLive's own virtual keyboard
// is OFF (it's the part that looked terrible). Input comes from:
//   - the device's keyboard (physical on laptop, OS-native on phone)
//   - our toolbar, which inserts maths *structure* with empty slots
//     the student tabs into to fill in. Tap [∫] → see ∫□^□ □ appear
//     with the cursor in the lower-bound box.
//
// What gets stored is LaTeX (MathLive's native format), but the student
// never sees it — they see the rendered maths.

type Template = {
  label: string;     // glyph on the button
  latex: string;     // what to insert (MathLive's #? syntax = empty slot)
  hint?: string;
};

const PRIMARY: Template[] = [
  { label: "a⁄b",  latex: "\\frac{#?}{#?}",                   hint: "Fraction" },
  { label: "√",    latex: "\\sqrt{#?}",                        hint: "Square root" },
  { label: "xⁿ",   latex: "^{#?}",                             hint: "Power / exponent" },
  { label: "xₙ",   latex: "_{#?}",                             hint: "Subscript" },
  { label: "( )",  latex: "\\left(#?\\right)",                 hint: "Auto-sized brackets" },
  { label: "π",    latex: "\\pi",                              hint: "Pi" },
];

const MORE_GROUPS: { title: string; items: Template[] }[] = [
  {
    title: "Calculus & stats",
    items: [
      { label: "∫",    latex: "\\int_{#?}^{#?} #?",                hint: "Definite integral" },
      { label: "Σ",    latex: "\\sum_{#?}^{#?} #?",                hint: "Summation with bounds" },
      { label: "lim",  latex: "\\lim_{#?} #?",                     hint: "Limit" },
      { label: "ⁿ√",   latex: "\\sqrt[#?]{#?}",                    hint: "nth root" },
      { label: "x̄",    latex: "\\bar{#?}",                          hint: "Mean" },
      { label: "x̂",    latex: "\\hat{#?}",                          hint: "Estimator" },
    ],
  },
  {
    title: "Operators",
    items: [
      { label: "×",   latex: "\\times"  },
      { label: "÷",   latex: "\\div"    },
      { label: "±",   latex: "\\pm"     },
      { label: "·",   latex: "\\cdot"   },
      { label: "≈",   latex: "\\approx" },
      { label: "≤",   latex: "\\le"     },
      { label: "≥",   latex: "\\ge"     },
      { label: "≠",   latex: "\\ne"     },
      { label: "→",   latex: "\\to"     },
      { label: "∞",   latex: "\\infty"  },
    ],
  },
  {
    title: "Greek",
    items: [
      { label: "α",   latex: "\\alpha"  },
      { label: "β",   latex: "\\beta"   },
      { label: "θ",   latex: "\\theta"  },
      { label: "λ",   latex: "\\lambda" },
      { label: "μ",   latex: "\\mu"     },
      { label: "Δ",   latex: "\\Delta"  },
      { label: "Σ",   latex: "\\Sigma"  },
      { label: "Ω",   latex: "\\Omega"  },
    ],
  },
];

// MathLive loader — fonts + keyboard policy set once on first import.
let registerPromise: Promise<void> | null = null;
function ensureMathLive(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (registerPromise) return registerPromise;
  registerPromise = import("mathlive").then((mod) => {
    type Globals = { MathfieldElement?: { fontsDirectory: string } };
    const g = mod as unknown as Globals;
    if (g.MathfieldElement) {
      g.MathfieldElement.fontsDirectory = "/mathlive-fonts";
    }
  });
  return registerPromise;
}

// Minimal type surface for the <math-field> element we actually use.
// Avoids pulling in MathLive's full ambient declarations.
type MathFieldEl = HTMLElement & {
  value: string;
  insert: (latex: string, options?: { selectionMode?: "placeholder" | "after" | "before" }) => void;
  focus: () => void;
};

type Props = {
  value: string;
  onChange: (latex: string) => void;
};

export function MathEditor({ value, onChange }: Props) {
  const hostRef = useRef<HTMLDivElement>(null);
  const fieldRef = useRef<MathFieldEl | null>(null);
  const onChangeRef = useRef(onChange);
  // Last value we emitted via onChange. We use this to detect when
  // the incoming `value` prop is just our own echo (parent updated
  // state and re-rendered) vs. a genuinely external change (assessment
  // switched, server normalised the LaTeX). Without this guard every
  // keystroke would round-trip through state and we'd write the value
  // back into the field mid-typing — re-parsing, re-rendering, jumping
  // the cursor. Classic controlled-imperative editor pitfall.
  const lastEmittedRef = useRef<string>(value);
  const [ready, setReady] = useState(false);
  const [moreEl, setMoreEl] = useState<HTMLElement | null>(null);

  useEffect(() => { onChangeRef.current = onChange; }, [onChange]);

  // Mount the math-field once MathLive has loaded.
  useEffect(() => {
    let cancelled = false;
    let cleanup: (() => void) | undefined;

    ensureMathLive().then(() => {
      if (cancelled || !hostRef.current || fieldRef.current) return;
      const host = hostRef.current;
      const field = document.createElement("math-field") as MathFieldEl;
      // Critically: NO virtual keyboard. Students use their device's
      // native keyboard plus our toolbar. The MathLive virtual keyboard
      // is the bit that looked terrible.
      field.setAttribute("math-virtual-keyboard-policy", "off");
      field.setAttribute("smart-mode", "true");
      field.value = value;
      lastEmittedRef.current = value;

      const onInput = () => {
        const v = field.value;
        lastEmittedRef.current = v;
        onChangeRef.current(v);
      };
      field.addEventListener("input", onInput);

      host.appendChild(field);
      fieldRef.current = field;
      setReady(true);

      cleanup = () => {
        field.removeEventListener("input", onInput);
        if (field.parentNode === host) host.removeChild(field);
        fieldRef.current = null;
      };
    });

    return () => { cancelled = true; cleanup?.(); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync external value changes back into the field. Skip:
  //   1. Our own echo (incoming value === last value we emitted)
  //   2. While the field is focused (user is mid-typing; never disrupt)
  // Together these stop the "characters get re-added" jitter while
  // still picking up legitimate external changes (assessment switch,
  // undo from elsewhere) when the field isn't focused.
  useEffect(() => {
    const f = fieldRef.current;
    if (!f) return;
    if (value === lastEmittedRef.current) return;
    if (typeof document !== "undefined") {
      const active = document.activeElement;
      if (active === f || f.contains(active as Node | null)) return;
    }
    if (f.value !== value) {
      f.value = value;
      lastEmittedRef.current = value;
    }
  }, [value]);

  const insertTemplate = (tpl: Template) => {
    const f = fieldRef.current;
    if (!f) return;
    // selectionMode 'placeholder' lands the cursor inside the first
    // empty slot (the first `#?`) — the scientific-calculator
    // behaviour the user asked for.
    f.insert(tpl.latex, { selectionMode: "placeholder" });
    f.focus();
  };

  return (
    <Stack spacing={1.5}>
      <Toolbar onInsert={insertTemplate} onMore={(e) => setMoreEl(e.currentTarget)} />

      <MathFieldFrame hostRef={hostRef} loading={!ready} />

      <MorePopover
        anchorEl={moreEl}
        onClose={() => setMoreEl(null)}
        onInsert={(tpl) => {
          setMoreEl(null);
          insertTemplate(tpl);
        }}
      />
    </Stack>
  );
}

// ─── The math-field itself, styled minimally ─────────────────────────

function MathFieldFrame({
  hostRef,
  loading,
}: {
  hostRef: React.RefObject<HTMLDivElement | null>;
  loading: boolean;
}) {
  return (
    <Box sx={{ position: "relative", minHeight: 240 }}>
      {loading && (
        <Box sx={{ position: "absolute", inset: 0 }}>
          <Skeleton variant="rounded" height={240} />
        </Box>
      )}
      <Box
        ref={hostRef}
        sx={(t) => ({
          "& math-field": {
            display: "block",
            width: "100%",
            minHeight: 240,
            padding: "16px 18px",
            border: 1,
            borderColor: "divider",
            borderRadius: 1,
            backgroundColor: "background.paper",
            color: "text.primary",
            fontSize: "1.1rem",
            lineHeight: 1.7,
            "--primary":                       t.palette.primary.main,
            "--caret-color":                   t.palette.primary.main,
            "--text-color":                    t.palette.text.primary,
            "--placeholder-color":             t.palette.text.disabled,
            "--placeholder-opacity":           "1",
            "--smart-fence-color":             t.palette.text.secondary,
            "--smart-fence-opacity":           "0.6",
            "--correct-color":                 t.palette.success.main,
            "--incorrect-color":               t.palette.error.main,
            "--selection-background-color":
              t.palette.mode === "dark"
                ? "rgba(116,181,174,0.30)"
                : "rgba(15,105,99,0.18)",
            "--selection-color":               t.palette.text.primary,
            "--contains-highlight-background-color":
              t.palette.mode === "dark"
                ? "rgba(255,255,255,0.04)"
                : "rgba(0,0,0,0.03)",
            "&:focus-within": {
              borderColor: "primary.main",
              outline: "none",
            },
          },
        })}
      />
    </Box>
  );
}

// ─── Toolbar ─────────────────────────────────────────────────────────

function Toolbar({
  onInsert,
  onMore,
}: {
  onInsert: (tpl: Template) => void;
  onMore: (e: React.MouseEvent<HTMLElement>) => void;
}) {
  return (
    <Stack
      direction="row"
      spacing={0.75}
      sx={{
        overflowX: "auto",
        pb: 0.5,
        scrollbarWidth: "none",
        "&::-webkit-scrollbar": { display: "none" },
      }}
    >
      {PRIMARY.map((tpl) => (
        <ToolButton key={tpl.latex} template={tpl} onInsert={onInsert} />
      ))}
      <Box sx={{ flex: 1 }} />
      <Tooltip title="More symbols">
        <IconButton
          onMouseDown={(e) => e.preventDefault()}
          onClick={onMore}
          aria-label="More symbols"
          sx={{
            height: 44,
            width: 44,
            borderRadius: 1,
            border: 1,
            borderColor: "divider",
            color: "text.secondary",
            flexShrink: 0,
            "&:hover": { borderColor: "primary.main", color: "primary.main", bgcolor: "transparent" },
          }}
        >
          <MoreHorizIcon />
        </IconButton>
      </Tooltip>
    </Stack>
  );
}

function ToolButton({
  template,
  onInsert,
}: {
  template: Template;
  onInsert: (tpl: Template) => void;
}) {
  return (
    <Tooltip title={template.hint ?? template.label}>
      <IconButton
        // Prevent the button taking focus and stealing the caret from
        // the math-field — keeps the insert landing in the right place.
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => onInsert(template)}
        aria-label={template.hint ?? template.label}
        sx={{
          height: 44,
          minWidth: 44,
          px: 1.5,
          borderRadius: 1,
          border: 1,
          borderColor: "divider",
          color: "text.primary",
          fontFamily: "ui-monospace, 'SF Mono', Menlo, monospace",
          fontSize: "1rem",
          fontWeight: 500,
          flexShrink: 0,
          "&:hover": { borderColor: "primary.main", color: "primary.main", bgcolor: "transparent" },
        }}
      >
        {template.label}
      </IconButton>
    </Tooltip>
  );
}

function MorePopover({
  anchorEl,
  onClose,
  onInsert,
}: {
  anchorEl: HTMLElement | null;
  onClose: () => void;
  onInsert: (tpl: Template) => void;
}) {
  return (
    <Popover
      open={!!anchorEl}
      anchorEl={anchorEl}
      onClose={onClose}
      anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      transformOrigin={{ vertical: "top", horizontal: "right" }}
      slotProps={{ paper: { sx: { p: 2, width: { xs: 280, sm: 340 } } } }}
    >
      <Stack spacing={2}>
        {MORE_GROUPS.map((group) => (
          <Box key={group.title}>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{
                letterSpacing: "0.06em",
                fontWeight: 600,
                textTransform: "uppercase",
                mb: 0.75,
                display: "block",
              }}
            >
              {group.title}
            </Typography>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(44px, 1fr))",
                gap: 0.5,
              }}
            >
              {group.items.map((tpl) => (
                <ToolButton key={tpl.latex} template={tpl} onInsert={onInsert} />
              ))}
            </Box>
          </Box>
        ))}
      </Stack>
    </Popover>
  );
}
