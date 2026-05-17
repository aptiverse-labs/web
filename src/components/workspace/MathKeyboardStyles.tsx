"use client";

import GlobalStyles from "@mui/material/GlobalStyles";
import { useTheme } from "@mui/material/styles";

// Themes MathLive's virtual keyboard to match the app palette.
//
// Scope: ONLY paint. Earlier versions of this file forced
// max-height + position rules on .ML__keyboard, which fought
// MathLive's own positioning logic and put the keyboard above the
// editor on narrow viewports. Lesson learned — let MathLive own
// layout, we own colour.
//
// Sets both the modern (`--ml-virtual-keyboard-*`) and legacy
// (`--keyboard-*` / `--keycap-*`) variable prefixes so the colours
// apply regardless of the installed MathLive version.
export function MathKeyboardStyles() {
  const t = useTheme();
  const isDark = t.palette.mode === "dark";

  const surface = t.palette.background.paper;
  const border = t.palette.divider;
  const text = t.palette.text.primary;
  const mutedText = t.palette.text.secondary;
  const accent = t.palette.primary.main;
  const keyBg = isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)";
  const keyBgHover = isDark ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.08)";

  return (
    <GlobalStyles
      styles={{
        "body, :root": {
          // MathLive 0.107+ variables.
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

          // Pre-0.107 variable names — keep so we don't regress if the
          // dep gets downgraded.
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

        // The hint glyphs above keycaps (y above x, ln above e) read in
        // MathLive's default bright cyan even when the variables are
        // set, so override the colour by class.
        ".ML__keyboard .MLK__keycap aside, .ML__keyboard .MLK__keycap small, .ML__keyboard .keycap aside": {
          color: `${mutedText} !important`,
        },
        // Active toolbar tab — underline-in-accent rather than fill.
        ".ML__keyboard .MLK__tab[aria-selected='true'], .ML__keyboard .MLK__tab.is-active, .ML__keyboard .action.selected": {
          color: `${accent} !important`,
          borderBottom: `2px solid ${accent} !important`,
        },
      }}
    />
  );
}
