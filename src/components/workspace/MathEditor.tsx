"use client";

import { useRef, useState } from "react";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import IconButton from "@mui/material/IconButton";
import Popover from "@mui/material/Popover";
import Tooltip from "@mui/material/Tooltip";
import MoreHorizIcon from "@mui/icons-material/MoreHorizOutlined";

// Aptiverse math editor.
//
// One textarea + a symbol toolbar. What you type is what's stored —
// no preview pane, no LaTeX-to-rendered translation. Students write
// maths the way they write it in notes and messages: x^2, sqrt(x+1),
// 1/2. Readable as plain text without 2D rendering.
//
// For working that genuinely needs 2D layout — stacked fractions,
// integrals with bounds, geometry sketches — the student photographs
// their paper (see UploadsStrip below).

type Symbol = {
  label: string;     // glyph on the button
  insert: string;    // text to insert (Unicode, not LaTeX)
  caret?: number;    // chars from start of insert where caret lands
  hint?: string;
};

// Six symbols a student reaches for on every page of NSC working.
// Anything beyond these lives in the More popover so the toolbar
// stays compact on a phone.
const PRIMARY: Symbol[] = [
  { label: "1⁄2", insert: "/",                   hint: "Divide / fraction (e.g. 1/2)" },
  { label: "√",   insert: "√()",       caret: 2, hint: "Square root, e.g. √(x+1)" },
  { label: "xⁿ",  insert: "^",                   hint: "Power, e.g. x^2" },
  { label: "( )", insert: "()",        caret: 1, hint: "Brackets" },
  { label: "π",   insert: "π",                   hint: "Pi" },
  { label: "≤",   insert: " ≤ ",                 hint: "Less than or equal" },
];

const MORE_GROUPS: { title: string; items: Symbol[] }[] = [
  {
    title: "Operators",
    items: [
      { label: "×", insert: " × " },
      { label: "÷", insert: " ÷ " },
      { label: "±", insert: " ± " },
      { label: "·", insert: " · " },
      { label: "≈", insert: " ≈ " },
      { label: "≥", insert: " ≥ " },
      { label: "≠", insert: " ≠ " },
      { label: "→", insert: " → " },
      { label: "∞", insert: "∞"   },
    ],
  },
  {
    title: "Greek",
    items: [
      { label: "α", insert: "α" },
      { label: "β", insert: "β" },
      { label: "θ", insert: "θ" },
      { label: "λ", insert: "λ" },
      { label: "μ", insert: "μ" },
      { label: "Δ", insert: "Δ" },
      { label: "Σ", insert: "Σ" },
      { label: "Ω", insert: "Ω" },
    ],
  },
  {
    title: "Calculus & stats",
    items: [
      { label: "∫",  insert: "∫" },
      { label: "Σ",  insert: "Σ" },
      { label: "lim", insert: "lim " },
      { label: "ⁿ√", insert: "ⁿ√()", caret: 3, hint: "nth root" },
      { label: "x̄",  insert: "x̄"  },
      { label: "x̂",  insert: "x̂"  },
    ],
  },
];

type Props = {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
};

export function MathEditor({ value, onChange, placeholder }: Props) {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const [moreEl, setMoreEl] = useState<HTMLElement | null>(null);

  const insert = (sym: Symbol) => {
    const el = textareaRef.current;
    if (!el) {
      onChange(value + sym.insert);
      return;
    }
    const start = el.selectionStart ?? value.length;
    const end = el.selectionEnd ?? value.length;
    const next = value.slice(0, start) + sym.insert + value.slice(end);
    onChange(next);
    const caret = start + (sym.caret ?? sym.insert.length);
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(caret, caret);
    });
  };

  return (
    <Stack spacing={1.5}>
      <Toolbar onInsert={insert} onMore={(e) => setMoreEl(e.currentTarget)} />

      <TextField
        fullWidth
        multiline
        minRows={10}
        inputRef={textareaRef}
        placeholder={
          placeholder ??
          "Write your working. Use the toolbar for symbols, or type them directly."
        }
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

      <MorePopover
        anchorEl={moreEl}
        onClose={() => setMoreEl(null)}
        onInsert={(sym) => {
          setMoreEl(null);
          insert(sym);
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
  onInsert: (sym: Symbol) => void;
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
      {PRIMARY.map((sym) => (
        <SymbolButton key={sym.insert} symbol={sym} onInsert={onInsert} />
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

function SymbolButton({
  symbol,
  onInsert,
}: {
  symbol: Symbol;
  onInsert: (sym: Symbol) => void;
}) {
  return (
    <Tooltip title={symbol.hint ?? symbol.label}>
      <IconButton
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => onInsert(symbol)}
        aria-label={symbol.hint ?? symbol.label}
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
        {symbol.label}
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
  onInsert: (sym: Symbol) => void;
}) {
  return (
    <Popover
      open={!!anchorEl}
      anchorEl={anchorEl}
      onClose={onClose}
      anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      transformOrigin={{ vertical: "top", horizontal: "right" }}
      slotProps={{ paper: { sx: { p: 2, width: { xs: 280, sm: 320 } } } }}
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
              {group.items.map((sym) => (
                <SymbolButton key={sym.insert} symbol={sym} onInsert={onInsert} />
              ))}
            </Box>
          </Box>
        ))}
      </Stack>
    </Popover>
  );
}
