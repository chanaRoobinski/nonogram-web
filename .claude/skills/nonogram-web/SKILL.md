---
name: nonogram-web
description: "Stage-by-stage runbook for building the nonogram-web React/TypeScript client (Vite, TanStack Query, generated OpenAPI types, Claude Design import). Use whenever working in this repo — read PROGRESS.md alongside it for current state, and follow one stage at a time per its own branch+PR."
disable-model-invocation: false
---

# Skill: Building the Nonogram Web Client (React/TypeScript Frontend)

## ⚠️ Read this first — no prior context assumed

If you are an AI agent or developer picking this file up **cold, with no memory of any previous
conversation**, this section gives you everything you need. Do not assume you know anything about
this project beyond what is written here and in `PROGRESS.md`.

**What this project is:** The web client for the Nonogram App. It consumes the REST API produced
by the `nonogram-app` backend (see `NONOGRAM_APP_SKILL.md` in that repo) and lets a user request a
puzzle at a chosen size/difficulty, play it on an interactive grid, and check their solution.

**Relationship to the backend:** This is a **separate repository and a separate codebase**
(`nonogram-web`). It does not import backend Python code. It talks to the backend exclusively
through HTTP, using types generated from the backend's OpenAPI schema (see Stage 0). The backend
must be running (or a mock server available) for most of the later stages to be testable
end-to-end.

**Your first action in any session:** Read `PROGRESS.md` in the `nonogram-web` project root (once
it exists — see Stage 0) before doing anything else. It is the single source of truth for what has
been done and what comes next. This skill file describes *how* to work; `PROGRESS.md` describes
*where things currently stand*.

**All prior open questions have been answered — nothing is pending here.** If you notice anything
in this document phrased as an unresolved question, treat that as a bug in the document and ask
the user before proceeding.

---

## 0. Locked technology decisions (do not change without explicit user approval)

| Decision | Value |
|---|---|
| Language | TypeScript (strict mode) |
| Build tool | Vite |
| UI framework | React |
| Server state / data fetching | TanStack Query |
| Local/UI state | React state (`useState`/`useReducer`); Zustand only if a real cross-component need arises — do not add it preemptively |
| API types | Generated from the backend's OpenAPI schema (`openapi-typescript`), never hand-written |
| Styling | Decide in Stage 0 and record the choice in `PROGRESS.md` (e.g. CSS Modules / Tailwind) — do not mix approaches once chosen |
| Visual design source | **The project owner's approved Claude Design project** (see "Approved visual design" below). The UI must be implemented to match this design — it is not a loose inspiration. Do not invent an alternative visual direction. |
| Testing (unit/component) | Vitest + React Testing Library |
| Testing (end-to-end) | Playwright |
| CI | GitHub Actions — runs automatically on every push and pull request |
| Repository | GitHub, public, repo name `nonogram-web` |
| License | MIT |
| GitHub auth | Uses the GitHub CLI (`gh`). If `gh auth status` fails or shows an expired token, run `gh auth login` before doing anything else that touches GitHub. |

### 0.1 Approved visual design (Claude Design project) — binding

The project owner has designed the app's base screen in **Claude Design**. That design is the
**authoritative visual specification** for this client. Treat it the same way you treat the
generated API types: an external source of truth you import and conform to, never something you
hand-redraw from memory.

**How to access it:**

1. Connect the Claude Design MCP server: `https://api.anthropic.com/v1/design/mcp`
   (authenticate via `/design-login` if not already authenticated).
2. Import the project from:
   `https://claude.ai/design/p/e034e5c7-7502-4400-be8a-cdb77ab83b28?file=%D7%A0%D7%95%D7%A0%D7%95%D7%92%D7%A8%D7%9E%D7%94.dc.html`
3. The file to implement is: **`נונוגרמה.dc.html`**

**Binding rules for using the design:**

- **Import first, build second.** Do this in Stage 0 (see step 4) so the design's tokens
  (colors, spacing, typography, cell sizing, clue styling) inform the Stage 0 styling decision,
  instead of retro-fitting them later.
- **Extract, don't copy-paste.** Translate the design into the project's chosen styling approach
  (CSS Modules / Tailwind per the Stage 0 decision) and into proper React components. Do not dump
  the exported `.dc.html` into the repo as-is — it is a design artifact, not application code.
- **Fidelity checkpoints:** Stage 2 (static board) and Stage 4 (game flow) each include an explicit
  "compare against the imported design" step in their Definition of Done.
- **Design gaps = decisions, not guesses.** If a screen/state you need is *not* covered by the
  design (e.g. error states, loading, difficulty-mismatch banner), that is exactly the kind of
  decision Section 1, rule 7 covers: record it in `PROGRESS.md` under "Blockers / decisions
  needed" and ask the project owner — do not improvise a visual direction for it.
- **If the MCP import fails** (auth expired, project unavailable), record it as a blocker in
  `PROGRESS.md` and ask the user. Do not proceed to visual implementation from memory or from a
  screenshot description.

**Rationale note (for context, not something to re-litigate):** Backend types are generated, not
hand-written, so that any change to the FastAPI/Pydantic schemas is caught at compile time in the
client instead of surfacing as a runtime bug. Board rendering starts as DOM/CSS Grid (see Stage 2)
because it is simplest and most accessible for the sizes in scope now; a Canvas/SVG renderer is
future scope, not part of this MVP (see Section "Explicitly out of scope for now").

> **Explicitly out of scope for now:** Any image-upload screen (image-to-nonogram) — the backend
> only has a stub `image_recognition` interface, nothing to call yet. A high-performance
> Canvas/SVG board renderer for very large grids (30×30+) — start with DOM/CSS Grid; revisit only
> if a real performance problem is measured. Do not build either as part of this skill.

---

## 1. Binding working principles

1. **Every stage = its own branch + its own PR.** Never work directly on `main`, except for the
   one-time exception described in Stage 0 step 13 (initial scaffolding push).
2. **Never move to the next stage until the current one is fully green**: all tests pass, CI is
   green, and the PR for that stage has been merged into `main`.
3. **Every component/module gets tests before its stage is considered closed** — component tests
   for UI pieces, unit tests for pure logic (e.g. client-side clue validation), and Playwright
   coverage for the flows defined per stage.
4. **`PROGRESS.md` is updated at the end of every stage**, and ideally at meaningful checkpoints
   within a stage too. It is the only source of truth for project state — more authoritative than
   this file for "where are we now," though this file remains authoritative for "how do we work."
5. **Commit messages** follow Conventional Commits: `feat:`, `fix:`, `test:`, `docs:`, `chore:`,
   `refactor:`.
6. **No skipping stages.** The dependency chain in Section 16 explains why each stage needs the
   ones before it — most importantly, no interactive board work before the generated API types and
   the static board renderer exist.
7. **No guessing on significant decisions.** If you hit a design decision not covered by this
   document (exact cell-state model, how errors/timeouts from the API are surfaced, whether
   solution-checking happens live or on demand, etc.), stop, record it under "Blockers / decisions
   needed" in `PROGRESS.md`, and ask the user. Do not proceed on an assumption.
8. **The imported Claude Design project (Section 0.1) is the visual source of truth.** Any UI
   work in any stage must match it. Visual deviations require the project owner's explicit
   approval and must be recorded in `PROGRESS.md` under "Decisions made along the way."
9. **Never use `localStorage`/`sessionStorage` inside anything that must also run as a Claude
   Artifact preview** — this project is a real Vite app so real browser storage is fine here, but
   if any piece is ever prototyped as an Artifact, keep that prototype's storage in-memory only.

---

## 2. Project structure (created in Stage 0)

```
nonogram-web/
├── .github/
│   └── workflows/
│       └── ci.yml
├── src/
│   ├── api/
│   │   ├── generated/            # output of openapi-typescript — never hand-edited
│   │   ├── client.ts             # thin fetch/axios wrapper, base URL, error normalization
│   │   └── hooks/                # TanStack Query hooks: useGeneratePuzzle, useSolvePuzzle
│   ├── board/
│   │   ├── Board.tsx             # static rendering: grid + row/column clues
│   │   ├── Cell.tsx
│   │   ├── ClueList.tsx
│   │   ├── boardInteractions.ts  # click/drag-to-paint, keyboard input
│   │   └── cellState.ts          # UNKNOWN / FILLED / MARKED_EMPTY model + reducer
│   ├── game/
│   │   ├── GameScreen.tsx        # ties board + controls + puzzle-request flow together
│   │   ├── useGameState.ts       # undo/redo, timer, completion detection
│   │   └── PuzzleSetupForm.tsx   # size + difficulty selection → calls generate
│   ├── app/
│   │   ├── App.tsx
│   │   └── routes.tsx
│   ├── styles/                   # per Stage 0 styling decision
│   └── main.tsx
├── tests/
│   ├── unit/                     # cellState reducer, pure helpers
│   ├── component/                # Board, Cell, PuzzleSetupForm (RTL)
│   └── e2e/                      # Playwright: full generate → play → solve flows
├── docs/
│   └── design-tokens.md          # tokens extracted from the imported Claude Design project (Stage 0)
├── PROGRESS.md                   # *** state file — always read/update this ***
├── package.json
├── tsconfig.json
├── vite.config.ts
├── playwright.config.ts
├── .eslintrc / eslint.config.js
├── .gitignore
└── README.md
```

---

## 3. `PROGRESS.md` — the continuity protocol

Same purpose and same iron rule as in the backend project: **read it first, update it last, never
guess past a recorded blocker.**

Template for the file's contents:

```markdown
# Progress Tracker — Nonogram Web Client

## Current stage: Stage 2 — Static Board Rendering
## Status: In Progress
## Active branch: feature/stage-2-static-board
## Last updated: 2026-07-13

### Completed stages ✅
- [x] Stage 0 — Project Scaffolding, CI & Generated API Types   (PR #1, merged)
- [x] Stage 1 — API Client & Data Fetching Hooks                 (PR #2, merged)

### Current stage in progress 🔄
- [ ] Stage 2 — Static Board Rendering
  - [x] `Board.tsx` renders grid from `PuzzleResponse`
  - [x] `ClueList.tsx` renders row/column clues
  - [ ] Component tests for empty/partial/full grids
  - [ ] Self code review + run CI
  - [ ] Open PR

### Future stages ⏳
- [ ] Stage 3 — Interactive Board (click/drag, mark-empty, undo/redo)
- [ ] Stage 4 — Game Flow (setup form → generate → play → check solution)
- [ ] Stage 5 — UX Polish (timer, persistence, mobile/touch, responsive layout)
- [ ] Stage 6 — Accessibility & E2E Coverage
- [ ] Stage 7 — Documentation & Polish

### Decisions made along the way
- (example: "Decided cell state is a 3-value enum: UNKNOWN / FILLED / MARKED_EMPTY, undo/redo
  operates on this enum, not on booleans")

### Blockers / decisions needed
- (if a genuinely open question stopped work, record it here — do not guess an answer)
```

---

## 4. Stage 0 — Project setup & generated API types

### Goal
A working Vite + React + TypeScript skeleton, CI green, and a type-safe connection to the backend
established before any UI logic exists.

### Steps
1. Re-authenticate the GitHub CLI if needed (`gh auth login`, confirm with `gh auth status`).
2. Create the `nonogram-web` repository (public):
   `gh repo create nonogram-web --public --source=. --remote=origin`.
3. Scaffold with Vite (`npm create vite@latest . -- --template react-ts`).
4. **Import the approved design (Section 0.1):** connect the Claude Design MCP
   (`https://api.anthropic.com/v1/design/mcp`, auth via `/design-login`), import the project at
   `https://claude.ai/design/p/e034e5c7-7502-4400-be8a-cdb77ab83b28?file=%D7%A0%D7%95%D7%A0%D7%95%D7%92%D7%A8%D7%9E%D7%94.dc.html`,
   and study `נונוגרמה.dc.html`. Extract the design tokens (palette, typography, spacing, board
   cell dimensions, clue styling) into a written summary in `PROGRESS.md` or a
   `docs/design-tokens.md` note — this becomes the reference for all later stages.
5. Decide and record the styling approach (CSS Modules vs Tailwind vs other) in `PROGRESS.md` —
   this is a Stage 0 decision, not something to revisit ad hoc later. **The decision must be made
   in light of the imported design** (e.g. if the design maps cleanly to utility classes, Tailwind;
   if it's component-scoped, CSS Modules) — record the reasoning, not just the choice.
6. Install and configure: TanStack Query, ESLint + Prettier, Vitest + React Testing Library,
   Playwright, `openapi-typescript`.
7. Point `openapi-typescript` at the backend's `/openapi.json` (running locally or from a checked-
   in snapshot) and generate `src/api/generated/`. Add an npm script (`generate:api-types`) so this
   is a repeatable, explicit step — never hand-edit generated output.
8. Write a thin `src/api/client.ts` wrapper (base URL from an env var, consistent error shape).
9. Confirm CORS is enabled on the backend for the client's dev origin; if not, note this as a
   cross-repo blocker in `PROGRESS.md` and flag it to the user rather than working around it
   client-side.
10. Write `.github/workflows/ci.yml`: Node setup → `npm ci` → `npm run lint` → `npm run test` →
   `npm run build`.
11. Write the initial `PROGRESS.md` (template from Section 3).
12. First commit: `chore: initial project scaffolding`.
13. Push directly to `main` (this is the **only** stage where working directly on `main` is
    allowed — before any real logic exists).

### Tests for this stage
- CI runs successfully with one placeholder test.
- `npm ci && npm run build` succeeds from a clean clone.
- Generated types compile with no manual edits required.

### Definition of Done
- [ ] Repo exists on GitHub, public, with a README
- [ ] CI is green
- [ ] `src/api/generated/` compiles and matches the backend schema
- [ ] Claude Design project imported successfully; design tokens extracted and recorded
- [ ] `PROGRESS.md` updated to "Stage 0 complete, Stage 1 next"

---

## 5. Stage 1 — API client & data-fetching hooks

### Goal
A clean data layer the rest of the app can rely on, isolating all HTTP concerns from UI code.

### What to build
- `src/api/hooks/useGeneratePuzzle.ts` — TanStack Query mutation wrapping `POST /puzzles/generate`.
- `src/api/hooks/useSolvePuzzle.ts` — wrapping `POST /puzzles/solve`.
- Consistent loading/error/success handling shape used by both hooks.
- A mock/dev mode (e.g. MSW — Mock Service Worker) so component tests and early UI work don't
  require a live backend.

### Tests
- **Unit/component**: hooks tested against mocked responses (success, validation error, server
  error, timeout).
- **No E2E yet** — no UI to drive.

### Git
- Branch: `feature/stage-1-api-client`

### Definition of Done
- [ ] Both hooks covered by tests against mocked success and error responses
- [ ] PR merged, `PROGRESS.md` updated

---

## 6. Stage 2 — Static board rendering (`board/`)

### Goal
Render a puzzle (grid + row/column clues) from a `PuzzleResponse`, with no interactivity yet.

### What to build
- `cellState.ts`: the cell-state model. **Decide explicitly** whether this is the same 3-state
  enum used conceptually in the backend (`FILLED`/`EMPTY`/`UNKNOWN`) or a 4th player-facing state
  is needed (`MARKED_EMPTY`, i.e. "user marked this as empty on purpose" vs "untouched"). This is
  exactly the kind of decision Section 1, rule 7 requires recording, not guessing.
- `Board.tsx`: renders a grid of `Cell.tsx` from a `PuzzleResponse`, sized dynamically.
- `ClueList.tsx`: renders row clues (left) and column clues (top) from the same response.
- Pure DOM/CSS Grid rendering — no Canvas/SVG (see Section 0).
- **Visual implementation follows the imported Claude Design project (Section 0.1):** board layout,
  cell sizing, clue placement/typography, colors, and spacing come from `נונוגרמה.dc.html` and the
  design tokens extracted in Stage 0 — not from ad-hoc styling. If the design and the data model
  disagree (e.g. the design shows a fixed size but the API supports multiple sizes), record the
  question in `PROGRESS.md` and ask the project owner.

### Tests
- **Component**: renders correctly for a small grid, an empty puzzle, and a fully-filled puzzle;
  clue lists match the puzzle's clue arrays exactly.

### Git
- Branch: `feature/stage-2-static-board`

### Definition of Done
- [ ] Board renders correctly at multiple sizes (e.g. 5×5, 10×10, 15×15)
- [ ] **Side-by-side visual comparison against the imported design performed** — rendered board
      matches `נונוגרמה.dc.html`; any intentional deviations approved by the project owner and
      recorded in `PROGRESS.md`
- [ ] Cell-state model decision recorded in `PROGRESS.md`
- [ ] PR merged, `PROGRESS.md` updated

---

## 7. Stage 3 — Interactive board

### Goal
Turn the static board into a playable one.

### What to build
- `boardInteractions.ts`: click-to-toggle a cell, drag-to-paint a run of cells, right-click (or a
  dedicated mode toggle, for touch) to mark a cell as "empty," keyboard navigation and input as an
  accessibility baseline (not deferred to Stage 6 — wire the handlers now, polish later).
- Undo/redo stack operating on discrete user actions (not per-pixel drag events).
- A pure reducer for cell-state transitions so board logic is testable independent of React/DOM
  event handling.

### Tests
- **Unit**: the reducer — every legal transition, undo/redo sequences, drag-paint producing the
  expected run of changes.
- **Component**: simulated click/drag/keyboard sequences produce the expected visual state.

### Git
- Branch: `feature/stage-3-interactive-board`

### Definition of Done
- [ ] Reducer has full unit coverage of state transitions
- [ ] Undo/redo verified by tests
- [ ] PR merged, `PROGRESS.md` updated

---

## 8. Stage 4 — Game flow

### Goal
Connect setup → generation → play → solution-checking into one coherent screen.

### What to build
- `PuzzleSetupForm.tsx`: size + difficulty selection, calls `useGeneratePuzzle`.
- `GameScreen.tsx`: orchestrates the fetched puzzle, the `Board`, a timer, and a "check solution"
  action.
- **Resolved (2026-07-19, project owner):** correctness is checked **only on explicit user
  action** — a "check solution" button and a separate "hint" button (see design's ✓ בדיקה / רמז
  buttons) — never live/continuously while the user plays. No live-diffing logic needed.
- **Solution acquisition for hint/check:** both actions need the actual solution, which
  `POST /puzzles/generate` deliberately withholds. Lazily call `POST /puzzles/solve` with the
  puzzle's own row/col clues the **first time the user clicks either "hint" or "check"** (not
  eagerly on generate), cache the result client-side for the rest of that puzzle's session, and
  reuse it for subsequent hint/check clicks without re-fetching. See `docs/design-tokens.md` for
  why this needs no backend change (open efficiency question tracked in `PROGRESS.md` — resolve
  before or during this stage, not after).
- **Manual puzzle creation ("create your own"/עריכה):** an alternate path into the same
  `GameScreen`, alongside "generate": the user paints a solution grid directly (no backend call),
  the client derives row/col clues from that grid with the same run-length logic the solver
  itself uses conceptually, and play proceeds identically to a generated puzzle from that point
  on. Entirely client-side — no backend involvement.
- Clear handling of the generator's "closest match / didn't hit exact difficulty" flag from the
  backend (Stage 6 of the backend skill) — the UI must surface this to the user, not hide it.
- **Screen composition follows the imported design (Section 0.1):** the setup form, controls, and
  overall screen layout implement `נונוגרמה.dc.html`. For states the design does not cover
  (loading, errors, the difficulty-mismatch banner), follow the design's existing tokens/visual
  language and record each such extension in `PROGRESS.md` — do not invent a new visual direction.

### Tests
- **Component**: setup form validation, loading/error states while generating; manual edit mode
  (draw → derive clues → play).
- **Unit**: the run-length clue-derivation helper used by manual edit mode.
- **E2E (first Playwright suite)**: request a puzzle, make some moves, undo, use hint, check
  solution, complete it, verify the success state appears.

### Git
- Branch: `feature/stage-4-game-flow`

### Definition of Done
- [ ] Full generate → play → complete flow covered by an E2E test
- [ ] Hint and check-solution both work via a single lazily-fetched, cached solution
- [ ] Manual puzzle creation flow covered by a component test
- [ ] Difficulty-mismatch flag from backend is visibly surfaced in the UI
- [ ] **Full-screen visual comparison against the imported design performed**; deviations approved
      and recorded in `PROGRESS.md`
- [ ] PR merged, `PROGRESS.md` updated

---

## 9. Stage 5 — UX polish

### Goal
Make the app pleasant and usable beyond the happy path.

### What to build
- Timer display and (if decided) pause/resume.
- Progress persistence across page reloads using real browser `localStorage` (this is a real
  browser app, not an Artifact — real storage APIs are appropriate here).
- **Records & history** (design's שיאים והיסטוריה modal): best completion time per
  size+difficulty combination, and a recent-games list (time + mistake count), both
  `localStorage`-backed — the same persistence mechanism as progress-saving above, just a second
  key/shape. Entirely client-side, no backend involvement.
- **Zoom controls** (design's +/− buttons near the board): adjust board cell size within the
  fitted viewport size computed for the current grid, not a separate independent zoom — matches
  the design's own `zoom` multiplier approach.
- **Print** (design's הדפסה button): `window.print()` plus a print stylesheet that hides
  chrome/controls and shows just the board + clues, per the print rules already sketched in the
  imported design's `<style>` block.
- Responsive/touch-friendly layout for mobile (drag-to-paint must work with touch events, not only
  mouse events).
- Visual feedback for a completed row/column.

### Tests
- **Component**: persistence round-trip (save → reload → state restored); records/history
  read-modify-write round-trip; zoom bounds (min/max clamping).
- **E2E**: a touch-simulated drag-paint interaction on a mobile viewport.

### Git
- Branch: `feature/stage-5-ux-polish`

---

## 10. Stage 6 — Accessibility & E2E coverage

### Goal
Ensure the app is usable via keyboard/screen reader and that the critical flows are protected by
E2E tests before calling the client "done."

### What to build
- ARIA roles/labels for the grid and clues, verified focus order, visible focus states.
- Full keyboard-only playthrough support (already partially wired in Stage 3 — this stage closes
  any gaps and adds automated checks, e.g. `axe-core` in CI).
- Expanded Playwright suite: error states (backend down, generation timeout), all difficulty
  levels, at least one large-grid performance sanity check.

### Tests
- **E2E**: the expanded suite above.
- Automated accessibility scan integrated into CI (not just a manual check).

### Git
- Branch: `feature/stage-6-accessibility-e2e`

---

## 11. Stage 7 — Documentation and polish

- Full `README.md`: installation, running the dev server, running against a local backend,
  running tests, the `generate:api-types` workflow.
- Brief architecture note: how `api/`, `board/`, and `game/` relate.
- Close out `PROGRESS.md` with "all stages complete, MVP ready."

---

## 12. PR template (use for every stage)

```markdown
## Stage: [stage number and name]

### What was done
- ...

### How it was verified
- [ ] Local unit/component tests pass
- [ ] Local E2E tests pass (if applicable to this stage)
- [ ] CI is green

### Related PROGRESS.md update
Updates status to: [...]
```

---

## 13. Protocol for resuming work after a break (critical)

Every time you start a new work session on this project:

1. `git status` + `git branch` — confirm where you are.
2. Read `PROGRESS.md` — what's the current stage, what's already done within it.
3. Run `npm run test` (and `npm run build`) locally — confirm the saved state is actually "green."
4. Check whether the current branch already has an open PR (`gh pr status`).
5. Confirm `src/api/generated/` is still in sync with the backend's current OpenAPI schema; if the
   backend has moved on since this branch started, re-run `generate:api-types` and note any
   breaking changes in `PROGRESS.md` rather than silently patching around them.
6. If the current stage involves UI work, confirm access to the imported Claude Design project
   (Section 0.1) still works and that the extracted design-token notes are available; if the
   project owner has updated the design since the last session, ask which version is authoritative
   before continuing.
7. Continue **exactly from the open checklist item** in the current stage in `PROGRESS.md` — do
   not start a new stage before the current one is closed.
8. If there are "Blockers / decisions needed" recorded in `PROGRESS.md`, ask the user before
   proceeding.

---

## 14. Dependencies between stages (why this order, and not another)

```
Stage 0 (scaffolding + generated API types)
   ↓
Stage 1 (API client & hooks) ──→ everything data-related depends on this
   ↓
Stage 2 (static board) ──→ needs typed puzzle data from Stage 1; no interactivity yet
   ↓
Stage 3 (interactive board) ──→ needs a rendered board to attach interactions to
   ↓
Stage 4 (game flow) ──→ needs both generation (Stage 1) and a playable board (Stage 3)
   ↓
Stage 5 (UX polish) ──→ polish on top of a working game loop
   ↓
Stage 6 (accessibility & E2E) ──→ needs the full flow to exist to test it end-to-end
   ↓
Stage 7 (docs/polish)
```

**You cannot skip to Stage 4 without Stages 1–3 done** — a "generate a puzzle and play it" flow is
meaningless without typed data fetching and a board that can actually be interacted with.

---

*This document is a living document. If a significant decision is made during actual work that
contradicts or extends it, update this document itself — not just `PROGRESS.md`.*
