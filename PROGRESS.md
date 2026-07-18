# Progress Tracker — Nonogram Web Client

## Current stage: Stage 3 — Interactive Board
## Status: Complete
## Active branch: feature/stage-3-interactive-board (pending PR merge)
## Last updated: 2026-07-19

### Completed stages ✅
- [x] Stage 0 — Project Scaffolding, CI & Generated API Types (pushed directly to `main`, per
  Stage 0's one-time exception)
- [x] Stage 1 — API Client & Data Fetching Hooks
  - `useGeneratePuzzle` / `useSolvePuzzle`: thin `useMutation` wrappers over `postJson`
  - `QueryClientProvider` wired in `main.tsx`
  - MSW (`src/mocks/`) mocks both endpoints for tests; wired into `tests/setup.ts` via
    `setupServer`/`server.listen()` with `onUnhandledRequest: 'error'`
  - 9 tests covering success, 422 validation error, 500 server error, and network error for both
    hooks
- [x] Stage 2 — Static Board Rendering
  - `cellState.ts` (`CellState` 0/1/2 + `createEmptyGrid`), `lineRuns.ts` (pure run-length +
    clue-satisfied helpers, unit tested — also earmarked for reuse by Stage 4's manual edit mode)
  - `Cell.tsx`, `ClueList.tsx` (one reusable clue-strip component for both row/column
    orientation), `Board.tsx` (composes header + per-row clue-strip+cells, CSS Modules, mirrors
    the design's own flexbox structure exactly rather than switching to CSS Grid layout)
  - 18 tests: 11 unit (`lineRuns`), 7 component (`Board` at 5×5/10×10/15×15, empty puzzle, fully-
    filled puzzle, clue-text-matches-arrays, satisfied-clue styling)
  - Visual fidelity check performed via a local Playwright screenshot against a temporary demo
    puzzle mounted in `App.tsx` (replaced by real data in Stage 4) — caught and fixed a real bug:
    the board must force `direction: ltr` on itself (design's own `<main dir="ltr">`), otherwise
    the app shell's RTL inherits into the board and mirrors the clue-strip to the wrong side
- [x] Stage 3 — Interactive Board
  - `cellState.ts` extended with `nextCellState` (the 0→1→2→0 cycle) and a pure reducer
    (`boardReducer`/`createInitialBoardState`) with `PAINT_START`/`PAINT_CONTINUE`/`UNDO`/`REDO` —
    a whole drag gesture is one `PAINT_START` + N `PAINT_CONTINUE`s but only ONE history entry, so
    undo/redo operate on discrete user actions, never per-cell
  - `boardInteractions.ts`: `computeArrowTarget` (pure, unit tested) + `useBoardState` (the
    React hook wiring the reducer to mouse drag-to-paint and right-click mark-empty; owns no DOM
    access itself)
  - `Cell.tsx` is now a real `<button>` (native keyboard activation/focus, `aria-label`,
    `focus-visible` outline), with roving `tabIndex` (one active cell at a time) managed by
    `Board.tsx`
  - `Board.tsx` is now a controlled component: it no longer owns interactive state itself — the
    parent calls `useBoardState` and passes `grid` + the three mouse callbacks down, so
    Stage 4's `GameScreen` can wire its own undo/redo buttons and read the current grid for
    "check solution" without `Board` hiding that state
  - 21 new tests: 11 reducer unit tests (every transition, undo/redo, a drag producing exactly
    one history entry), 4 `computeArrowTarget` unit tests, 6 new Board interaction component
    tests (click, drag-paint + undo-reverts-the-whole-run, right-click, Enter-key activation,
    ArrowRight focus movement, disabled-button states) — full suite now 48 tests
  - Manually verified against the real design behavior via a local Playwright script driving
    click/drag/right-click/keyboard/undo in the running dev app — all matched expectations,
    including the right-click "✕" mark matching the design exactly

### Future stages ⏳
- [ ] Stage 4 — Game Flow (setup form → generate → play → check solution)
- [ ] Stage 5 — UX Polish (timer, persistence, mobile/touch, responsive layout)
- [ ] Stage 6 — Accessibility & E2E Coverage
- [ ] Stage 7 — Documentation & Polish

### Decisions made along the way

- **Styling approach: CSS Modules** (not Tailwind). The imported design's board/cell styling is
  computed at render time (cell pixel size derived from viewport + zoom; per-cell background is a
  runtime conditional on cell state), which doesn't map cleanly onto static Tailwind utility
  classes. CSS Modules for component/layout structure + CSS custom properties for the palette and
  type scale, with the genuinely dynamic per-render values (cell size, per-cell fill color) as
  inline `style` — mirrors how the source design itself is built. Full rationale and the extracted
  token values are in `docs/design-tokens.md`.
- **Cell-state model: 3 states — `UNKNOWN` (0) / `FILLED` (1) / `MARKED_EMPTY` (2)**, cycling
  `0 → 1 → 2 → 0` on click. Confirmed directly by the imported design's own prototype logic
  (`cellClick`: `(cur + 1) % 3`), not just inferred from the backend's conceptual 3-state model.
  Formal Stage 2 decision point closed early, since the design settled it unambiguously.
- **TypeScript pinned to `^5.9.2`**, not the `~6.0.2` `create-vite` scaffolded by default. TS 6.x
  is a pre-release-adjacent line and `openapi-typescript@7.13` (latest) only supports the TS `^5.x`
  peer range; forcing 6.x would mean `--legacy-peer-deps` masking a real incompatibility. TS
  5.9.2 is fully in "strict mode" per the skill's locked decision.
- **Vitest pinned to `^4.1.10`**, not the `^2.1.8` that would've been the naive default. Vitest 2.x
  only supports Vite up to v6 as a peer; this project's `vite` is `^8.1.1` (current), so 2.x would
  have installed a second, duplicate copy of Vite as a nested dependency — which broke `tsc -b`
  with cross-package type conflicts between `@vitejs/plugin-react`'s `Plugin` type (root Vite) and
  vitest's bundled Vite. Vitest 4.1.10 declares `vite: "^6.0.0 || ^7.0.0 || ^8.0.0"` as a peer,
  resolving to a single shared Vite install. `vite.config.ts` uses `defineConfig` from
  `vitest/config` (not `vite`) so the merged config type includes `test:` without a separate
  triple-slash reference.
- **`ApiError` uses explicit field declarations, not TS parameter-property shorthand
  (`constructor(public status: number)`)** — this project's TS config has `erasableSyntaxOnly`
  enabled (part of the strict-mode scaffold), which disallows parameter properties since they
  aren't erasable without affecting runtime. Not a stylistic choice — the literal shorthand fails
  the build.
- **CORS fixed at the backend** rather than worked around client-side: `nonogram-app` had no
  `CORSMiddleware` configured at all. Added it there (PR #11, merged), allowing
  `http://localhost:5173`. Per the skill's own instruction ("flag it... rather than working around
  it client-side"), and since this repo doesn't own the backend's app config.
- **`src/api/client.ts`'s `postJson` is a hand-written thin generic wrapper over `fetch`**, keyed
  by the generated `paths` type, rather than adopting `openapi-fetch` (openapi-typescript's
  companion runtime library). The skill only specifies "thin fetch/axios wrapper... consistent
  error shape" — not a specific runtime library — so this avoids introducing an additional
  dependency not covered by the locked technology decisions without asking first. Revisit if Stage
  1's hooks find the hand-written version awkward.
- **OpenAPI type generation uses a checked-in snapshot** (`openapi-snapshot.json` at the repo
  root, `npm run generate:api-types`), not a live `localhost:8000` server, since CI has no running
  backend. The snapshot was generated directly from the backend's `FastAPI` app object
  (`app.openapi()`), not by starting `uvicorn` — no server/network involved, so nothing to keep in
  sync beyond re-running the export when the backend schema changes.

- **Solution checking is on-demand only, never live** (project owner, 2026-07-19): "check
  solution" and "hint" are both explicit user-triggered actions (matches the design's ✓ בדיקה /
  רמז buttons) — the client never diffs the player's grid against the solution while they play.
  Closes Stage 4's own required decision point.
- **All design-surfaced features beyond the original 8 stages are now in scope** (project owner,
  2026-07-19): hint, manual "create your own puzzle" edit mode, print, records/history
  (localStorage), and zoom controls are all approved for this project, not deferred/cut. Folded
  into the existing stage plan rather than added as new stages — hint + manual edit mode into
  Stage 4 (both are core gameplay/setup concerns), records/history + zoom + print into Stage 5
  (all are polish on top of an already-working game loop, and records/history reuses Stage 5's own
  localStorage persistence work). See `NONOGRAM_WEB_SKILL.md` Stages 4 and 5 for the updated
  "What to build" lists.
- **Board layout mirrors the design's own flexbox structure exactly, not CSS Grid** — the skill's
  Section 0 rationale mentions "DOM/CSS Grid" contrasted with Canvas/SVG; read that as "a DOM-
  based grid of elements" (ruling out canvas), not a mandate for the literal CSS `grid` layout
  module, since the source design itself uses nested `display:flex` throughout with zero
  `display:grid`. Mirroring its actual DOM shape 1:1 makes visual-fidelity checks trivially
  correct instead of re-deriving alignment behavior from scratch with a different layout
  primitive.
- **`ClueList.tsx` renders a single clue-strip and takes an `orientation` prop**, reused for both
  each column header and each row's leading clue cell, rather than one component per axis. Matches
  the skill's naming while still letting `Board.tsx` interleave a row's clue-strip and its cells in
  one flex row (needed so they share a height via flexbox) — a single "handles the whole axis"
  component couldn't do that interleaving.
- **Cell size is a fixed, overridable default (32px) for now — no viewport/zoom-fit sizing yet.**
  The skill's "sized dynamically" (Stage 2) read as "grid dimensions follow the puzzle's row/col
  count" (obviously true), not "computed to fit the viewport in JS" — that formula is explicitly
  Stage 5's concern ("zoom controls... adjust board cell size within the fitted viewport size
  computed for the current grid"), which doesn't exist as a real layout to fit against until
  Stage 4's `GameScreen` exists anyway. Building the fit-to-viewport math now against a layout
  that doesn't exist yet would be guessing at Stage 4/5's actual container shape.
- **`App.tsx` currently mounts a hardcoded demo puzzle** (a diamond pattern, clues computed via
  `lineRuns.ts`) purely so Stage 2's required design-fidelity comparison had something real to
  screenshot. Explicitly temporary — Stage 4's `GameScreen` replaces this with real
  generate/play data. Now also exercises Stage 3's interactions (temporary undo/redo buttons)
  for the same reason — Stage 4 replaces these too with the real sidebar controls.
- **Interaction model reconciles the skill's original Stage 3 spec with the (simpler) imported
  design.** The design's own prototype only implements a single click cycling all 3 states —
  no drag-to-paint, no right-click at all. The skill's Stage 3 (written before the design existed)
  explicitly calls for click-to-toggle, drag-to-paint a run, *and* a distinct right-click/mode-
  toggle gesture for marking empty, plus keyboard input as a baseline (not deferred to Stage 6).
  Implemented the richer skill-specified model as a strict superset of the design's behavior, not
  a replacement: a plain click (mousedown+mouseup, no drag) reduces to exactly the design's own
  single-cell cycle, so it's still faithful to the design for that case; drag extends it to paint a
  run toward whatever state the *first* cell's click would have produced (standard nonogram
  drag-paint UX); right-click is an additive shortcut straight to `MARKED_EMPTY` that the design's
  own single-mockup-file simply never had reason to depict, not something it forbids. Not treated
  as a blocking ambiguity needing separate sign-off, since it's implementing the skill's own
  explicit, unambiguous instruction in a way that doesn't contradict anything the design actually
  shows.
- **Touch input and a "dedicated mode toggle" for marking empty on touch (skill's alternative to
  right-click) are intentionally NOT built in Stage 3** — the skill itself assigns "drag-to-paint
  must work with touch events, not only mouse events" to Stage 5 ("Responsive/touch-friendly
  layout for mobile"), so Stage 3 covers mouse + keyboard only, per that existing stage boundary.
- **Board becomes a controlled component in Stage 3**: it no longer calls `useBoardState` itself
  (that would hide the grid/undo/redo from anything outside `Board`). The parent calls the hook
  and passes `grid` + mouse callbacks down as props — necessary because the design puts undo/redo
  buttons in the *sidebar*, outside the board card entirely, and Stage 4's "check solution" needs
  read access to the current grid too.
- **Roving `tabIndex` (one focusable cell at a time, moved via arrow keys) implemented now in
  Stage 3**, not deferred to Stage 6's "verified focus order" — without it, a 15×15 board would put
  225 stops in the page's Tab order, which is a real usability problem, not just a nicety.
  Stage 6 still owns the full ARIA/screen-reader pass and automated `axe-core` checks; this is
  just the baseline keyboard-operability the skill's Stage 3 explicitly asked for.

### Design import (Stage 0 step 4) — completed 2026-07-19

Claude Design project "אפליקציית נונוגרמה" (`e034e5c7-7502-4400-be8a-cdb77ab83b28`) imported via
the design-system MCP tool (`get_project`/`get_file`, not `list_projects` — the project is type
`PROJECT_TYPE_PROJECT`, not a design-system project, so it doesn't appear in the general listing;
it had to be fetched directly by ID). File: `נונוגרמה.dc.html`. Full extracted token summary in
`docs/design-tokens.md`.

- **Hint/check solution acquisition: Option A, no backend change** (project owner, 2026-07-19).
  Client calls `POST /puzzles/solve` with the puzzle's own clues once per puzzle, on the first
  hint/check click, and caches the result client-side for the rest of that puzzle's session. No
  `nonogram-app` changes. Revisit only if real-world latency on large/very-hard grids proves this
  a problem in practice.
- **"Consistent loading/error/success shape" (Stage 1) is satisfied by using TanStack Query's
  `useMutation` directly for both hooks**, rather than a hand-rolled wrapper around it — `mutate`/
  `data`/`error`/`isPending`/`isError`/`isSuccess` are already uniform across both hooks by
  construction. No extra abstraction layer added on top.
- **MSW is wired for tests only** (`src/mocks/` + `msw/node`'s `setupServer`, via `tests/setup.ts`)
  — not set up as a browser-level dev-mode mock (no `npx msw init` / service worker file in
  `public/`). The skill's "mock/dev mode... so component tests and early UI work don't require a
  live backend" is satisfied for tests; a browser dev-mock can be added later if working against a
  live local backend becomes inconvenient, but wasn't needed yet since the backend already runs
  locally and CORS is fixed.

### Blockers / decisions needed

- (none currently open)
