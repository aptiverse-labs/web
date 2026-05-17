"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import Tooltip from "@mui/material/Tooltip";
import useMediaQuery from "@mui/material/useMediaQuery";
import { useTheme } from "@mui/material/styles";

// Aptiverse-built math editor.
//
// Design: LaTeX source on the writing surface, KaTeX-rendered preview
// below. Real 2D maths in the preview (fractions stack, roots cover
// their argument, integrals have bounds) without the WYSIWYG editor
// surface that's hard to make good. Students type in source, see real
// maths in preview.
//
// Why this and not a custom WYSIWYG editor: 2D tree-cursor editing is
// a months-long project. A textual source view is something every
// student already knows how to use (it's a phone keyboard typing
// text); KaTeX handles the hard part (rendering). The toolbar smooths
// over LaTeX syntax for the cases students reach for most — fractions,
// square roots, exponents, common Greek.
//
// Storage: the LaTeX source is just plain text — saves into the
// existing `scratchpad` draft column without schema changes.

type Template = {
  label: string;             // visible glyph on the button
  insert: string;            // text to insert
  caretOffset?: number;      // where to put the caret after insert (default = end)
  hint?: string;             // hover/long-press hint
};

// First row: the universal-most useful templates — fractions, roots,
// exponents, subscripts. Each places the caret inside the first slot.
const PRIMARY: Template[] = [
  { label: "a/b",   insert: "\\frac{}{}",            caretOffset: 6,  hint: "Fraction" },
  { label: "√",     insert: "\\sqrt{}",              caretOffset: 6,  hint: "Square root" },
  { label: "ⁿ√",    insert: "\\sqrt[]{}",            caretOffset: 6,  hint: "nth root (cursor in index)" },
  { label: "x²",    insert: "^{}",                   caretOffset: 2,  hint: "Superscript / power" },
  { label: "x₂",    insert: "_{}",                   caretOffset: 2,  hint: "Subscript" },
  { label: "( )",   insert: "\\left(\\right)",       caretOffset: 6,  hint: "Auto-sized parentheses" },
];

const OPERATORS: Template[] = [
  { label: "×",   insert: "\\times "                  },
  { label: "÷",   insert: "\\div "                    },
  { label: "±",   insert: "\\pm "                     },
  { label: "≈",   insert: "\\approx "                 },
  { label: "≤",   insert: "\\le "                     },
  { label: "≥",   insert: "\\ge "                     },
  { label: "≠",   insert: "\\ne "                     },
  { label: "→",   insert: "\\to "                     },
];

const GREEK: Template[] = [
  { label: "π",   insert: "\\pi "      },
  { label: "θ",   insert: "\\theta "   },
  { label: "Δ",   insert: "\\Delta "   },
  { label: "Σ",   insert: "\\Sigma "   },
  { label: "α",   insert: "\\alpha "   },
  { label: "β",   insert: "\\beta "    },
  { label: "λ",   insert: "\\lambda "  },
  { label: "μ",   insert: "\\mu "      },
];

const CALCULUS: Template[] = [
  { label: "∫",     insert: "\\int_{}^{} ",       caretOffset: 6,  hint: "Definite integral" },
  { label: "Σ",     insert: "\\sum_{}^{} ",       caretOffset: 6,  hint: "Summation" },
  { label: "lim",   insert: "\\lim_{} ",          caretOffset: 6,  hint: "Limit" },
  { label: "d/dx",  insert: "\\frac{d}{dx}",                       hint: "Derivative" },
  { label: "∞",     insert: "\\infty "             },
];

type ViewMode = "split" | "preview" | "source";

type Props = {
  value: string;
  onChange: (latex: string) => void;
};

export function MathEditor({ value, onChange }: Props) {
  const theme = useTheme();
  const isPhone = useMediaQuery(theme.breakpoints.down("sm"));
  const [mode, setMode] = useState<ViewMode>(isPhone ? "source" : "split");
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  // Auto-switch to source mode on phones — split is cramped under
  // 600px wide. Desktop users start in split so they see the math
  // render as they type.
  useEffect(() => {
    setMode(isPhone ? "source" : "split");
  }, [isPhone]);

  const insert = (tpl: Template) => {
    const el = textareaRef.current;
    if (!el) {
      const next = value + tpl.insert;
      onChange(next);
      return;
    }
    const start = el.selectionStart ?? value.length;
    const end = el.selectionEnd ?? value.length;
    const next = value.slice(0, start) + tpl.insert + value.slice(end);
    onChange(next);
    // Position the caret after the insert. caretOffset of N means
    // "place caret N chars into the inserted string" — used to land
    // the user inside the first empty slot of a template (`\frac{|}{}`).
    const caretPos = start + (tpl.caretOffset ?? tpl.insert.length);
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(caretPos, caretPos);
    });
  };

  return (
    <Stack spacing={1.5}>
      <Toolbar onInsert={insert} />

      <Stack
        direction="row"
        alignItems="center"
        justifyContent="flex-end"
        sx={{ display: { xs: "none", sm: "flex" } }}
      >
        <ToggleButtonGroup
          value={mode}
          exclusive
          size="small"
          onChange={(_, v: ViewMode | null) => v && setMode(v)}
          sx={{ "& .MuiToggleButton-root": { px: 1.5, py: 0.5, fontSize: "0.75rem", textTransform: "none" } }}
        >
          <ToggleButton value="source">Source</ToggleButton>
          <ToggleButton value="split">Split</ToggleButton>
          <ToggleButton value="preview">Preview</ToggleButton>
        </ToggleButtonGroup>
      </Stack>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: mode === "split" ? { sm: "1fr 1fr" } : "1fr",
          gridTemplateRows: mode === "split" && isPhone ? "auto auto" : "auto",
          gap: 2,
        }}
      >
        {(mode === "source" || mode === "split") && (
          <SourcePane
            value={value}
            onChange={onChange}
            textareaRef={textareaRef}
          />
        )}
        {(mode === "preview" || mode === "split") && (
          <PreviewPane value={value} />
        )}
      </Box>
    </Stack>
  );
}

// ─── Toolbar ─────────────────────────────────────────────────────────

function Toolbar({ onInsert }: { onInsert: (tpl: Template) => void }) {
  return (
    <Stack spacing={0.5}>
      <ToolbarRow groups={[PRIMARY]} onInsert={onInsert} />
      <Box sx={{ display: { xs: "none", sm: "block" } }}>
        <ToolbarRow groups={[OPERATORS, GREEK, CALCULUS]} onInsert={onInsert} />
      </Box>
      {/* On mobile the secondary rows live behind a "More" toggle so
          the toolbar doesn't dominate the screen. */}
      <Box sx={{ display: { xs: "block", sm: "none" } }}>
        <MobileMore groups={[OPERATORS, GREEK, CALCULUS]} onInsert={onInsert} />
      </Box>
    </Stack>
  );
}

function ToolbarRow({
  groups,
  onInsert,
}: {
  groups: Template[][];
  onInsert: (tpl: Template) => void;
}) {
  return (
    <Box
      role="toolbar"
      sx={{
        display: "flex",
        gap: 0.5,
        overflowX: "auto",
        scrollbarWidth: "none",
        "&::-webkit-scrollbar": { display: "none" },
      }}
    >
      {groups.map((group, gi) => (
        <Stack key={gi} direction="row" spacing={0.5}>
          {group.map((tpl) => (
            <ToolButton key={`${tpl.label}-${tpl.insert}`} template={tpl} onInsert={onInsert} />
          ))}
          {gi < groups.length - 1 && (
            <Box
              sx={{
                alignSelf: "stretch",
                width: 1,
                bgcolor: "divider",
                mx: 0.5,
              }}
            />
          )}
        </Stack>
      ))}
    </Box>
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
      <Button
        onMouseDown={(e) => e.preventDefault()} // keep caret in the textarea
        onClick={() => onInsert(template)}
        variant="outlined"
        size="small"
        sx={{
          minWidth: 44,
          height: 36,
          px: 1,
          color: "text.primary",
          borderColor: "divider",
          fontFamily: "ui-monospace, 'SF Mono', Menlo, monospace",
          fontSize: "0.85rem",
          fontWeight: 500,
          flexShrink: 0,
          textTransform: "none",
          "&:hover": { borderColor: "primary.main", bgcolor: "transparent" },
        }}
      >
        {template.label}
      </Button>
    </Tooltip>
  );
}

function MobileMore({
  groups,
  onInsert,
}: {
  groups: Template[][];
  onInsert: (tpl: Template) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <Stack spacing={0.5}>
      <IconButton
        onClick={() => setOpen((v) => !v)}
        size="small"
        sx={{ alignSelf: "flex-start", color: "text.secondary" }}
        aria-label={open ? "Hide more symbols" : "Show more symbols"}
      >
        <Typography variant="caption" sx={{ fontWeight: 600, letterSpacing: "0.06em" }}>
          {open ? "− Less" : "+ More symbols"}
        </Typography>
      </IconButton>
      {open && <ToolbarRow groups={groups} onInsert={onInsert} />}
    </Stack>
  );
}

// ─── Panes ──────────────────────────────────────────────────────────

function SourcePane({
  value,
  onChange,
  textareaRef,
}: {
  value: string;
  onChange: (v: string) => void;
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
}) {
  return (
    <Stack spacing={0.5}>
      <Typography variant="caption" color="text.secondary" sx={{ letterSpacing: "0.06em", fontWeight: 600 }}>
        SOURCE
      </Typography>
      <TextField
        fullWidth
        multiline
        minRows={10}
        inputRef={textareaRef}
        placeholder={
          "Type LaTeX or use the toolbar.\n" +
          "Examples: \\frac{1}{2}, \\sqrt{x+1}, x^2 + 3x = 0"
        }
        value={value}
        onChange={(e) => onChange(e.target.value)}
        sx={{
          "& textarea": {
            fontFamily: "ui-monospace, 'SF Mono', Menlo, monospace",
            fontSize: "0.95rem",
            lineHeight: 1.6,
          },
        }}
      />
    </Stack>
  );
}

function PreviewPane({ value }: { value: string }) {
  return (
    <Stack spacing={0.5}>
      <Typography variant="caption" color="text.secondary" sx={{ letterSpacing: "0.06em", fontWeight: 600 }}>
        PREVIEW
      </Typography>
      <Box
        sx={{
          minHeight: 240,
          border: 1,
          borderColor: "divider",
          borderRadius: 1,
          p: 2.5,
          bgcolor: (t) =>
            t.palette.mode === "dark"
              ? "rgba(255,255,255,0.02)"
              : "rgba(0,0,0,0.02)",
          overflowX: "auto",
        }}
      >
        <KatexRender source={value} />
      </Box>
    </Stack>
  );
}

// ─── KaTeX render ────────────────────────────────────────────────────

function KatexRender({ source }: { source: string }) {
  const [katexMod, setKatexMod] = useState<typeof import("katex") | null>(null);
  const [cssLoaded, setCssLoaded] = useState(false);

  // Lazy-load KaTeX so it doesn't ship on pages that don't render math.
  // The CSS is needed for fonts; load it once globally via a <link>
  // injected on first render.
  useEffect(() => {
    let cancelled = false;
    import("katex").then((m) => {
      if (!cancelled) setKatexMod(m);
    });
    // Inject the CSS once.
    if (typeof window !== "undefined" && !document.getElementById("aptiverse-katex-css")) {
      const link = document.createElement("link");
      link.id = "aptiverse-katex-css";
      link.rel = "stylesheet";
      link.href = "https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.css";
      link.onload = () => setCssLoaded(true);
      document.head.appendChild(link);
    } else {
      setCssLoaded(true);
    }
    return () => { cancelled = true; };
  }, []);

  const rendered = useMemo(() => {
    if (!katexMod) return { html: "", error: null as string | null };
    const trimmed = source.trim();
    if (!trimmed) return { html: "", error: null };
    try {
      // Render each non-empty line as its own display equation. Lets a
      // student stack working line-by-line without writing a single
      // long expression. Lines that are pure prose (no backslash, no
      // operators) render as plain paragraphs.
      const lines = trimmed.split(/\n/);
      const blocks: string[] = [];
      for (const line of lines) {
        const t = line.trim();
        if (!t) {
          blocks.push("<br />");
          continue;
        }
        if (looksLikeProse(t)) {
          blocks.push(`<p style="margin:0 0 0.6em 0;">${escapeHtml(t)}</p>`);
          continue;
        }
        const html = katexMod.default.renderToString(t, {
          displayMode: true,
          throwOnError: false,
          errorColor: "#A8632F",
        });
        blocks.push(`<div style="margin:0 0 0.4em 0;">${html}</div>`);
      }
      return { html: blocks.join(""), error: null };
    } catch (err) {
      return { html: "", error: err instanceof Error ? err.message : "Render failed" };
    }
  }, [source, katexMod]);

  if (!katexMod || !cssLoaded) {
    return (
      <Typography variant="body2" color="text.secondary">
        Loading preview…
      </Typography>
    );
  }
  if (!source.trim()) {
    return (
      <Typography variant="body2" color="text.disabled">
        Your equations will appear here as you type.
      </Typography>
    );
  }
  if (rendered.error) {
    return (
      <Typography variant="body2" color="error.main" sx={{ fontFamily: "ui-monospace, Menlo, monospace" }}>
        {rendered.error}
      </Typography>
    );
  }

  return (
    <Box
      sx={{
        color: "text.primary",
        // KaTeX renders display-mode equations centered by default; we
        // want them left-aligned to match the source pane reading order.
        "& .katex-display": { textAlign: "left", margin: 0 },
      }}
      dangerouslySetInnerHTML={{ __html: rendered.html }}
    />
  );
}

function looksLikeProse(line: string): boolean {
  // No backslash, no math operators, no equals, no leading digit, no
  // common math glyphs → treat as prose. Cheap heuristic; false
  // positives (e.g. plain word problems) render as text which is
  // honest, not as broken math.
  if (line.includes("\\")) return false;
  if (/[=+\-*/^_]/.test(line)) return false;
  if (/^[\d]/.test(line)) return false;
  return /^[A-Za-z][A-Za-z\s,.;:!?'"]+$/.test(line);
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
