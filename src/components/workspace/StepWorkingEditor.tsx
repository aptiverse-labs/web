"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import IconButton from "@mui/material/IconButton";
import Button from "@mui/material/Button";
import Skeleton from "@mui/material/Skeleton";
import AddIcon from "@mui/icons-material/AddOutlined";
import CloseIcon from "@mui/icons-material/CloseOutlined";
import EditNoteIcon from "@mui/icons-material/EditNoteOutlined";
import { motion, AnimatePresence } from "framer-motion";

// Stack-of-steps editor for showing maths working. Each step has a
// short prose note (what the student is doing) and an optional equation
// (the maths they're working with) rendered by MathLive.
//
// Why structured steps rather than a single rich editor?
//   - Maps to how teachers grade: each step carries partial credit, so
//     the student naturally lays the work out one step at a time.
//   - Keeps the data shape trivial (JSON array of strings) — easy to
//     persist in the existing scratchpad draft column.
//   - Avoids the complexity of a contenteditable rich-text framework
//     (Tiptap/ProseMirror) for the v1.

// MathField is heavy (lazy-loaded MathLive bundle). next/dynamic keeps
// it out of the initial chunk; loading appears only when this editor
// renders.
const MathField = dynamic(
  () => import("./MathField").then((m) => m.MathField),
  {
    ssr: false,
    loading: () => <Skeleton variant="rounded" height={44} />,
  },
);

export type WorkingStep = {
  note: string;
  latex: string;
};

type Props = {
  /** Serialised JSON of WorkingStep[] (the scratchpad draft). */
  value: string;
  onChange: (json: string) => void;
};

// Parses the persisted string. Backward-compat: a legacy plain-text
// scratchpad becomes a single step with no equation and the text as
// the note. Empty / null payloads start as a single empty step so the
// editor always has something rendered.
function parseSteps(raw: string): WorkingStep[] {
  if (!raw || !raw.trim()) return [emptyStep()];
  const trimmed = raw.trim();
  if (trimmed.startsWith("[") || trimmed.startsWith("{")) {
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) {
        const cleaned = parsed
          .filter((s): s is WorkingStep => s && typeof s === "object" && "note" in s && "latex" in s)
          .map((s) => ({ note: String(s.note ?? ""), latex: String(s.latex ?? "") }));
        return cleaned.length > 0 ? cleaned : [emptyStep()];
      }
    } catch {
      // fall through to legacy text handling
    }
  }
  return [{ note: trimmed, latex: "" }];
}

function emptyStep(): WorkingStep {
  return { note: "", latex: "" };
}

function serializeSteps(steps: WorkingStep[]): string {
  // Don't persist a single completely-empty step — store empty string
  // so the draft column reads clean.
  const meaningful = steps.filter((s) => s.note.trim() || s.latex.trim());
  return meaningful.length === 0 ? "" : JSON.stringify(meaningful);
}

export function StepWorkingEditor({ value, onChange }: Props) {
  // Initialise from props once, then maintain locally. We don't reset
  // on every external value change — that would erase in-flight edits
  // while autosave was still in flight.
  const initial = useMemo(() => parseSteps(value), []); // eslint-disable-line react-hooks/exhaustive-deps
  const [steps, setSteps] = useState<WorkingStep[]>(initial);

  // Re-hydrate when the assessment switches (parent passes a different
  // value). Compare by serialised form so identical content doesn't
  // trigger a useless reset.
  useEffect(() => {
    const incoming = parseSteps(value);
    const current = serializeSteps(steps);
    const next = serializeSteps(incoming);
    if (current !== next) setSteps(incoming);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const commit = (next: WorkingStep[]) => {
    setSteps(next);
    onChange(serializeSteps(next));
  };

  const updateStep = (i: number, patch: Partial<WorkingStep>) => {
    commit(steps.map((s, idx) => (idx === i ? { ...s, ...patch } : s)));
  };

  const addStep = () => commit([...steps, emptyStep()]);
  const removeStep = (i: number) => {
    const next = steps.filter((_, idx) => idx !== i);
    commit(next.length === 0 ? [emptyStep()] : next);
  };

  return (
    <Stack spacing={1.5}>
      <AnimatePresence initial={false}>
        {steps.map((s, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ type: "spring", stiffness: 380, damping: 30 }}
            style={{ overflow: "hidden" }}
          >
            <StepCard
              index={i}
              step={s}
              onChangeNote={(v) => updateStep(i, { note: v })}
              onChangeLatex={(v) => updateStep(i, { latex: v })}
              onRemove={() => removeStep(i)}
              canRemove={steps.length > 1 || !!s.note.trim() || !!s.latex.trim()}
            />
          </motion.div>
        ))}
      </AnimatePresence>

      <Button
        onClick={addStep}
        startIcon={<AddIcon />}
        variant="text"
        size="small"
        sx={{ alignSelf: "flex-start" }}
      >
        Add step
      </Button>
    </Stack>
  );
}

function StepCard({
  index,
  step,
  onChangeNote,
  onChangeLatex,
  onRemove,
  canRemove,
}: {
  index: number;
  step: WorkingStep;
  onChangeNote: (v: string) => void;
  onChangeLatex: (v: string) => void;
  onRemove: () => void;
  canRemove: boolean;
}) {
  // Note input is hidden by default — students often want to dump
  // equations only and not have to explain each one. We surface a
  // small "+ Add note" affordance below the math when it's empty;
  // once content is in there, the input stays visible.
  const [showNote, setShowNote] = useState(!!step.note);
  useEffect(() => {
    if (step.note) setShowNote(true);
  }, [step.note]);

  return (
    <Box
      sx={{
        position: "relative",
        p: { xs: 1.5, sm: 2 },
        border: 1,
        borderColor: "divider",
        borderRadius: 1.5,
        transition: "border-color 150ms ease",
        "&:hover": { borderColor: "text.secondary" },
        "&:hover .step-remove": { opacity: 1 },
      }}
    >
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ letterSpacing: "0.06em", fontWeight: 600, textTransform: "uppercase" }}
        >
          Step {index + 1}
        </Typography>
        {canRemove && (
          <IconButton
            className="step-remove"
            size="small"
            onClick={onRemove}
            aria-label={`Remove step ${index + 1}`}
            sx={{
              opacity: 0,
              transition: "opacity 150ms ease",
              "&:focus-visible": { opacity: 1 },
            }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        )}
      </Stack>

      {showNote && (
        <TextField
          fullWidth
          size="small"
          autoFocus={!step.note}
          placeholder="Optional note (e.g. Differentiate both sides)"
          value={step.note}
          onChange={(e) => onChangeNote(e.target.value)}
          onBlur={() => { if (!step.note.trim()) setShowNote(false); }}
          sx={{ mb: 1 }}
        />
      )}

      <MathField
        value={step.latex}
        onChange={onChangeLatex}
        placeholder="Type maths here…"
        ariaLabel={`Step ${index + 1} maths`}
      />

      {!showNote && (
        <Button
          onClick={() => setShowNote(true)}
          startIcon={<EditNoteIcon fontSize="small" />}
          size="small"
          variant="text"
          sx={{
            mt: 1,
            color: "text.secondary",
            fontWeight: 500,
            textTransform: "none",
            "&:hover": { color: "primary.main", backgroundColor: "transparent" },
          }}
        >
          Add note
        </Button>
      )}
    </Box>
  );
}
