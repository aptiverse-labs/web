"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import TextField from "@mui/material/TextField";
import Chip from "@mui/material/Chip";
import LinearProgress from "@mui/material/LinearProgress";
import MenuItem from "@mui/material/MenuItem";
import Divider from "@mui/material/Divider";
import Tooltip from "@mui/material/Tooltip";
import Avatar from "@mui/material/Avatar";
import Skeleton from "@mui/material/Skeleton";
import Drawer from "@mui/material/Drawer";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import useMediaQuery from "@mui/material/useMediaQuery";
import { useTheme } from "@mui/material/styles";
import PlayArrowIcon from "@mui/icons-material/PlayArrowOutlined";
import PauseIcon from "@mui/icons-material/PauseOutlined";
import RestartAltIcon from "@mui/icons-material/RestartAltOutlined";
import SmartToyIcon from "@mui/icons-material/SmartToyOutlined";
import SendIcon from "@mui/icons-material/SendOutlined";
import CloseIcon from "@mui/icons-material/CloseOutlined";
import ChecklistIcon from "@mui/icons-material/ChecklistOutlined";
import ViewColumnIcon from "@mui/icons-material/ViewColumnOutlined";
import ViewStreamIcon from "@mui/icons-material/ViewStreamOutlined";
import KeyboardIcon from "@mui/icons-material/KeyboardOutlined";
import { PageHeader } from "@/components/common/PageHeader";
import { EmptyState } from "@/components/common/EmptyState";
import { TasksEditor } from "@/components/workspace/TasksEditor";
import { useAssessments, useSubjects, useUpdateAssessment } from "@/lib/api/queries";
import type { Assessment, Subject } from "@/lib/mockData";
import { useWorkspaceDraft, type AutosaveState } from "@/lib/hooks/useWorkspaceDraft";
import { useAiHelp, type AiHelpMessage } from "@/lib/hooks/useAiHelp";
import Link from "next/link";
import dayjs from "dayjs";

const TABS = ["Notes", "Essay"] as const;
type TabKey = (typeof TABS)[number];

// Editor view mode. Tabbed shows one panel at a time; split renders
// Notes + Essay side-by-side in the center column. Split mode is
// desktop-only — the toggle hides on narrow screens.
type ViewMode = "tabbed" | "split";

const AI_TUTOR_INPUT_ID = "workspace-ai-tutor-input";

// Reads the current platform so we render the right modifier glyph
// on the shortcut cheatsheet. macOS gets ⌘, everyone else gets Ctrl.
function platformModifier(): { key: "metaKey" | "ctrlKey"; label: string } {
  if (typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform)) {
    return { key: "metaKey", label: "⌘" };
  }
  return { key: "ctrlKey", label: "Ctrl" };
}

// Returns true if the event originated from an editable element — used
// to suppress single-letter shortcuts like "?" while the user is typing
// in an input, textarea, or contenteditable.
function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || target.isContentEditable;
}

export default function WorkspacePage() {
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up("md"));

  const assessmentsQuery = useAssessments();
  const subjectsQuery = useSubjects();

  // Pick the soonest-due, not-yet-graded SBA by default. Falls back to
  // the first available; null when the user has none.
  const activeAssessments = useMemo<Assessment[]>(
    () =>
      (assessmentsQuery.data ?? [])
        .filter((a) => a.status !== "graded")
        .sort((a, b) => +new Date(a.dueDate) - +new Date(b.dueDate)),
    [assessmentsQuery.data],
  );

  const [activeId, setActiveId] = useState<string | null>(null);
  useEffect(() => {
    if (activeId && activeAssessments.some((a) => a.id === activeId)) return;
    setActiveId(activeAssessments[0]?.id ?? null);
  }, [activeAssessments, activeId]);

  const activeAssessment = activeAssessments.find((a) => a.id === activeId);
  const subject: Subject | undefined = (subjectsQuery.data ?? []).find(
    (s) => s.id === activeAssessment?.subjectId,
  );

  const [tab, setTab] = useState<TabKey>("Notes");
  const [viewMode, setViewMode] = useState<ViewMode>("tabbed");
  const [aiOpen, setAiOpen] = useState(false);
  const [contextOpen, setContextOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);

  // Keyboard shortcuts. Each handler is a no-op when the user is typing
  // into an editable element (so "?" inside the essay doesn't pop the
  // cheatsheet). Modifier-prefixed shortcuts run from anywhere.
  useEffect(() => {
    const mod = platformModifier();
    const onKey = (e: KeyboardEvent) => {
      const editing = isEditableTarget(e.target);

      // ? — open the shortcut cheatsheet. Only when not typing.
      if (!editing && e.key === "?" && !e[mod.key] && !e.altKey) {
        e.preventDefault();
        setShortcutsOpen(true);
        return;
      }

      if (!e[mod.key]) return;

      // ⌘1 / ⌘2 — switch tabs.
      if (e.key === "1") {
        e.preventDefault();
        setViewMode("tabbed");
        setTab("Notes");
        return;
      }
      if (e.key === "2") {
        e.preventDefault();
        setViewMode("tabbed");
        setTab("Essay");
        return;
      }

      // ⌘\ — toggle split view (desktop-only by design; on narrow
      // screens it falls back to tabbed mode anyway).
      if (e.key === "\\") {
        e.preventDefault();
        if (isDesktop) setViewMode((v) => (v === "split" ? "tabbed" : "split"));
        return;
      }

      // ⌘K — focus the AI tutor input. On mobile, open the drawer first.
      if (e.key.toLowerCase() === "k") {
        e.preventDefault();
        if (!isDesktop) setAiOpen(true);
        // setTimeout 0 lets the drawer mount before we focus.
        setTimeout(() => document.getElementById(AI_TUTOR_INPUT_ID)?.focus(), 0);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isDesktop]);

  if (assessmentsQuery.isLoading || subjectsQuery.isLoading) {
    return (
      <>
        <PageHeader title="Workspace" breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Workspace" }]} />
        <Skeleton variant="rounded" height={620} />
      </>
    );
  }

  if (!activeAssessment) {
    return (
      <>
        <PageHeader
          title="Workspace"
          description="Plan, write, and ask. Autosave on."
          breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Workspace" }]}
        />
        <Card>
          <CardContent sx={{ p: { xs: 3, md: 5 } }}>
            <EmptyState
              icon={<ChecklistIcon />}
              title="Nothing to work on yet"
              description="Log an SBA — a test, essay, investigation, project — and the workspace will open with it as the active task."
              action={
                <Button component={Link} href="/dashboard/assessments/new" variant="contained">
                  Add an assessment
                </Button>
              }
            />
          </CardContent>
        </Card>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Workspace"
        description="Plan, write, and ask. Autosave on."
        breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Workspace" }]}
        actions={
          <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
            <TextField
              select
              size="small"
              value={activeId ?? ""}
              onChange={(e) => setActiveId(e.target.value)}
              sx={{ minWidth: { xs: "100%", sm: 280 } }}
            >
              {activeAssessments.map((a) => {
                const subj = (subjectsQuery.data ?? []).find((s) => s.id === a.subjectId);
                return (
                  <MenuItem key={a.id} value={a.id}>
                    {subj?.name ?? a.subjectId} · {a.title}
                  </MenuItem>
                );
              })}
            </TextField>
          </Stack>
        }
      />

      {/* Mobile-only quick-open buttons for the rails. */}
      {!isDesktop && (
        <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
          <Button
            fullWidth
            variant="outlined"
            size="small"
            onClick={() => setContextOpen(true)}
            startIcon={<ChecklistIcon fontSize="small" />}
          >
            Plan
          </Button>
          <Button
            fullWidth
            variant="outlined"
            size="small"
            onClick={() => setAiOpen(true)}
            startIcon={<SmartToyIcon fontSize="small" />}
          >
            AI tutor
          </Button>
        </Stack>
      )}

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "300px 1fr 340px" },
          gap: 3,
          alignItems: "start",
        }}
      >
        {/* Left rail — hidden on mobile (lives in the drawer) */}
        <Box sx={{ display: { xs: "none", md: "block" } }}>
          <LeftRail assessment={activeAssessment} subject={subject} />
        </Box>

        {/* Editor */}
        <Card sx={{ minHeight: { xs: 480, md: 620 } }}>
          <CardContent sx={{ p: 0, pb: "0 !important" }}>
            <Stack
              direction="row"
              alignItems="center"
              justifyContent="space-between"
              sx={{ borderBottom: 1, borderColor: "divider", px: { xs: 1, sm: 2 }, pr: { xs: 1, sm: 1.5 } }}
            >
              {viewMode === "tabbed" ? (
                <Tabs
                  value={tab}
                  onChange={(_, v) => setTab(v)}
                  variant="scrollable"
                  scrollButtons={false}
                >
                  {TABS.map((t) => (
                    <Tab key={t} label={t} value={t} />
                  ))}
                </Tabs>
              ) : (
                <Typography variant="overline" color="text.secondary" sx={{ letterSpacing: "0.08em", py: 1.5 }}>
                  Notes + Essay
                </Typography>
              )}

              <Stack direction="row" spacing={0.5} alignItems="center">
                {isDesktop && (
                  <ToggleButtonGroup
                    value={viewMode}
                    exclusive
                    size="small"
                    onChange={(_, v: ViewMode | null) => v && setViewMode(v)}
                    sx={{ "& .MuiToggleButton-root": { px: 1, border: 0 } }}
                  >
                    <ToggleButton value="tabbed" aria-label="Tabbed view">
                      <Tooltip title="Tabbed view">
                        <ViewStreamIcon fontSize="small" />
                      </Tooltip>
                    </ToggleButton>
                    <ToggleButton value="split" aria-label="Split view (Notes + Essay)">
                      <Tooltip title="Split view (Notes + Essay)">
                        <ViewColumnIcon fontSize="small" />
                      </Tooltip>
                    </ToggleButton>
                  </ToggleButtonGroup>
                )}
                <Tooltip title="Keyboard shortcuts (?)">
                  <IconButton size="small" onClick={() => setShortcutsOpen(true)} aria-label="Keyboard shortcuts">
                    <KeyboardIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Stack>
            </Stack>

            {viewMode === "split" && isDesktop ? (
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  // Subtle vertical divider between the two panes.
                  "& > :first-of-type": {
                    borderRight: 1,
                    borderColor: "divider",
                  },
                }}
              >
                <Box sx={{ p: { xs: 2, sm: 3 } }}>
                  <PaneHeader label="Notes" />
                  <NotesPanel assessmentId={activeId} />
                </Box>
                <Box sx={{ p: { xs: 2, sm: 3 } }}>
                  <PaneHeader label="Essay" />
                  <EssayPanel assessmentId={activeId} essayTitle={activeAssessment.title} />
                </Box>
              </Box>
            ) : (
              <Box sx={{ p: { xs: 2, sm: 3 } }}>
                {tab === "Notes" && <NotesPanel assessmentId={activeId} />}
                {tab === "Essay" && <EssayPanel assessmentId={activeId} essayTitle={activeAssessment.title} />}
              </Box>
            )}
          </CardContent>
        </Card>

        {/* Right rail */}
        <Box sx={{ display: { xs: "none", md: "block" } }}>
          <RightRail assessment={activeAssessment} subject={subject} />
        </Box>
      </Box>

      <ShortcutsDialog open={shortcutsOpen} onClose={() => setShortcutsOpen(false)} />

      {/* Mobile drawers */}
      <Drawer
        anchor="left"
        open={!isDesktop && contextOpen}
        onClose={() => setContextOpen(false)}
        PaperProps={{ sx: { width: { xs: "90vw", sm: 320 } } }}
      >
        <DrawerHeader title="Plan" onClose={() => setContextOpen(false)} />
        <Box sx={{ p: 2 }}>
          <LeftRail assessment={activeAssessment} subject={subject} />
        </Box>
      </Drawer>
      <Drawer
        anchor="right"
        open={!isDesktop && aiOpen}
        onClose={() => setAiOpen(false)}
        PaperProps={{ sx: { width: { xs: "100vw", sm: 380 } } }}
      >
        <DrawerHeader title="AI tutor" onClose={() => setAiOpen(false)} />
        <Box sx={{ p: 2 }}>
          <RightRail assessment={activeAssessment} subject={subject} />
        </Box>
      </Drawer>
    </>
  );
}

function PaneHeader({ label }: { label: string }) {
  return (
    <Typography
      variant="overline"
      color="text.secondary"
      sx={{ letterSpacing: "0.08em", display: "block", mb: 1.5 }}
    >
      {label}
    </Typography>
  );
}

function ShortcutsDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const mod = platformModifier();
  const rows: { keys: string[]; label: string }[] = [
    { keys: [mod.label, "1"],  label: "Open Notes" },
    { keys: [mod.label, "2"],  label: "Open Essay" },
    { keys: [mod.label, "\\"], label: "Toggle split view (desktop)" },
    { keys: [mod.label, "K"],  label: "Focus AI tutor input" },
    { keys: ["?"],             label: "Show this cheatsheet" },
  ];

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      {/* DialogTitle renders an <h2>; inner Typographys explicitly use
          <div>/<span> so we don't nest headings inside it (invalid HTML
          + React hydration error). The visual styling stays the same. */}
      <DialogTitle sx={{ pb: 1 }}>
        <Typography
          component="div"
          variant="overline"
          color="text.secondary"
          sx={{ letterSpacing: "0.08em", lineHeight: 1.2 }}
        >
          Keyboard
        </Typography>
        <Typography component="span" variant="h6" sx={{ fontWeight: 600 }}>
          Shortcuts
        </Typography>
      </DialogTitle>
      <DialogContent>
        <Stack spacing={1.5}>
          {rows.map((r) => (
            <Stack key={r.label} direction="row" justifyContent="space-between" alignItems="center">
              <Typography variant="body2">{r.label}</Typography>
              <Stack direction="row" spacing={0.5}>
                {r.keys.map((k) => (
                  <Box
                    key={k}
                    component="kbd"
                    sx={{
                      px: 0.75,
                      py: 0.25,
                      borderRadius: 1,
                      border: 1,
                      borderColor: "divider",
                      fontFamily: "ui-monospace, 'SF Mono', Menlo, monospace",
                      fontSize: "0.7rem",
                      fontWeight: 600,
                      minWidth: 22,
                      textAlign: "center",
                      lineHeight: "20px",
                      color: "text.secondary",
                    }}
                  >
                    {k}
                  </Box>
                ))}
              </Stack>
            </Stack>
          ))}
        </Stack>
      </DialogContent>
    </Dialog>
  );
}

function DrawerHeader({ title, onClose }: { title: string; onClose: () => void }) {
  return (
    <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ p: 1.5, borderBottom: 1, borderColor: "divider" }}>
      <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
        {title}
      </Typography>
      <IconButton onClick={onClose} size="small" aria-label="Close">
        <CloseIcon />
      </IconButton>
    </Stack>
  );
}

// ============================================================
// LEFT RAIL — active SBA · pomodoro · tasks (real)
// ============================================================
function LeftRail({ assessment, subject }: { assessment: Assessment; subject: Subject | undefined }) {
  const daysOut = dayjs(assessment.dueDate).diff(dayjs(), "day");
  const dueChip =
    daysOut < 0
      ? { label: "Overdue", color: "error" as const }
      : daysOut === 0
        ? { label: "Due today", color: "warning" as const }
        : daysOut <= 3
          ? { label: `Due in ${daysOut}d`, color: "warning" as const }
          : { label: `Due in ${daysOut}d`, color: "default" as const };

  return (
    <Stack spacing={2.5} sx={{ position: { md: "sticky" }, top: { md: 88 } }}>
      <Card>
        <CardContent sx={{ p: 2.5 }}>
          <Typography variant="overline" color="text.secondary" sx={{ letterSpacing: "0.08em" }}>
            Active SBA
          </Typography>
          <Typography variant="subtitle1" sx={{ fontWeight: 600, mt: 0.5 }}>
            {assessment.title}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {subject?.name ?? assessment.subjectId}
          </Typography>
          <Stack direction="row" spacing={0.75} sx={{ mt: 1.5 }} flexWrap="wrap" useFlexGap>
            <Chip label={dueChip.label} size="small" color={dueChip.color} variant="outlined" />
            <Chip label={`Weight ${assessment.weight}%`} size="small" variant="outlined" />
          </Stack>
        </CardContent>
      </Card>

      <FocusTimer />

      <Card>
        <CardContent sx={{ p: 2.5 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="flex-end" sx={{ mb: 2 }}>
            <Box>
              <Typography variant="overline" color="text.secondary" sx={{ letterSpacing: "0.08em" }}>
                Plan
              </Typography>
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                Tasks
              </Typography>
            </Box>
          </Stack>
          <TasksEditor
            assessmentId={assessment.id}
            tasks={assessment.tasks ?? []}
            compact
          />
        </CardContent>
      </Card>
    </Stack>
  );
}

function FocusTimer() {
  const [secs, setSecs] = useState(25 * 60);
  const [running, setRunning] = useState(false);
  const ref = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (running) {
      ref.current = setInterval(() => setSecs((s) => Math.max(0, s - 1)), 1000);
    } else if (ref.current) {
      clearInterval(ref.current);
    }
    return () => {
      if (ref.current) clearInterval(ref.current);
    };
  }, [running]);

  // Auto-stop at zero so the timer doesn't sit at 00:00 with the
  // animation still active.
  useEffect(() => {
    if (secs === 0 && running) setRunning(false);
  }, [secs, running]);

  const m = Math.floor(secs / 60);
  const s = secs % 60;
  const pct = ((25 * 60 - secs) / (25 * 60)) * 100;

  return (
    <Card>
      <CardContent sx={{ p: 2.5 }}>
        <Typography variant="overline" color="text.secondary" sx={{ letterSpacing: "0.08em" }}>
          Focus
        </Typography>
        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
          25 minute Pomodoro
        </Typography>
        <Typography
          variant="h2"
          sx={{
            fontWeight: 600,
            fontVariantNumeric: "tabular-nums",
            my: 1,
            lineHeight: 1.05,
          }}
        >
          {String(m).padStart(2, "0")}:{String(s).padStart(2, "0")}
        </Typography>
        <LinearProgress
          variant="determinate"
          value={pct}
          sx={{ mb: 2, height: 4, borderRadius: 999 }}
          color={secs === 0 ? "success" : "primary"}
        />
        <Stack direction="row" spacing={1}>
          <Button
            startIcon={running ? <PauseIcon /> : <PlayArrowIcon />}
            variant="contained"
            fullWidth
            onClick={() => setRunning((r) => !r)}
            disabled={secs === 0}
          >
            {running ? "Pause" : secs === 25 * 60 ? "Start" : "Resume"}
          </Button>
          <Tooltip title="Reset">
            <IconButton
              onClick={() => {
                setRunning(false);
                setSecs(25 * 60);
              }}
              aria-label="Reset timer"
            >
              <RestartAltIcon />
            </IconButton>
          </Tooltip>
        </Stack>
      </CardContent>
    </Card>
  );
}

// ============================================================
// EDITOR PANELS — wired to useWorkspaceDraft for autosave
// ============================================================
function AutosaveBadge({ state }: { state: AutosaveState }) {
  let label: string;
  let color: "default" | "success" | "warning" | "error" = "default";
  if (state.status === "saving") {
    label = "Saving…";
    color = "warning";
  } else if (state.status === "saved" && state.lastSavedAt) {
    label = `Saved ${dayjs(state.lastSavedAt).format("HH:mm")}`;
    color = "success";
  } else if (state.status === "dirty") {
    label = "Unsaved";
    color = "warning";
  } else if (state.status === "error") {
    label = "Save failed";
    color = "error";
  } else {
    label = "Idle";
  }
  return <Chip label={label} size="small" color={color === "default" ? undefined : color} variant="outlined" />;
}

function NotesPanel({ assessmentId }: { assessmentId: string | null }) {
  const draft = useWorkspaceDraft(assessmentId, "notes");
  const [value, setValue] = useState(draft.initialContent);
  useEffect(() => {
    setValue(draft.initialContent);
  }, [draft.initialContent]);

  return (
    <Stack spacing={1.5}>
      <TextField
        fullWidth
        multiline
        minRows={18}
        placeholder="Start typing your notes… autosave is on."
        value={value}
        onChange={(e) => {
          setValue(e.target.value);
          draft.queueSave(e.target.value);
        }}
        sx={{
          "& .MuiOutlinedInput-root": { bgcolor: "transparent", border: 0 },
          "& fieldset": { border: 0 },
          "& textarea": {
            fontFamily: "ui-monospace, 'SF Mono', Menlo, monospace",
            fontSize: "0.95rem",
          },
        }}
      />
      <Stack direction="row" justifyContent="flex-end">
        <AutosaveBadge state={draft.state} />
      </Stack>
    </Stack>
  );
}

function EssayPanel({ assessmentId, essayTitle }: { assessmentId: string | null; essayTitle: string }) {
  const draft = useWorkspaceDraft(assessmentId, "essay");
  const [value, setValue] = useState(draft.initialContent);
  const [snackbar, setSnackbar] = useState<{ open: boolean; msg: string; severity: "success" | "error" }>({
    open: false,
    msg: "",
    severity: "success",
  });
  const updateAssessment = useUpdateAssessment();

  useEffect(() => {
    setValue(draft.initialContent);
  }, [draft.initialContent]);

  // Reading stats. 200 wpm is the standard "average adult silent
  // reading" benchmark — close enough for a student to judge whether
  // their essay's on length.
  const trimmed = value.trim();
  const wordCount = trimmed ? trimmed.split(/\s+/).length : 0;
  const sentenceCount = trimmed
    ? (trimmed.match(/[.!?]+(\s|$)/g) ?? []).length || 1
    : 0;
  const readMinutes = wordCount === 0 ? 0 : Math.max(1, Math.round(wordCount / 200));

  const submit = async () => {
    if (!assessmentId) return;
    try {
      draft.queueSave(value);
      await updateAssessment.mutateAsync({ id: assessmentId, status: "submitted" });
      setSnackbar({ open: true, msg: "Draft submitted. Saved + marked as submitted.", severity: "success" });
    } catch (err) {
      setSnackbar({
        open: true,
        msg: err instanceof Error ? err.message : "Couldn't submit draft.",
        severity: "error",
      });
    }
  };

  return (
    <Stack spacing={2}>
      <TextField fullWidth label="Title" value={essayTitle} disabled />
      <TextField
        fullWidth
        multiline
        minRows={16}
        placeholder="Open with a hook your reader can't ignore…"
        value={value}
        onChange={(e) => {
          setValue(e.target.value);
          draft.queueSave(e.target.value);
        }}
        sx={{
          "& textarea": { fontSize: "1rem", lineHeight: 1.7 },
        }}
      />
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={1.5}
        justifyContent="space-between"
        alignItems={{ xs: "stretch", sm: "center" }}
      >
        <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap" useFlexGap>
          <Typography variant="caption" color="text.secondary">
            {wordCount} {wordCount === 1 ? "word" : "words"}
          </Typography>
          {sentenceCount > 0 && (
            <>
              <Box sx={{ width: 3, height: 3, borderRadius: "50%", bgcolor: "text.disabled" }} />
              <Typography variant="caption" color="text.secondary">
                {sentenceCount} {sentenceCount === 1 ? "sentence" : "sentences"}
              </Typography>
              <Box sx={{ width: 3, height: 3, borderRadius: "50%", bgcolor: "text.disabled" }} />
              <Typography variant="caption" color="text.secondary">
                ~{readMinutes} min read
              </Typography>
            </>
          )}
          <AutosaveBadge state={draft.state} />
        </Stack>
        <Stack direction="row" spacing={1}>
          <Button
            variant="contained"
            onClick={submit}
            disabled={!assessmentId || updateAssessment.isPending || !value.trim()}
          >
            {updateAssessment.isPending ? "Submitting…" : "Submit draft"}
          </Button>
        </Stack>
      </Stack>
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          severity={snackbar.severity}
          variant="filled"
          onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        >
          {snackbar.msg}
        </Alert>
      </Snackbar>
    </Stack>
  );
}

// ============================================================
// RIGHT RAIL — AI tutor + rubric (honest empty when none attached)
// ============================================================
function RightRail({ assessment, subject }: { assessment: Assessment; subject: Subject | undefined }) {
  return (
    <Stack spacing={2.5} sx={{ position: { md: "sticky" }, top: { md: 88 } }}>
      <AiTutorChat assessment={assessment} subject={subject} />
      <RubricCard rubric={assessment.rubric} />
    </Stack>
  );
}

function AiTutorChat({ assessment, subject }: { assessment: Assessment; subject: Subject | undefined }) {
  const [messages, setMessages] = useState<AiHelpMessage[]>([
    {
      role: "assistant",
      content: `Ask me anything about ${assessment.title}${subject ? ` (${subject.name})` : ""}.`,
    },
  ]);
  const [input, setInput] = useState("");
  const ask = useAiHelp();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, ask.isPending]);

  const send = () => {
    const text = input.trim();
    if (!text) return;
    // One-shot system context on the first user turn so the bot knows
    // what the user is working on. /api/ai/help only accepts
    // user/assistant roles, so we prepend rather than send a separate
    // system turn.
    const contextLine = `[Context: working on "${assessment.title}"${subject ? ` for ${subject.name}` : ""}, due ${dayjs(assessment.dueDate).format("DD MMM")}.]`;
    const userMessage: AiHelpMessage = {
      role: "user",
      content: messages.length <= 1 ? `${contextLine}\n\n${text}` : text,
    };
    const next = [...messages, userMessage];
    setMessages(next);
    setInput("");
    ask.mutate(
      { messages: next },
      {
        onSuccess: (data) =>
          setMessages((m) => [...m, { role: "assistant", content: data.reply }]),
        onError: (err) =>
          setMessages((m) => [
            ...m,
            {
              role: "assistant",
              content:
                err.status === 503
                  ? "The AI is unavailable right now. Try again in a moment."
                  : err.status === 402
                    ? "You've used this month's Quick AI replies. Upgrade your plan or wait for next month."
                    : "Something went wrong on my side. Try again in a moment.",
            },
          ]),
      },
    );
  };

  return (
    <Card sx={{ height: { xs: 460, md: 540 }, display: "flex", flexDirection: "column" }}>
      <Stack
        direction="row"
        alignItems="center"
        spacing={1.5}
        sx={{ p: 2, borderBottom: 1, borderColor: "divider" }}
      >
        <Avatar sx={{ bgcolor: "primary.main", width: 32, height: 32 }}>
          <SmartToyIcon fontSize="small" sx={{ color: "primary.contrastText" }} />
        </Avatar>
        <Box sx={{ flex: 1 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
            AI tutor
          </Typography>
          <Typography variant="caption" color={ask.isPending ? "warning.main" : "success.main"}>
            {ask.isPending ? "Thinking…" : "Online"}
          </Typography>
        </Box>
      </Stack>
      <Box ref={scrollRef} sx={{ flex: 1, overflowY: "auto", p: 2 }}>
        <Stack spacing={1.5}>
          {messages.map((m, i) => (
            <Box
              key={i}
              sx={{
                alignSelf: m.role === "user" ? "flex-end" : "flex-start",
                maxWidth: "85%",
                px: 1.5,
                py: 1,
                borderRadius: 2,
                bgcolor: m.role === "user" ? "primary.main" : "action.hover",
                color: m.role === "user" ? "primary.contrastText" : "text.primary",
              }}
            >
              <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>
                {m.content}
              </Typography>
            </Box>
          ))}
          {ask.isPending && (
            <Box
              sx={{
                alignSelf: "flex-start",
                px: 1.5,
                py: 1,
                borderRadius: 2,
                bgcolor: "action.hover",
                display: "flex",
                gap: 0.5,
              }}
            >
              {[0, 1, 2].map((i) => (
                <Box
                  key={i}
                  sx={{
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    bgcolor: "primary.main",
                    animation: "blink 1.4s ease-in-out infinite",
                    animationDelay: `${i * 0.15}s`,
                    "@keyframes blink": {
                      "0%, 80%, 100%": { opacity: 0.25 },
                      "40%": { opacity: 1 },
                    },
                  }}
                />
              ))}
            </Box>
          )}
        </Stack>
      </Box>
      <Divider />
      <Box sx={{ p: 1.5 }}>
        <Stack direction="row" spacing={1}>
          <TextField
            fullWidth
            size="small"
            placeholder="Ask the AI tutor…"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
            disabled={ask.isPending}
            inputProps={{ id: AI_TUTOR_INPUT_ID }}
          />
          <IconButton
            color="primary"
            onClick={send}
            disabled={!input.trim() || ask.isPending}
            aria-label="Send"
          >
            <SendIcon />
          </IconButton>
        </Stack>
      </Box>
    </Card>
  );
}

function RubricCard({ rubric }: { rubric: Assessment["rubric"] }) {
  const hasRubric = Array.isArray(rubric) && rubric.length > 0;

  return (
    <Card>
      <CardContent sx={{ p: 2.5 }}>
        <Typography variant="overline" color="text.secondary" sx={{ letterSpacing: "0.08em" }}>
          Marking
        </Typography>
        <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: hasRubric ? 1.5 : 1 }}>
          Rubric
        </Typography>
        {hasRubric ? (
          <Stack spacing={1.5}>
            {rubric!.map((r) => (
              <Box key={r.criterion}>
                <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {r.criterion}
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {r.weight}%
                  </Typography>
                </Stack>
                <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 0.5 }}>
                  {r.description}
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={r.weight}
                  color="primary"
                  sx={{ height: 4, borderRadius: 999 }}
                />
              </Box>
            ))}
          </Stack>
        ) : (
          <Typography variant="body2" color="text.secondary">
            No rubric attached. When your teacher shares one, it'll appear here with criteria and weights.
          </Typography>
        )}
      </CardContent>
    </Card>
  );
}
