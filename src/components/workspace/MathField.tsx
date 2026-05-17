"use client";

import { useEffect, useRef } from "react";
import Box from "@mui/material/Box";

// React wrapper around MathLive's <math-field> web component.
//
// MathLive ships its own custom element; we register it once on first
// mount (dynamic import so the ~250KB bundle only lands when a user
// actually opens a step-based editor for a maths/science subject).
//
// Why a wrapper and not <math-field> directly?
//   - The element is a custom element; TypeScript doesn't know its
//     attributes by default, so a typed wrapper keeps the call sites
//     clean.
//   - Custom elements use property setters for some fields (e.g.
//     value); React's JSX maps prop names to attributes which can
//     silently drop. Imperatively setting on the DOM node is the
//     reliable path.
//   - Listening for the input event from inside React is fiddly without
//     a ref + addEventListener.

type Props = {
  value: string;
  onChange: (latex: string) => void;
  placeholder?: string;
  /** Disable editing — useful for read-only previews. */
  readonly?: boolean;
  /** Aria label so screen readers know what this field is for. */
  ariaLabel?: string;
};

// Track whether MathLive has been registered globally so we don't
// double-import or re-register the custom element.
let registerPromise: Promise<void> | null = null;
function ensureMathLive(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (registerPromise) return registerPromise;
  registerPromise = import("mathlive").then(() => {
    // Side-effect import is enough — mathlive auto-registers
    // <math-field> on its own. Just await the chunk load.
  });
  return registerPromise;
}

export function MathField({
  value,
  onChange,
  placeholder,
  readonly,
  ariaLabel,
}: Props) {
  const hostRef = useRef<HTMLDivElement>(null);
  const fieldRef = useRef<HTMLElement | null>(null);
  // Latest onChange in a ref so the effect that wires the listener
  // doesn't tear down + rebuild on every parent render.
  const onChangeRef = useRef(onChange);
  useEffect(() => { onChangeRef.current = onChange; }, [onChange]);

  // Mount: create the math-field once MathLive has loaded.
  useEffect(() => {
    let cancelled = false;
    let cleanup: (() => void) | undefined;

    ensureMathLive().then(() => {
      if (cancelled || !hostRef.current) return;
      const host = hostRef.current;

      // If we've already mounted a field (e.g. from a previous run
      // that didn't clean up because the chunk was still loading), bail.
      if (fieldRef.current) return;

      const field = document.createElement("math-field") as HTMLElement;
      field.setAttribute("smart-mode", "true");
      if (placeholder) field.setAttribute("placeholder", placeholder);
      if (readonly) field.setAttribute("readonly", "");
      if (ariaLabel) field.setAttribute("aria-label", ariaLabel);
      (field as unknown as { value: string }).value = value;

      const onInput = () => {
        const v = (field as unknown as { value: string }).value;
        onChangeRef.current(v);
      };
      field.addEventListener("input", onInput);

      host.appendChild(field);
      fieldRef.current = field;

      cleanup = () => {
        field.removeEventListener("input", onInput);
        if (field.parentNode === host) host.removeChild(field);
        fieldRef.current = null;
      };
    });

    return () => {
      cancelled = true;
      cleanup?.();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // mount once

  // Reflect external value changes back into the field. Only update
  // when the field's current value diverges from the prop — otherwise
  // typing into the field would fight a re-render every keystroke.
  useEffect(() => {
    const field = fieldRef.current;
    if (!field) return;
    const current = (field as unknown as { value: string }).value;
    if (current !== value) {
      (field as unknown as { value: string }).value = value;
    }
  }, [value]);

  return (
    <Box
      ref={hostRef}
      sx={{
        "& math-field": {
          width: "100%",
          padding: "8px 12px",
          minHeight: 44,
          border: 1,
          borderColor: "divider",
          borderRadius: 1,
          backgroundColor: "background.paper",
          fontSize: "1rem",
          display: "block",
          // Caret + focus ring — match the rest of the app's
          // outlined-input look.
          "&:focus-within": {
            borderColor: "primary.main",
            outline: "none",
          },
        },
      }}
    />
  );
}
