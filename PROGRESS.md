# Progress Tracker — Nonogram Web Client

## Current stage: Stage 0 — Project Scaffolding, CI & Generated API Types
## Status: Complete
## Active branch: main
## Last updated: 2026-07-19

### Completed stages ✅
- [x] Stage 0 — Project Scaffolding, CI & Generated API Types (pushed directly to `main`, per
  Stage 0's one-time exception)

### Future stages ⏳
- [ ] Stage 1 — API Client & Data Fetching Hooks
- [ ] Stage 2 — Static Board Rendering
- [ ] Stage 3 — Interactive Board (click/drag, mark-empty, undo/redo)
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

### Design import (Stage 0 step 4) — completed 2026-07-19

Claude Design project "אפליקציית נונוגרמה" (`e034e5c7-7502-4400-be8a-cdb77ab83b28`) imported via
the design-system MCP tool (`get_project`/`get_file`, not `list_projects` — the project is type
`PROJECT_TYPE_PROJECT`, not a design-system project, so it doesn't appear in the general listing;
it had to be fetched directly by ID). File: `נונוגרמה.dc.html`. Full extracted token summary in
`docs/design-tokens.md`.

### Blockers / decisions needed

- **Design shows a feature surface beyond the current 8-stage plan** — a hint action, a manual
  "create your own puzzle" edit mode, a print button, a records/history modal (best times +
  recent games, `localStorage`-backed), and button-based zoom controls. None of these appear in
  Stages 1–7 as currently written. **Not yet decided**: are these in scope for this project (as
  new stages, e.g. inserted after Stage 5), or explicitly out of scope for the MVP (like the
  image-upload screen already is)? Do not build any of them until the project owner decides — see
  `docs/design-tokens.md` → "Feature surface shown in the design..." for the full list.
- **Live vs. on-demand solution checking (Stage 4's own required decision) is informed but not yet
  made.** The design's hint/instant-wrong-flash features assume the client already knows the full
  solution (the prototype generates puzzles in-browser, so `this.state.solution` is always
  available). Our real `POST /puzzles/generate` deliberately withholds the solution. The clues
  returned are sufficient to also call `POST /puzzles/solve` once to obtain the actual solution
  for hint/instant-feedback use — no backend change needed — but *when* to make that call (eagerly
  after generate vs. lazily on first hint/check) still needs an explicit decision at Stage 4, per
  the skill's own rule. See `docs/design-tokens.md` → "Architectural note...".
