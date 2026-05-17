// Motion presets. One source of truth so every page springs the same
// way and nobody hand-rolls another set of curves.
//
// The values here are deliberate — they match the emil-kowalski rubric
// in .claude/skills/emil-kowalski/SKILL.md. If you find yourself wanting
// a faster / bouncier / slower variant, add it here with a name that
// explains *when* it's used, not what it looks like (good: "modal",
// "press", "reorder". bad: "fast", "snappy", "v2"). One named preset
// per intent, used everywhere.

import type { Transition, Variants } from "framer-motion";

// Standard entry: 8px rise, fade in. Spring tuned to feel calm — fast
// enough to not feel sluggish, slow enough to read.
//
// Use as: <motion.div {...enter}>...</motion.div>
export const enter = {
  initial: { opacity: 0, y: 8 } as const,
  animate: { opacity: 1, y: 0 } as const,
  transition: { type: "spring", stiffness: 300, damping: 30 } satisfies Transition,
};

// Staggered entry for lists / grids. Build with: enterStagger(index).
// Keep the per-item delay short — 40ms is enough to read as a wave,
// 100ms+ becomes an animation people sit through.
export const enterStagger = (index: number) => ({
  initial: { opacity: 0, y: 8 } as const,
  animate: { opacity: 1, y: 0 } as const,
  transition: {
    type: "spring",
    stiffness: 300,
    damping: 30,
    delay: Math.min(index, 8) * 0.04,
  } satisfies Transition,
});

// Drawers, sheets, modal surfaces — slide a little further than a card
// and use a slightly snappier spring so the affordance reads.
export const slideUp = {
  initial: { opacity: 0, y: 16 } as const,
  animate: { opacity: 1, y: 0 } as const,
  exit:    { opacity: 0, y: 16 } as const,
  transition: { type: "spring", stiffness: 380, damping: 32 } satisfies Transition,
};

// Press / tap feedback. Apply to whileTap on any clickable surface that
// needs explicit confirmation (CTAs, drawer toggles, bell icons). Subtle
// — anything bigger than 0.97 looks like a stamp.
export const press = {
  whileTap: { scale: 0.97 },
  transition: { type: "spring", stiffness: 500, damping: 30 } satisfies Transition,
};

// Variants form for orchestrated reveals (parent fades, children stagger).
// Use when a section reveals its children in sequence on mount — most
// pages don't need this; reach for it on hero composes or dashboards
// with a clear "look at this first, then this" rhythm.
export const containerStagger: Variants = {
  initial: {},
  animate: {
    transition: { staggerChildren: 0.05 },
  },
};

export const itemReveal: Variants = {
  initial: { opacity: 0, y: 8 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 300, damping: 30 },
  },
};
