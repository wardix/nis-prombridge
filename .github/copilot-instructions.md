# Copilot instructions — NIS-PromBridge

Purpose
- Short guide for Copilot/Copilot CLI sessions to find build/test/lint commands, high-level architecture, and repo-specific conventions.

Build, test, and lint commands
- Install deps: `bun install`
- Run (direct): `bun src/index.ts`
- Run (script): `bun run start`  # runs package.json "start" (which invokes Bun)
- Dev (watch): `bun run dev`  # runs "bun --watch src/index.ts"
- Format: `bun run format` (runs `biome format --write .`) or `biome format --write <file>`
- Tests: `bun test`
- Run a single test file: `bun test path/to/testfile.test.ts`
- Pre-commit: Husky + lint-staged runs `biome format --write` on staged *.{ts,js,json}

High-level architecture (big picture)
- Runtime & server: Bun + Hono. Entry point: `src/index.ts` which registers routes and calls `Bun.serve`.
- Routes: `src/routes/` contains Hono routers. `/sd` (service discovery) and `/metrics` (Prometheus text) are registered in `src/index.ts`.
- Service layer: `src/services/` holds SQL and business logic. `sd.service.ts` provides Service Discovery targets; `metrics.service.ts` updates metrics and exposes registries.
- Database: `src/db/client.ts` exports `sql` (bun:sql). Config values come from `src/config.ts` (Zod validation).
- Metrics: uses `prom-client`. Metrics are updated in services and exposed by routes (e.g., `/metrics/domains`).

Key conventions (project-specific)
- Use the exported `sql` from `src/db/client.ts` and *tagged template* queries: `await sql`SELECT ...``. Avoid concatenated/raw query strings.
- Place DB queries and data mapping in `src/services/*.service.ts`. SD logic belongs in `sd.service.ts` and must return `PrometheusTarget[]` for routes to expose.
- Metrics: define and update metrics inside `src/services/metrics.service.ts`. Use a dedicated registry when needed (e.g., `domainRegistry`). Use `Gauge` for timestamps and fluctuating counts.
- Routes: create a Hono router in `src/routes/<name>.routes.ts` and register it in `src/index.ts` via `app.route('/prefix', router)`.
- Formatting/style: follow `biome.json` (2-space indent, single quotes, semicolons: asNeeded). Run `bun run format` before committing.
- Environment: copy `.env.example` → `.env`. Bun auto-loads `.env` so don't use dotenv.

Where to look first
- `src/index.ts` — server + route registration
- `src/routes/sd.routes.ts`, `src/routes/metrics.routes.ts`
- `src/services/` — SD & metrics implementations
- `src/db/client.ts` — DB client & `sql`
- `src/config.ts` — env validation
- `README.md`, `GEMINI.md`, `CLAUDE.md` — project mandates and notes

Copilot CLI hints
- Use the repo docs (README.md, GEMINI.md) as authoritative source for mandates (Bun, Hono, bun:sql, Biome).
- Helpful CLI commands: `/init` to load repo instructions; `/plan` to outline changes; `/delegate` to open PRs from the session.

---
*Created automatically to help future Copilot sessions.*
