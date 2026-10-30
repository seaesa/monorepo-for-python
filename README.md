# Monorepo: FastAPI · Next.js · Expo

| App / package         | Stack                                                                                                                   |
| --------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `apps/api`            | FastAPI modular monolith · SQLAlchemy 2 async + Alembic · PostgreSQL · Redis · Celery · Dishka DI · uv                  |
| `apps/web`            | Next.js 16 · shadcn/ui (base-maia) · Tailwind v4                                                                        |
| `apps/mobile`         | Expo SDK 58 · Expo Router · Uniwind (Tailwind v4) · React Native Reusables                                              |
| `packages/api-client` | Generated from OpenAPI: types, Zod, axios SDK, React Query options                                                      |
| `packages/core`       | Shared hooks, auth + preferences stores, form helpers, date/number utils (React Query · Zustand · RHF · Zod · date-fns) |
| `packages/i18n`       | Translations vi/en (i18next), shared by web and mobile                                                                  |
| `packages/theme`      | Design tokens → CSS for web (shadcn) and mobile (Uniwind)                                                               |

## What is in the box

- **Auth end to end:** register → verification email → login, refresh-token rotation with family
  revocation (reuse is detected), password reset and change, account deletion, optional soft
  verification gate, rate limiting on credential endpoints.
- **A reference feature (`todos`)** with ownership checks, cursor pagination, optimistic
  updates and realtime sync over Socket.IO.
- **Mobile platform:** push notifications (per-device language, dead-token cleanup), foreground
  location, EAS builds (APK, AAB, IPA) attached to a GitHub Release on every `v*` tag.
- **One contract:** Pydantic → OpenAPI → generated TS types, Zod schemas and React Query hooks;
  errors share one envelope (`code`, `message`, `details`, `requestId`) that the UI translates.
- **Both clients:** Next.js (App Router, i18n, error/loading/empty states) and Expo (same shared
  hooks, native auth screens).
- **Operations:** Dockerfiles for API and web, a full-stack compose file, Alembic migrations,
  Prometheus metrics, request ids, optional Sentry, CI running format, lint, dependency rules,
  spelling, duplication, dead code, types and tests.

## Quick start

Requirements: Docker and [mise](https://mise.jdx.dev) (`mise install` provides Node, pnpm, Python,
uv, gitleaks and oasdiff at the versions in `mise.toml`). No env file to copy: development values
are committed in `apps/*/.env.development`; put personal overrides in an ignored `.env`.

```bash
mise install
pnpm install
(cd apps/api && uv sync)
pnpm infra:up                  # Postgres + Redis + Mailpit
pnpm --filter api db:migrate

pnpm dev:web                   # API http://localhost:8000/docs + web http://localhost:3000
pnpm dev:mobile                # API + Expo (press i / a / w); native needs a dev build (custom fonts)
pnpm --filter api worker       # Celery worker (sends the verification emails)
```

Verification and reset emails land in Mailpit at http://localhost:8025 (the dev default
`EMAIL_BACKEND=console` only logs them).

## Documentation

| Guide                                                | What it covers                                                          |
| ---------------------------------------------------- | ----------------------------------------------------------------------- |
| [AGENTS.md](./AGENTS.md)                             | Rules, layering, "where does new code go", commands, definition of done |
| [docs/architecture.md](docs/architecture.md)         | Request lifecycle, auth, realtime, data access, observability           |
| [docs/adding-a-feature.md](docs/adding-a-feature.md) | End-to-end walkthrough using `todos` as the template                    |
| [docs/testing.md](docs/testing.md)                   | What deserves a test, backend and core suites, CI jobs                  |
| [docs/deployment.md](docs/deployment.md)             | Containers, env vars, scaling, security, mobile releases (EAS)          |
| [docs/conventions.md](docs/conventions.md)           | How to decide names, placement, comments and tests                      |

## Backend → frontend contract

```bash
pnpm codegen   # FastAPI OpenAPI → packages/api-client (types, zod, sdk, react-query)
```

Run it after any backend schema/route change and commit the result; CI fails if it is stale.
Same for `pnpm theme` after editing `packages/theme/src/tokens.ts`.

Commits go through git hooks (lefthook): staged files are formatted (oxfmt, ruff), linted (oxlint) and spell-checked, messages follow Conventional Commits (`feat(todos): …`). `pnpm check` runs every gate CI runs; make it pass before pushing.
