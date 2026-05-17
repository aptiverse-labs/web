---
name: impeccable
description: Pre-merge quality bar for visible UI changes. Covers pixel discipline, state coverage, accessibility, responsive behaviour, and copy. Use whenever finishing a UI change before declaring it "done".
---

# Impeccable

A UI is impeccable when there is nothing left to remove and nothing obviously
missing. This skill is the checklist that separates "works on my screen" from
"ready to ship". Run it as a final pass before marking any UI change complete.

## The eight pillars

### 1. Pixel discipline

- Spacing follows a scale (`4 / 8 / 12 / 16 / 24 / 32 / 48 / 64`). No magic
  `13px` paddings or `27px` margins.
- Vertical rhythm is consistent within a section — same gap between every
  card, every row, every form field.
- Alignment: text baselines line up across columns; icons are vertically
  centred with the text they sit beside, not floating high or low.
- No `1px` half-borders rendering as fuzzy lines on hi-DPI. Use full pixel
  values or `0.5px` deliberately.

### 2. State coverage

Every interactive element has all of these designed (not defaulted):

- **Default** — what it looks like sitting there.
- **Hover** — desktop only; degrades to no-op on touch.
- **Focus-visible** — keyboard ring is mandatory; never `outline: none`
  without a replacement focus style.
- **Active / pressed** — a momentary feedback, not a permanent state.
- **Disabled** — clearly different from "loading"; cursor `not-allowed`,
  reduced opacity, no hover.
- **Loading** — never just a spinner replacing the button text. Skeleton
  shapes match the final content's layout.
- **Empty** — first-time state has its own art direction, not "no data".
- **Error** — what the user sees when the action fails; actionable message
  + a path forward.

If a page has fewer than 5 of these visited intentionally, it is not done.

### 3. Accessibility

- **Contrast**: WCAG AA minimum (4.5:1 body, 3:1 large text + UI). Test in
  light *and* dark.
- **Keyboard**: every action reachable by Tab; no traps; visible focus.
- **Labels**: every form field has an associated label (not just a
  placeholder); icon-only buttons have `aria-label`.
- **Heading order**: one `h1` per page; no jumping from `h2` to `h5`.
- **Motion**: respect `prefers-reduced-motion` — heavy animations
  collapse to fade-in.
- **Colour as the only signal**: never. Red error text also gets an icon
  or a clear "Error:" prefix. Active tab uses weight + underline, not just
  colour.

### 4. Responsive behaviour

- **Tested at three widths**: 360px (small phone), 768px (tablet),
  1280px+ (desktop). The component must look intentional at each, not
  "desktop layout squashed".
- **Touch targets**: 44px minimum on mobile. Buttons, links, icons-as-action.
- **No horizontal scroll** on body content at 360px.
- **Stacks gracefully**: 4-column grid becomes 2 on tablet, 1 on phone.
  Don't show only the first 2 of 4 with the rest cut off.
- **Tables** become cards on mobile or scroll horizontally inside a
  container — never let the page scroll horizontally.

### 5. Copy

- **Headings** are statements, not category labels. "Lift your maths to
  75%" beats "Goals".
- **Body** is short, active voice, second person ("Set a goal", not "Goals
  can be set").
- **Empty states** explain what this section is *for* in one sentence,
  then offer the first action.
- **Errors** name what went wrong + what to do. "Couldn't save — try again
  in a moment" beats "Error: 500".
- **Numbers**: locale-aware (`Intl.NumberFormat`), with units. "7h 12m",
  not "432 minutes".
- **Dates / times**: relative for recent ("2h ago"), absolute for old
  ("12 Apr"). Never raw ISO strings on a user-facing surface.

### 6. Performance

- **No layout shift** after initial render. Skeletons reserve the right
  dimensions.
- **Images** declare width + height attributes; `loading="lazy"` for
  below-the-fold.
- **No infinite spinners**. Every loading state has a timeout that
  transitions to an error state.
- **Bundle**: don't import an entire icon set when you need three icons.

### 7. Data integrity

- **No placeholder data** masquerading as real on a user-visible page.
  If the API isn't wired yet, the page either:
  - Shows the empty state with a clear "We're working on it" notice, or
  - Doesn't exist in production navigation yet.
- **No hardcoded names, dates, or stats** in production code. If the
  designer left "John Smith, 3.8/5, 12 days" in a mockup, the
  implementation reads from an API or shows skeleton/empty.

### 8. Dark mode parity

- Every page is **tested in both modes** by toggling the colour scheme.
- Colours come from semantic tokens (`primary.main`, `text.secondary`),
  not raw hex.
- Gradients have dark-mode variants; otherwise they wash out.
- Images / illustrations have a dark variant or live on a neutral card
  that works in both modes.

## The merge gate

A change does not merge until you have:

1. Visited every state defined above for the touched components.
2. Tested at 360 / 768 / 1280 widths.
3. Toggled dark mode and confirmed it still looks intentional.
4. Read the copy aloud — does it sound like a person, or a CRUD form?
5. Removed every comment, console.log, and `// TODO` left behind.
6. Confirmed no hardcoded data is shipping. Either it's real, or it's a
   skeleton + an empty state.

If any of those failed, the work is not impeccable yet.

## When to use this skill

- After implementing a new page or component, before marking the task done.
- During code review of UI changes — surface the items that were skipped.
- When inheriting a page that needs polishing — run the eight pillars top
  to bottom and fix what fails.
