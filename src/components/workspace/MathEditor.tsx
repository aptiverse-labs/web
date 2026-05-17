"use client";

import { useEffect, useRef, useState } from "react";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import Popover from "@mui/material/Popover";
import Tooltip from "@mui/material/Tooltip";
import Skeleton from "@mui/material/Skeleton";
import Button from "@mui/material/Button";
import MoreHorizIcon from "@mui/icons-material/MoreHorizOutlined";
import AddIcon from "@mui/icons-material/AddOutlined";
import CloseIcon from "@mui/icons-material/CloseOutlined";
import { motion, AnimatePresence } from "framer-motion";

// Aptiverse math editor — one line, one math-field.
//
// The student's working is a stack of math-fields, one per line. Each
// renders real 2D maths WYSIWYG (fractions stack, roots cover, integrals
// show bounds). Hitting Enter inside a field creates a new field below
// and focuses it; hitting Backspace at the start of an empty field
// removes that line and focuses the previous one. The toolbar inserts
// structure templates (with empty slots the student tabs into) into
// whichever line is currently focused — like keys on a scientific
// calculator.
//
// Why one field per line rather than one field with multi-line content:
// MathLive supports multi-row content within a single field but it
// renders the lines stacked with a single shared editing surface — the
// student felt like they were inside one expression that just happened
// to wrap. Per-line fields read as a working stack the way a paper page
// does.
//
// Storage: lines joined with newlines into the existing scratchpad
// draft column. MathLive's value never contains a literal newline so
// the separator is unambiguous.

type Template = {
  label: string;
  latex: string;
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

type MathFieldEl = HTMLElement & {
  value: string;
  insert: (latex: string, options?: { selectionMode?: "placeholder" | "after" | "before" }) => void;
  focus: () => void;
  selectionIsCollapsed?: boolean;
};

type Props = {
  value: string;
  onChange: (latex: string) => void;
};

// Parse storage back to an array of LaTeX lines. Empty / undefined →
// a single empty line so the editor always has at least one input.
function parseLines(raw: string): string[] {
  if (!raw) return [""];
  const lines = raw.split(/\n/);
  return lines.length === 0 ? [""] : lines;
}

function serializeLines(lines: string[]): string {
  // Trim trailing empty lines so a series of accidental Enters at the
  // end doesn't bloat the persisted value, but keep internal empties
  // (a student can intentionally leave a blank line between sections).
  const trimmed = [...lines];
  while (trimmed.length > 1 && trimmed[trimmed.length - 1] === "") trimmed.pop();
  return trimmed.join("\n");
}

export function MathEditor({ value, onChange }: Props) {
  const lines = parseLines(value);
  const fieldsRef = useRef<(MathFieldEl | null)[]>([]);
  const focusedIdxRef = useRef<number>(0);
  const [moreEl, setMoreEl] = useState<HTMLElement | null>(null);

  // Pending focus: after we add a line, focus it on next paint.
  const pendingFocusRef = useRef<number | null>(null);
  useEffect(() => {
    if (pendingFocusRef.current === null) return;
    const idx = pendingFocusRef.current;
    pendingFocusRef.current = null;
    requestAnimationFrame(() => {
      fieldsRef.current[idx]?.focus();
    });
  });

  const setLines = (next: string[]) => {
    // Keep fieldsRef length in sync with the new lines length.
    fieldsRef.current = next.map((_, i) => fieldsRef.current[i] ?? null);
    onChange(serializeLines(next));
  };

  const updateLine = (i: number, v: string) => {
    if (lines[i] === v) return;
    const next = lines.map((l, idx) => (idx === i ? v : l));
    setLines(next);
  };

  const insertLineAfter = (i: number, initial = "") => {
    const next = [...lines.slice(0, i + 1), initial, ...lines.slice(i + 1)];
    pendingFocusRef.current = i + 1;
    setLines(next);
  };

  const removeLine = (i: number) => {
    if (lines.length === 1) {
      // Last line — just clear it instead of unmounting the only field.
      if (lines[0] !== "") setLines([""]);
      return;
    }
    const next = lines.filter((_, idx) => idx !== i);
    pendingFocusRef.current = Math.max(0, i - 1);
    setLines(next);
  };

  // Toolbar inserts into whichever line was last focused.
  const insertTemplate = (tpl: Template) => {
    const f = fieldsRef.current[focusedIdxRef.current];
    if (!f) return;
    f.insert(tpl.latex, { selectionMode: "placeholder" });
    f.focus();
  };

  return (
    <Stack spacing={1.5}>
      <Toolbar onInsert={insertTemplate} onMore={(e) => setMoreEl(e.currentTarget)} />

      <Stack spacing={0.75}>
        <AnimatePresence initial={false}>
          {lines.map((line, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ type: "spring", stiffness: 380, damping: 32 }}
              style={{ overflow: "hidden" }}
            >
              <MathLine
                index={i}
                value={line}
                onChange={(v) => updateLine(i, v)}
                onEnter={() => insertLineAfter(i)}
                onBackspaceAtStart={() => removeLine(i)}
                onFocus={() => { focusedIdxRef.current = i; }}
                registerField={(f) => { fieldsRef.current[i] = f; }}
                showRemove={lines.length > 1}
                onRemoveClick={() => removeLine(i)}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </Stack>

      <Button
        onClick={() => insertLineAfter(lines.length - 1)}
        startIcon={<AddIcon fontSize="small" />}
        variant="text"
        size="small"
        sx={{ alignSelf: "flex-start", color: "text.secondary", textTransform: "none" }}
      >
        Add line
      </Button>

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

// ─── One math-field line ─────────────────────────────────────────────

type LineProps = {
  index: number;
  value: string;
  onChange: (v: string) => void;
  onEnter: () => void;
  onBackspaceAtStart: () => void;
  onFocus: () => void;
  registerField: (f: MathFieldEl | null) => void;
  showRemove: boolean;
  onRemoveClick: () => void;
};

function MathLine({
  index,
  value,
  onChange,
  onEnter,
  onBackspaceAtStart,
  onFocus,
  registerField,
  showRemove,
  onRemoveClick,
}: LineProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const fieldRef = useRef<MathFieldEl | null>(null);
  const onChangeRef = useRef(onChange);
  const onEnterRef = useRef(onEnter);
  const onBackspaceRef = useRef(onBackspaceAtStart);
  const onFocusRef = useRef(onFocus);
  const lastEmittedRef = useRef<string>(value);
  const [ready, setReady] = useState(false);

  useEffect(() => { onChangeRef.current = onChange; }, [onChange]);
  useEffect(() => { onEnterRef.current = onEnter; }, [onEnter]);
  useEffect(() => { onBackspaceRef.current = onBackspaceAtStart; }, [onBackspaceAtStart]);
  useEffect(() => { onFocusRef.current = onFocus; }, [onFocus]);

  useEffect(() => {
    let cancelled = false;
    let cleanup: (() => void) | undefined;

    ensureMathLive().then(() => {
      if (cancelled || !hostRef.current || fieldRef.current) return;
      const host = hostRef.current;
      const field = document.createElement("math-field") as MathFieldEl;
      field.setAttribute("math-virtual-keyboard-policy", "off");
      field.setAttribute("smart-mode", "true");
      field.value = value;
      lastEmittedRef.current = value;

      const onInput = () => {
        const v = field.value;
        lastEmittedRef.current = v;
        onChangeRef.current(v);
      };
      const onFocusHandler = () => onFocusRef.current();
      const onKey = (e: KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
          // Hijack Enter — instead of stacking a row inside this
          // math-field, ask the parent to create a new field below.
          e.preventDefault();
          e.stopPropagation();
          onEnterRef.current();
          return;
        }
        if (e.key === "Backspace") {
          // Backspace at the start of an empty field removes the line.
          // Empty-check: MathLive renders empty fields as a single
          // placeholder; checking .value catches both empty string and
          // an unedited placeholder.
          if (field.value === "") {
            e.preventDefault();
            e.stopPropagation();
            onBackspaceRef.current();
          }
        }
      };

      field.addEventListener("input", onInput);
      field.addEventListener("focus", onFocusHandler);
      field.addEventListener("keydown", onKey);

      host.appendChild(field);
      fieldRef.current = field;
      registerField(field);
      setReady(true);

      cleanup = () => {
        field.removeEventListener("input", onInput);
        field.removeEventListener("focus", onFocusHandler);
        field.removeEventListener("keydown", onKey);
        if (field.parentNode === host) host.removeChild(field);
        fieldRef.current = null;
        registerField(null);
      };
    });

    return () => { cancelled = true; cleanup?.(); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync external value changes back in — same controlled-imperative
  // guard as the single-field editor: skip our own echo and skip while
  // the field is focused.
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

  return (
    <Box
      sx={{
        position: "relative",
        "&:hover .line-remove": { opacity: 1 },
      }}
    >
      <Box sx={{ position: "relative", minHeight: 56 }}>
        {!ready && (
          <Box sx={{ position: "absolute", inset: 0 }}>
            <Skeleton variant="rounded" height={56} />
          </Box>
        )}
        <Box
          ref={hostRef}
          sx={(t) => ({
            "& math-field": {
              display: "block",
              width: "100%",
              minHeight: 56,
              padding: "12px 16px",
              border: 1,
              borderColor: "divider",
              borderRadius: 1,
              backgroundColor: "background.paper",
              color: "text.primary",
              fontSize: "1.05rem",
              lineHeight: 1.6,
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
      {showRemove && (
        <IconButton
          className="line-remove"
          size="small"
          onMouseDown={(e) => e.preventDefault()}
          onClick={onRemoveClick}
          aria-label={`Remove line ${index + 1}`}
          sx={{
            position: "absolute",
            top: 8,
            right: 8,
            opacity: 0,
            transition: "opacity 150ms ease",
            color: "text.secondary",
            "&:focus-visible": { opacity: 1 },
          }}
        >
          <CloseIcon fontSize="small" />
        </IconButton>
      )}
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
