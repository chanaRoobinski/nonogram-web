# Design tokens — extracted from the imported Claude Design project

Source: Claude Design project "אפליקציית נונוגרמה" (`e034e5c7-7502-4400-be8a-cdb77ab83b28`),
file `נונוגרמה.dc.html`, imported 2026-07-19. This is a fully working prototype (not just a
mockup) — a self-contained puzzle implementation with its own JS state. We do **not** port its
logic; we port its visual language and translate the data flow to the real backend API.

## Styling approach decision (Stage 0)

**CSS Modules**, not Tailwind.

**Why:** The design's board/cell styling is fundamentally *computed*, not static utility classes —
cell size (`cellPx`) is derived at render time from viewport dimensions and zoom level, and cell
background color is a runtime conditional on cell state (empty / filled / wrong / editing).
Expressing that in Tailwind means arbitrary-value classes (`w-[42px]`, `bg-[oklch(...)]`)
everywhere, which throws away Tailwind's actual benefit (static, purge-able utility classes).
CSS Modules for static layout/component structure, CSS custom properties for the palette/type
scale, and plain inline `style` for the genuinely dynamic per-render values (cell pixel size,
per-cell fill color) — exactly how the source design itself does it.

## Color palette (as CSS custom properties, oklch)

```css
:root {
  /* Background */
  --ng-bg: oklch(0.95 0.02 75);              /* warm parchment page background */
  --ng-bg-dot: oklch(0.9 0.02 75);           /* dot-grid pattern dots, 14px spacing */
  --ng-surface: oklch(0.97 0.015 75);        /* sidebar background */
  --ng-surface-raised: oklch(0.99 0.01 75);  /* board card / modal background */
  --ng-surface-cell: oklch(0.99 0.005 75);   /* empty cell background */

  /* Ink / text */
  --ng-ink: oklch(0.28 0.03 50);             /* primary text */
  --ng-ink-muted: oklch(0.5 0.03 50);        /* secondary/label text */
  --ng-title: #68150c;                       /* title color (not oklch in source) */
  --ng-title-shadow: oklch(0.85 0.08 60);

  /* Borders */
  --ng-border: oklch(0.85 0.02 60);          /* soft divider / sidebar border */
  --ng-border-strong: oklch(0.3 0.03 50);    /* board outer border */
  --ng-cell-border: oklch(0.82 0.02 60);     /* thin cell border */
  --ng-cell-border-5: oklch(0.3 0.03 50);    /* thick border every 5th row/col */

  /* Cell states */
  --ng-cell-filled: oklch(0.3 0.03 50);
  --ng-cell-wrong: oklch(0.6 0.18 30);
  --ng-cell-mark-color: oklch(0.55 0.16 30); /* "X" mark for marked-empty */

  /* Clue text */
  --ng-clue-unmet: oklch(0.3 0.03 50);
  --ng-clue-met: oklch(0.65 0.03 60);        /* + strikethrough when a line's clue is satisfied */

  /* Buttons */
  --ng-btn-primary: oklch(0.45 0.03 50);
  --ng-btn-primary-hover: oklch(0.35 0.03 50);
  --ng-btn-neutral: oklch(0.35 0.03 50);
  --ng-btn-neutral-hover: oklch(0.28 0.03 50);
  --ng-btn-danger: #c75252;
  --ng-btn-danger-hover: oklch(0.48 0.17 30);
  --ng-btn-accent: #d17169;                  /* "generate new puzzle" */
  --ng-btn-accent-hover: oklch(0.52 0.17 45);
  --ng-btn-success: oklch(0.5 0.14 145);      /* edit-mode "finish" */
  --ng-btn-success-hover: oklch(0.44 0.15 145);

  /* Feedback */
  --ng-record-gold: oklch(0.55 0.16 45);
  --ng-modal-overlay: rgba(40, 30, 20, 0.55);
}
```

## Typography

- Body font: `Georgia, 'Times New Roman', serif`
- Display/title font: `'Suez One'` (Google Font — `https://fonts.googleapis.com/css2?family=Suez+One&display=swap`), used only for the app title
- Title: 32px, weight 400, letter-spacing 1px, `-1.5deg` rotation + a slow 4s wiggle keyframe, double text-shadow for a "stamped" look
- Clue numbers: font-size is **derived from cell size** (`cellPx * 0.32`, floor 9px), weight 700
- Body text sizes used: 11.5px (edit-mode hint), 12–13px (labels/buttons), 14–16px (primary actions/stats), 20–24px (modal headings), 32px (title), 40px (win emoji)

## Layout

- Three-column flex layout, RTL (`dir="rtl"` on the root), with the puzzle board itself forced `dir="ltr"` (so clue/cell ordering doesn't mirror).
- Left/right sidebars: fixed `210px` width (`min-width: 170px`), independently scrollable, `18px 14px` padding, `16px` gap between sections.
- Center (`main`): the board card, centered via `margin: auto`, floating zoom controls pinned to its top-left corner.
- Board card: `16px` padding, `2px` solid border, `10px` border-radius, a "sunken" double box-shadow (`0 4px 0 <border-tone>, 0 6px 14px rgba(0,0,0,0.08)`).
- **Cell size is computed, not fixed**: derived from available viewport space (`viewportW/H` minus sidebars/padding) divided by grid size + clue-strip size, clamped `[8px, 140px]`, multiplied by a user-controlled `zoom` factor (buttons, not a slider).
- Clue strips: thickness is a function of the *longest* clue list for that grid (`maxClueCount * 0.42 + 0.3`, in cell-size units) — so clue-strip size adapts to puzzle size/difficulty, not fixed.
- Grid lines: thin border every cell, a thicker (`2.5px`) border every 5th row/column for readability on large grids.

## Motion

- `ng-pop` — cell fill: scale 0.7→1 + fade in, 0.15s
- `ng-shake` — wrong-cell feedback: horizontal shake, 0.4s
- `ng-win` — win modal: scale pulse, 0.5s
- `ng-title-wiggle` — title: continuous slow rotation wiggle, 4s loop
- Buttons: `transform: translateY(-1px)` on hover, `scale(0.96)` on active, transitions `~0.12–0.15s ease`

## Cell states (informs Stage 2's cell-state model decision)

The prototype's cell values are `0` (empty/untouched), `1` (filled), `2` (marked-empty, rendered
as "✕"). That's the skill's own `UNKNOWN / FILLED / MARKED_EMPTY` 3-state model — confirmed by the
design, not just a backend-mirroring guess. Cell click cycles `0 → 1 → 2 → 0`.

## Feature surface shown in the design that the current 8-stage plan does not cover

Recorded here, **not decided** — see `PROGRESS.md` → "Blockers / decisions needed":

- A "hint" action that reveals one correct cell
- A manual "create puzzle" edit mode (draw your own solution, independent of the generator)
- Print button (`window.print()` with a print stylesheet already sketched in the design's `<style>`)
- A "records & history" modal (best times per size+difficulty, recent games list) backed by
  `localStorage`
- Zoom in/out controls (button-based, not the pinch/viewport-driven zoom implied nowhere in the
  skill)
- Live per-cell "wrong" flashing on-demand (not just a pass/fail at the end)

## Architectural note this design surfaces for Stage 4 (not resolved now)

The prototype knows the full solution client-side at all times (it generates puzzles in-browser).
Its "hint" and "check" features just read `this.state.solution` directly. Our real backend
deliberately withholds the solution from `POST /puzzles/generate` (see backend
`PROGRESS.md` — "so there's something to validate against"). The generator's clues are enough to
also call `POST /puzzles/solve` with those same clues to obtain the actual solution — so hint/instant-
feedback are still achievable without a backend change, just via an extra round-trip the design's
prototype didn't need. Exactly the live-vs-on-demand checking decision Stage 4 already calls out
for explicit sign-off — flagging here so it isn't re-discovered from scratch at that stage.
