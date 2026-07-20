# Architecture

Three layers under `src/`, plus `App.tsx`/`main.tsx` wiring them together. Each layer only
depends on the one below it — `game/` imports from `board/` and `api/`, `board/` imports from
`api/` types only, `api/` depends on nothing else in `src/`.

```
main.tsx → App.tsx → game/GameScreen.tsx
                        ├── game/PuzzleSetupForm.tsx
                        ├── game/PlayArea.tsx
                        │     ├── board/Board.tsx (+ Cell.tsx, ClueList.tsx)
                        │     ├── game/useGameState.ts ─── board/useBoardState (boardInteractions.ts)
                        │     ├── game/useFittedCellSize.ts (from board/)
                        │     ├── game/WinModal.tsx, RecordsModal.tsx (game/useModalA11y.ts)
                        │     └── game/persistence.ts, records.ts
                        └── manual edit mode (Board.tsx reused with a local draw handler)

useGameState / manual edit mode → api/hooks/useGeneratePuzzle, useSolvePuzzle → api/client.ts
                                                                                   → api/generated/schema.ts
```

## `api/` — typed backend access

- `generated/schema.ts` — output of `openapi-typescript`, never hand-edited (see the README's
  "Regenerating API types" section).
- `client.ts` — a thin `postJson<Path>()` wrapper over `fetch`, generic over the generated `paths`
  type so request/response bodies are inferred rather than manually typed. Throws a uniform
  `ApiError` (message, HTTP status, parsed body) for both network failures and non-2xx responses.
- `hooks/useGeneratePuzzle.ts`, `hooks/useSolvePuzzle.ts` — thin TanStack Query `useMutation`
  wrappers around `postJson`. This is the only layer that knows the backend's request/response
  shapes; everything above it works with the plain `RowClues`/`ColClues`/`CellState[][]` types
  defined in `board/` and `game/`.
- `mocks/` — MSW request handlers used by `tests/setup.ts` in unit/component tests, so nothing in
  `src/` needs a real backend to be tested in isolation. Not used in the browser (dev/prod always
  talk to a real backend).

## `board/` — the puzzle grid as a self-contained, backend-agnostic UI

Knows nothing about HTTP, puzzle generation, or game rules beyond "what is a nonogram board."

- `cellState.ts` — the `CellState` enum (`UNKNOWN`/`FILLED`/`MARKED_EMPTY`, cycling 0→1→2→0) and
  `boardReducer`, a pure reducer with `PAINT_START`/`PAINT_CONTINUE`/`UNDO`/`REDO` actions. A whole
  drag gesture is one `PAINT_START` + N `PAINT_CONTINUE`s but a single history entry, so undo/redo
  operate on discrete user actions.
- `lineRuns.ts` — pure helpers: `runsOfLine` (derive a run-length clue from a line of cells),
  `isClueSatisfied`, `normalizeClue`. No React, no DOM — reused by both the board's own
  "line complete" styling and `game/manualPuzzle.ts`'s clue derivation.
- `boardInteractions.ts` — `useBoardState`, the hook wiring `boardReducer` to mouse drag-to-paint,
  right-click mark-empty, and keyboard navigation (`computeArrowTarget` for roving `tabIndex`).
  Also the ghost-touch-event guard (`markTouchInteraction`/`isLikelyGhostMouseEvent`) that stops
  synthetic post-touch mouse events from double-firing a paint action.
- `useFittedCellSize.ts` — `ResizeObserver`-based cell sizing to fit the board's actual rendered
  container, combined with a zoom multiplier.
- `Board.tsx` / `Cell.tsx` / `ClueList.tsx` — the presentational components. `Board` is a
  *controlled* component: it takes `grid` and callback props rather than calling `useBoardState`
  itself, so callers outside the board (the game layer's undo/redo buttons, check-solution) can
  read and drive the same state. ARIA grid semantics (`role="grid"`, `role="row"`,
  `role="gridcell"`, `role="rowheader"`/`"columnheader"`) live here.

## `game/` — puzzle flow, rules, and persistence on top of a board

Owns everything the design's actual screens need beyond "a grid you can paint": where a puzzle's
clues/solution come from, when a puzzle counts as solved, and cross-session state.

- `GameScreen.tsx` — the top-level screen. Owns which puzzle is loaded (generated or
  manually-drawn), restores a saved game from `persistence.ts` on mount (falling back to
  auto-generating a default puzzle), and switches between play mode and manual edit mode.
- `useGameState.ts` — wraps `board/useBoardState` with a timer, win detection, and on-demand
  `checkSolution`/`giveHint`. The `SolutionSource` type (`{ type: 'known'; solution }` for
  manually-drawn puzzles vs. `{ type: 'fetch' }` for generated ones) decides whether hint/check
  needs a `POST /puzzles/solve` round-trip or already has the answer locally. Persists to
  `localStorage` via `persistence.ts` on every relevant state change, and records a completed game
  via `records.ts` once per win.
- `PlayArea.tsx` — the actual play screen: action sidebar (timer, check/hint, undo/redo, reset,
  records, print, zoom) + `board/Board.tsx` + `WinModal.tsx`. Remounted (via a React `key`) on every
  new puzzle or "reset all," rather than adding extra reset actions to the board reducer.
- `PuzzleSetupForm.tsx` — size/difficulty controls + generate/manual-mode buttons.
- `persistence.ts`, `records.ts` — plain `localStorage` read/write helpers, no React.
- `manualPuzzle.ts` — validates a hand-drawn solution and derives its clues (via
  `board/lineRuns.ts`'s `runsOfLine`), for the manual "create your own puzzle" flow.
- `useModalA11y.ts` — shared focus-trap/Escape/focus-return hook used by `WinModal` and
  `RecordsModal`.

## Why this split

`board/` is the piece that most closely tracks the imported design's own board prototype and could
plausibly be reused by a different game shell (e.g. a different puzzle-flow UI) without change.
`game/` is everything that's specific to *this* app's rules — on-demand (not live) checking,
solution sourcing, persistence, records — layered on top rather than mixed into the board
component itself. `api/` stays a thin, dumb transport layer so a backend schema change only ever
requires regenerating `schema.ts` and, at most, touching the two hooks in `api/hooks/`.
