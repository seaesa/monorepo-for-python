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

## Quick start

Requirements: Node ≥ 20.9, pnpm 11, uv, Docker.

```bash
pnpm install
cp apps/api/.env.example apps/api/.env
(cd apps/api && uv sync)
pnpm infra:up                  # Postgres + Redis
pnpm --filter api db:migrate

pnpm dev:web                   # API http://localhost:8000/docs + web http://localhost:3000
pnpm dev:mobile                # API + Expo (press i / a / w); native needs a dev build (custom fonts)
pnpm --filter api worker       # Celery worker
```

## Backend → frontend contract

```bash
pnpm codegen   # FastAPI OpenAPI → packages/api-client (types, zod, sdk, react-query)
```

Run it after any backend schema/route change and commit the result; CI fails if it is stale.
Same for `pnpm theme` after editing `packages/theme/src/tokens.ts`.

Commits go through git hooks (husky): staged files are formatted (Prettier with import sorting, ruff) and linted, messages follow Conventional Commits (`feat(todos): …`). Run `pnpm format`, `pnpm knip`, `pnpm lint`, `pnpm typecheck`, `pnpm test` before pushing.

Architecture, rules and the "where does code go" guide are in [AGENTS.md](./AGENTS.md).
