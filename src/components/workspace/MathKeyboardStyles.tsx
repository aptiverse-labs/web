"use client";

import GlobalStyles from "@mui/material/GlobalStyles";
import { useTheme } from "@mui/material/styles";

// MathLive's virtual keyboard renders as a sibling of the math-field
// (attached to document.body), so it lives outside the scope of any
// MathField sx prop. These globals theme it to match Aptiverse —
// primary teal accents instead of MathLive's default bright cyan,
// keycap colours matched to the page palette, divider borders.
//
// Mount this component once, anywhere in the tree, when the workspace
// (or any future page that exposes MathLive) renders. The styles tear
// down with the component, so they don't leak into pages that don't
// use the keyboard.
export function MathKeyboardStyles() {
  const t = useTheme();
  const isDark = t.palette.mode === "dark";

  // Tinted neutral one step away from background.paper — gives the
  // keycap surface enough contrast against the keyboard container.
  const keycapBg = isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)";
  const keycapBgHover = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)";
  const keycapBorder = t.palette.divider;
  const accent = t.palette.primary.main;
  const toolbarBg = t.palette.background.default;

  return (
    <GlobalStyles
      styles={{
        // Top-level keyboard wrapper. Some MathLive versions wrap in
        // body.ML__keyboard--visible; using both selectors covers it.
        "body, :root, .ML__keyboard": {
          "--keyboard-background":               t.palette.background.paper,
          "--keyboard-text":                     t.palette.text.primary,
          "--keyboard-accent-color":             accent,
          "--keyboard-border":                   keycapBorder,

          "--keyboard-toolbar-background":       toolbarBg,
          "--keyboard-toolbar-text":             t.palette.text.secondary,
          "--keyboard-toolbar-text-active":      t.palette.text.primary,
          "--keyboard-toolbar-background-selected":
            isDark ? "rgba(116,181,174,0.12)" : "rgba(15,105,99,0.08)",
          "--keyboard-toolbar-background-hover": keycapBgHover,

          "--keyboardrow-background":            t.palette.background.paper,
          "--keyboard-row-background":           t.palette.background.paper,

          "--keycap-background":                 keycapBg,
          "--keycap-background-active":          keycapBgHover,
          "--keycap-background-hover":           keycapBgHover,
          "--keycap-background-pressed":         accent,
          "--keycap-foreground":                 t.palette.text.primary,
          "--keycap-text":                       t.palette.text.primary,
          "--keycap-text-active":                t.palette.text.primary,
          "--keycap-text-pressed":               t.palette.primary.contrastText,
          "--keycap-text-hover":                 t.palette.text.primary,
          "--keycap-secondary-text":             t.palette.text.secondary,
          "--keycap-secondary-text-active":      accent,
          "--keycap-border":                     keycapBorder,
          "--keycap-border-bottom-color":        keycapBorder,

          "--keycap-modifier-background":        keycapBgHover,
          "--keycap-modifier-text":              t.palette.text.primary,
          "--keycap-modifier-border":            keycapBorder,
          "--keycap-modifier-border-bottom":     keycapBorder,

          "--keycap-shift-background":           keycapBgHover,
          "--keycap-shift-color":                t.palette.text.primary,
          "--keycap-shift-text":                 t.palette.text.primary,

          "--keyboard-shift-background":         keycapBgHover,
          "--keyboard-shift-text":               t.palette.text.primary,
        },

        // MathLive applies inline backgrounds on a few inner divs that
        // override our variables. Catch them by class so the surfaces
        // actually flip in dark mode.
        ".ML__keyboard": {
          backgroundColor: `${t.palette.background.paper} !important`,
          borderTop: `1px solid ${keycapBorder} !important`,
          boxShadow: isDark
            ? "0 -8px 24px rgba(0,0,0,0.4)"
            : "0 -8px 24px rgba(0,0,0,0.06)",
        },
        ".ML__keyboard .MLK__rows, .ML__keyboard .MLK__layer, .ML__keyboard .MLK__plate": {
          backgroundColor: `${t.palette.background.paper} !important`,
        },

        // Toolbar (123 / ∞≠∈ / abc / αβγ tabs) — make non-active
        // tabs less shouty, give the active tab the teal underline
        // rather than bright blue text.
        ".ML__keyboard .MLK__toolbar, .ML__keyboard .ML__keyboard--toolbar": {
          backgroundColor: `${toolbarBg} !important`,
          borderBottom: `1px solid ${keycapBorder} !important`,
        },
        ".ML__keyboard .MLK__toolbar .action, .ML__keyboard .action": {
          color: `${t.palette.text.secondary} !important`,
        },
        ".ML__keyboard .MLK__toolbar .selected, .ML__keyboard .action.selected": {
          color: `${accent} !important`,
        },

        // Keycaps — uniform background, divider borders, our radius.
        ".ML__keyboard .MLK__keycap, .ML__keyboard .keycap": {
          backgroundColor: `${keycapBg} !important`,
          color: `${t.palette.text.primary} !important`,
          border: `1px solid ${keycapBorder} !important`,
          borderRadius: "8px !important",
          boxShadow: "none !important",
          fontWeight: 500,
        },
        ".ML__keyboard .MLK__keycap:hover, .ML__keyboard .keycap:hover": {
          backgroundColor: `${keycapBgHover} !important`,
        },
        ".ML__keyboard .MLK__keycap:active, .ML__keyboard .MLK__keycap.is-pressed, .ML__keyboard .keycap.is-pressed": {
          backgroundColor: `${accent} !important`,
          color: `${t.palette.primary.contrastText} !important`,
        },
        // The little secondary hint above keys (y above x, ln above e).
        ".ML__keyboard .MLK__keycap aside, .ML__keyboard .keycap aside, .ML__keyboard .MLK__keycap small": {
          color: `${t.palette.text.secondary} !important`,
          fontWeight: 500,
        },

        // Modifier / shift / utility keys — slightly heavier than a
        // normal keycap so the cluster reads at a glance.
        ".ML__keyboard .MLK__keycap.MLK__modifier, .ML__keyboard .action": {
          backgroundColor: `${keycapBgHover} !important`,
        },
      }}
    />
  );
}
