# nonogram-web

React/TypeScript web client for the [nonogram-app](https://github.com/chanaRoobinski/nonogram-app)
backend. See `NONOGRAM_WEB_SKILL.md` (installed as a project skill at
`.claude/skills/nonogram-web/`) for the full stage-by-stage build plan, and `PROGRESS.md` for
current status.

## Development

```bash
npm install
npm run dev
```

Requires the backend running locally at `http://localhost:8000` (see `.env.example` for the
`VITE_API_BASE_URL` override).

## Scripts

- `npm run dev` — start the Vite dev server
- `npm run build` — type-check and build for production
- `npm run lint` — ESLint
- `npm run test` / `npm run test:watch` — Vitest
- `npm run e2e` — Playwright
- `npm run generate:api-types` — regenerate `src/api/generated/` from `openapi-snapshot.json`

A full README (architecture, testing guide) lands in Stage 7 per the project skill.
