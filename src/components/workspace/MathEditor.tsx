"use client";

import "katex/dist/katex.min.css";

import { useEffect, useMemo, useRef, useState } from "react";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import IconButton from "@mui/material/IconButton";
import Popover from "@mui/material/Popover";
import Tooltip from "@mui/material/Tooltip";
import MoreHorizIcon from "@mui/icons-material/MoreHorizOutlined";
import { CollapsibleSection } from "@/components/common/CollapsibleSection";

// Aptiverse math editor.
//
// One surface: toolbar → input → rendered preview, all visible.
// Students type LaTeX (or tap a template button) and see real 2D
// maths render below each line. No modes, no panes — the simplest
// arrangement that earns its space.
//
// Why not WYSIWYG: tree-cursor 2D editing is a months-long project
// and the wrong bet at zero users. Textual input + KaTeX rendering
// gives them real maths output without that complexity.

type Template = {
  label: string;        // glyph on the button
  insert: string;       // LaTeX to insert
  caret?: number;       // chars from start of insert where caret lands
  hint?: string;        // tooltip text
};

// Six templates a student reaches for on every page of NSC working.
// Anything beyond these lives in the More popover so the toolbar
// stays compact on a phone.
const PRIMARY: Template[] = [
  { label: "a⁄b",  insert: "\\frac{}{}",         caret: 6,  hint: "Fraction" },
  { label: "√",    insert: "\\sqrt{}",           caret: 6,  hint: "Square root" },
  { label: "xⁿ",   insert: "^{}",                caret: 2,  hint: "Power / exponent" },
  { label: "xₙ",   insert: "_{}",                caret: 2,  hint: "Subscript" },
  { label: "( )",  insert: "\\left(\\right)",    caret: 6,  hint: "Auto-sized brackets" },
  { label: "π",    insert: "\\pi ",                          hint: "Pi" },
];

// "More" popover — organised by intent so the student finds what
// they need without scanning a flat 30-item grid.
const MORE_GROUPS: { title: string; items: Template[] }[] = [
  {
    title: "Operators",
    items: [
      { label: "×",   insert: "\\times "  },
      { label: "÷",   insert: "\\div "    },
      { label: "±",   insert: "\\pm "     },
      { label: "·",   insert: "\\cdot "   },
      { label: "≈",   insert: "\\approx " },
      { label: "≤",   insert: "\\le "     },
      { label: "≥",   insert: "\\ge "     },
      { label: "≠",   insert: "\\ne "     },
      { label: "→",   insert: "\\to "     },
      { label: "∞",   insert: "\\infty "  },
    ],
  },
  {
    title: "Greek",
    items: [
      { label: "α",   insert: "\\alpha "  },
      { label: "β",   insert: "\\beta "   },
      { label: "θ",   insert: "\\theta "  },
      { label: "λ",   insert: "\\lambda " },
      { label: "μ",   insert: "\\mu "     },
      { label: "Δ",   insert: "\\Delta "  },
      { label: "Σ",   insert: "\\Sigma "  },
      { label: "Ω",   insert: "\\Omega "  },
    ],
  },
  {
    title: "Calculus & stats",
    items: [
      { label: "∫",      insert: "\\int_{}^{} ",  caret: 6, hint: "Integral with bounds" },
      { label: "Σ",      insert: "\\sum_{}^{} ",  caret: 6, hint: "Summation with bounds" },
      { label: "lim",    insert: "\\lim_{} ",     caret: 6, hint: "Limit" },
      { label: "d/dx",   insert: "\\frac{d}{dx}",           hint: "Derivative" },
      { label: "ⁿ√",     insert: "\\sqrt[]{}",    caret: 6, hint: "nth root" },
      { label: "x̄",      insert: "\\bar{x}"                  },
      { label: "x̂",      insert: "\\hat{x}"                  },
    ],
  },
];

type Props = {
  value: string;
  onChange: (latex: string) => void;
};

export function MathEditor({ value, onChange }: Props) {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const [moreEl, setMoreEl] = useState<HTMLElement | null>(null);

  const insert = (tpl: Template) => {
    const el = textareaRef.current;
    if (!el) {
      onChange(value + tpl.insert);
      return;
    }
    const start = el.selectionStart ?? value.length;
    const end = el.selectionEnd ?? value.length;
    const next = value.slice(0, start) + tpl.insert + value.slice(end);
    onChange(next);
    const caret = start + (tpl.caret ?? tpl.insert.length);
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(caret, caret);
    });
  };

  return (
    <Stack spacing={2}>
      <Toolbar onInsert={insert} onMore={(e) => setMoreEl(e.currentTarget)} />

      <TextField
        fullWidth
        multiline
        minRows={6}
        inputRef={textareaRef}
        placeholder="Type your working, or tap a symbol above."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        sx={{
          "& textarea": {
            fontFamily: "ui-monospace, 'SF Mono', Menlo, monospace",
            fontSize: "0.95rem",
            lineHeight: 1.7,
          },
        }}
      />

      <CollapsibleSection
        label="Preview"
        defaultOpen
        meta={value.trim() ? `${value.trim().split(/\n/).filter((l) => l.trim()).length} line${value.trim().split(/\n/).filter((l) => l.trim()).length === 1 ? "" : "s"}` : undefined}
      >
        <PreviewBlock source={value} />
      </CollapsibleSection>

      <MorePopover
        anchorEl={moreEl}
        onClose={() => setMoreEl(null)}
        onInsert={(tpl) => {
          setMoreEl(null);
          insert(tpl);
        }}
      />
    </Stack>
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
        <ToolButton key={tpl.insert} template={tpl} onInsert={onInsert} />
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
      slotProps={{ paper: { sx: { p: 1, width: { xs: 280, sm: 320 } } } }}
    >
      <Stack spacing={0.5}>
        {MORE_GROUPS.map((group, i) => (
          <CollapsibleSection
            key={group.title}
            label={group.title}
            defaultOpen={i === 0}
            meta={`${group.items.length}`}
          >
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(44px, 1fr))",
                gap: 0.5,
                p: 0.5,
              }}
            >
              {group.items.map((tpl) => (
                <ToolButton key={tpl.insert} template={tpl} onInsert={onInsert} />
              ))}
            </Box>
          </CollapsibleSection>
        ))}
      </Stack>
    </Popover>
  );
}

// ─── Preview ────────────────────────────────────────────────────────

function PreviewBlock({ source }: { source: string }) {
  const [katexMod, setKatexMod] = useState<typeof import("katex") | null>(null);

  useEffect(() => {
    let cancelled = false;
    import("katex").then((m) => {
      if (!cancelled) setKatexMod(m);
    });
    return () => { cancelled = true; };
  }, []);

  const rendered = useMemo(() => {
    if (!katexMod) return null;
    const lines = source.split(/\n/);
    return lines.map((line) => {
      const t = line.trim();
      if (!t) return { kind: "blank" as const };
      try {
        const html = katexMod.default.renderToString(t, {
          displayMode: true,
          throwOnError: false,
          errorColor: "#A8632F",
          output: "html",
        });
        return { kind: "math" as const, html };
      } catch {
        return { kind: "text" as const, text: t };
      }
    });
  }, [source, katexMod]);

  return (
    <Box
      sx={{
        minHeight: 120,
        p: { xs: 2, sm: 2.5 },
        border: 1,
        borderColor: "divider",
        borderRadius: 1,
        bgcolor: (t) =>
          t.palette.mode === "dark"
            ? "rgba(255,255,255,0.02)"
            : "rgba(0,0,0,0.02)",
        overflowX: "auto",
      }}
    >
      {!source.trim() ? (
        <Typography variant="body2" color="text.disabled">
          Your equations render here as you type.
        </Typography>
      ) : !katexMod || !rendered ? (
        <Typography variant="body2" color="text.secondary">
          Loading…
        </Typography>
      ) : (
        <Box
          sx={{
            color: "text.primary",
            // KaTeX centres display equations; left-align to match
            // reading order of the source above.
            "& .katex-display": { textAlign: "left", margin: 0 },
            "& .katex-display + .katex-display": { mt: 1 },
            "& > *:not(:last-child)": { mb: 1 },
          }}
        >
          {rendered.map((b, i) => {
            if (b.kind === "blank") return <Box key={i} sx={{ height: 8 }} />;
            if (b.kind === "math") {
              return (
                <div
                  key={i}
                  // eslint-disable-next-line react/no-danger
                  dangerouslySetInnerHTML={{ __html: b.html }}
                />
              );
            }
            return (
              <Typography key={i} variant="body2" sx={{ whiteSpace: "pre-wrap" }}>
                {b.text}
              </Typography>
            );
          })}
        </Box>
      )}
    </Box>
  );
}
