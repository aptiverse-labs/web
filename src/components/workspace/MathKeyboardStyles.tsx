"use client";

import GlobalStyles from "@mui/material/GlobalStyles";
import { useTheme } from "@mui/material/styles";

// Themes MathLive's virtual keyboard to match Aptiverse and trims it
// down to a sensible footprint.
//
// The keyboard renders as a viewport-fixed sibling of the math-field
// (it's appended to document.body), so its styles sit OUTSIDE the
// MathField component's sx scope. These styles inject the right CSS
// variables and a few targeted class overrides at the global level.
//
// MathLive 0.109 uses `--ml-virtual-keyboard-*` prefixed variables.
// Earlier versions used `--keyboard-*` / `--keycap-*` — we set both
// so the styles work if mathlive bumps versions.
export function MathKeyboardStyles() {
  const t = useTheme();
  const isDark = t.palette.mode === "dark";

  const surface = t.palette.background.paper;
  const border = t.palette.divider;
  const text = t.palette.text.primary;
  const mutedText = t.palette.text.secondary;
  const accent = t.palette.primary.main;

  // Tinted neutrals — keycaps need to read above the keyboard background
  // (which is background.paper); slightly elevated does the work.
  const keyBg = isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)";
  const keyBgHover = isDark ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.08)";

  return (
    <GlobalStyles
      styles={{
        // ─── Variables — 0.109 prefix ─────────────────────────────
        "body, :root": {
          "--ml-virtual-keyboard-background":                          surface,
          "--ml-virtual-keyboard-background-border":                   border,
          "--ml-virtual-keyboard-text":                                text,
          "--ml-virtual-keyboard-toolbar-background":                  surface,
          "--ml-virtual-keyboard-toolbar-text":                        mutedText,
          "--ml-virtual-keyboard-toolbar-text-active":                 accent,
          "--ml-virtual-keyboard-toolbar-background-hover":            keyBgHover,
          "--ml-virtual-keyboard-toolbar-background-selected":         "transparent",
          "--ml-virtual-keyboard-keycap-background":                   keyBg,
          "--ml-virtual-keyboard-keycap-background-active":            keyBgHover,
          "--ml-virtual-keyboard-keycap-background-pressed":           accent,
          "--ml-virtual-keyboard-keycap-text":                         text,
          "--ml-virtual-keyboard-keycap-text-active":                  text,
          "--ml-virtual-keyboard-keycap-text-pressed":                 t.palette.primary.contrastText,
          "--ml-virtual-keyboard-keycap-secondary-text":               mutedText,
          "--ml-virtual-keyboard-keycap-secondary-text-active":        accent,
          "--ml-virtual-keyboard-keycap-shift-background":             keyBgHover,
          "--ml-virtual-keyboard-keycap-shift-text":                   text,

          // ─── Variables — older prefix (defence in depth) ─────────
          "--keyboard-background":               surface,
          "--keyboard-text":                     text,
          "--keyboard-accent-color":             accent,
          "--keyboard-border":                   border,
          "--keyboard-toolbar-background":       surface,
          "--keyboard-toolbar-text":             mutedText,
          "--keyboard-toolbar-text-active":      accent,
          "--keyboardrow-background":            surface,
          "--keyboard-row-background":           surface,
          "--keycap-background":                 keyBg,
          "--keycap-background-active":          keyBgHover,
          "--keycap-background-hover":           keyBgHover,
          "--keycap-background-pressed":         accent,
          "--keycap-foreground":                 text,
          "--keycap-text":                       text,
          "--keycap-text-pressed":               t.palette.primary.contrastText,
          "--keycap-secondary-text":             mutedText,
          "--keycap-secondary-text-active":      accent,
          "--keycap-border":                     border,
          "--keycap-border-bottom-color":        border,
          "--keycap-modifier-background":        keyBgHover,
          "--keycap-modifier-text":              text,
          "--keycap-modifier-border":            border,
          "--keycap-shift-background":           keyBgHover,
          "--keycap-shift-color":                text,
          "--keycap-shift-text":                 text,
        },

        // ─── Direct class overrides for the bits the variables miss
        ".ML__keyboard": {
          backgroundColor: `${surface} !important`,
          borderTop: `1px solid ${border} !important`,
          boxShadow: isDark
            ? "0 -8px 24px rgba(0,0,0,0.5) !important"
            : "0 -8px 24px rgba(0,0,0,0.08) !important",
          // Keep the keyboard from eating the entire phone screen.
          // ~58vh on portrait phones still shows ~3 lines of editor
          // above; tablet/desktop stays at MathLive's default.
          maxHeight: "min(58vh, 360px) !important",
        },
        ".ML__keyboard .MLK__plate, .ML__keyboard .MLK__layer, .ML__keyboard .MLK__rows": {
          backgroundColor: `${surface} !important`,
        },

        // Toolbar tabs (123 / αβγ) — neutral text by default, accent
        // when active. Underline rather than fill.
        ".ML__keyboard .MLK__tab, .ML__keyboard .action": {
          color: `${mutedText} !important`,
          background: "transparent !important",
        },
        ".ML__keyboard .MLK__tab.is-active, .ML__keyboard .action.selected, .ML__keyboard .MLK__tab[aria-selected='true']": {
          color: `${accent} !important`,
          background: "transparent !important",
          borderBottom: `2px solid ${accent} !important`,
        },

        // Keycaps — uniform fill, divider borders, our 8px radius.
        ".ML__keyboard .MLK__keycap, .ML__keyboard .keycap": {
          backgroundColor: `${keyBg} !important`,
          color: `${text} !important`,
          border: `1px solid ${border} !important`,
          borderRadius: "8px !important",
          boxShadow: "none !important",
          fontWeight: 500,
        },
        ".ML__keyboard .MLK__keycap:hover, .ML__keyboard .keycap:hover": {
          backgroundColor: `${keyBgHover} !important`,
        },
        ".ML__keyboard .MLK__keycap:active, .ML__keyboard .MLK__keycap.is-pressed, .ML__keyboard .keycap.is-pressed": {
          backgroundColor: `${accent} !important`,
          color: `${t.palette.primary.contrastText} !important`,
          borderColor: `${accent} !important`,
        },
        // Small hint glyph above keys (y above x, ln above e, sin above π)
        ".ML__keyboard .MLK__keycap aside, .ML__keyboard .keycap aside, .ML__keyboard .MLK__keycap small": {
          color: `${mutedText} !important`,
          fontWeight: 500,
        },

        // Modifier keys (shift, backspace, arrows, enter) — slightly
        // heavier surface so the cluster reads at a glance.
        ".ML__keyboard .MLK__keycap.MLK__modifier, .ML__keyboard .action": {
          backgroundColor: `${keyBgHover} !important`,
        },
      }}
    />
  );
}
