# Monorepo: FastAPI + Next.js + Expo

Full-stack monorepo. **The backend's OpenAPI schema is the single source of truth**; web and
mobile consume it via a generated client and share all data/auth/form logic.

Read this file first, then the `AGENTS.md` of every directory you are about to touch. Nested
files override this one for their scope.

| Path                                                   | What                                                                           | Stack                                                                   | Rules                                                          |
| ------------------------------------------------------ | ------------------------------------------------------------------------------ | ----------------------------------------------------------------------- | -------------------------------------------------------------- |
| `apps/api`                                             | Backend, modular monolith                                                      | FastAPI, SQLAlchemy 2 async, Alembic, Dishka (DI), Redis, Celery, uv    | [apps/api/AGENTS.md](apps/api/AGENTS.md)                       |
| `apps/web`                                             | Web app                                                                        | Next.js 16 (App Router), shadcn/ui `base-maia`, Tailwind v4             | [apps/web/AGENTS.md](apps/web/AGENTS.md)                       |
| `apps/mobile`                                          | Mobile app (iOS/Android/web)                                                   | Expo SDK 58, Expo Router, Uniwind (Tailwind v4), React Native Reusables | [apps/mobile/AGENTS.md](apps/mobile/AGENTS.md)                 |
| `packages/api-client`                                  | **Generated** SDK: types, Zod schemas, React Query options                     | hey-api openapi-ts, axios                                               | [packages/api-client/AGENTS.md](packages/api-client/AGENTS.md) |
| `packages/core`                                        | Shared hooks, stores (auth, preferences), realtime socket, form helpers, utils | React Query, Zustand, RHF, Zod, date-fns                                | [packages/core/AGENTS.md](packages/core/AGENTS.md)             |
| `packages/i18n`                                        | Shared translations (vi, en) + i18next instance                                | i18next, react-i18next                                                  | [packages/i18n/AGENTS.md](packages/i18n/AGENTS.md)             |
| `packages/theme`                                       | Design tokens → generated CSS for web and mobile                               | Tailwind v4 (shadcn + Uniwind conventions)                              | [packages/theme/AGENTS.md](packages/theme/AGENTS.md)           |
| `packages/eslint-config`, `packages/typescript-config` | Shared tooling config                                                          |                                                                         |                                                                |

## How the layers connect

```
apps/api (Pydantic schemas + routes)
   │  pnpm codegen  (export openapi.json → generate)
   ▼
packages/api-client   types · zod schemas · sdk · React Query options/mutations   (generated)
   ▼
packages/core         feature hooks (useLogin, useTodos…), stores, form schemas, utils
   ▼                  + packages/i18n (messages)  + packages/theme (tokens)
apps/web  ·  apps/mobile   UI only: screens/components that call core hooks
```

- Field names are **camelCase on the wire** (Pydantic alias generator) and in TS. Python stays snake_case.
- Pydantic constraints (`min_length`, `EmailStr`, …) become Zod rules, so forms validate exactly like the backend.
- **Errors** use one envelope: `{ code, message, details }`. `code` is the `ErrorCode` enum (generated to a TS union); `details` is `FieldError[]` (`{ field, code, message, params }`) for 422 validation **and** for domain errors raised with `field=`. The frontend never shows server wording: `applyServerErrors` translates `errors.<code>` / `validation.<code>` from `packages/i18n` and puts each error on its field (or `root.server`). Adding an `ErrorCode` without translating it fails typecheck.

## Realtime (Socket.IO + Redis pub/sub)

Server: python-socketio mounted in the API (`/ws/socket.io`), Redis client manager for fan-out
across API instances and Celery. Client: `socket.io-client` in `packages/core` (same code for web
and RN). Events are user-addressed (`user:<id>` room), emitted after commit, typed end to
end through OpenAPI (`RealtimeEvents`). Default reaction: update React Query caches, so screens
stay live without extra code. Details: `apps/api/AGENTS.md` (Rules › Realtime), `packages/core/AGENTS.md`.

## Error handling flow (forms)

| Layer                             | Source of truth                                                                       | Shown where                                            |
| --------------------------------- | ------------------------------------------------------------------------------------- | ------------------------------------------------------ |
| Client validation                 | Zod schema generated from Pydantic constraints (+ UI-only refinements with i18n keys) | under the field, Zod messages localized via `z.config` |
| Server validation (422)           | Pydantic error `type` + `ctx` → `FieldError{code, params}`                            | under the field, `validation.<type>`                   |
| Domain error tied to an input     | `raise ConflictError(..., code=ErrorCode.EMAIL_TAKEN, field="email")`                 | under that field, `errors.<code>`                      |
| Domain error not tied to an input | `raise UnauthorizedError(code=ErrorCode.INVALID_CREDENTIALS)`                         | `FormRootError` alert, `errors.<code>`                 |
| Network / unknown                 | client codes `network_error`, `unknown_error`                                         | `FormRootError` alert                                  |

## Golden rules

1. **Never hand-write API types, fetch calls, or query keys.** Change the backend, run `pnpm codegen`, use the generated output.
2. **Never edit `packages/api-client/src/gen/**`.** It is overwritten on every codegen. CI fails if it is stale.
3. **Shared logic goes in `packages/core`, not duplicated in both apps.** Apps only contain UI and platform wiring (storage, env, navigation).
4. **No hard-coded UI text.** Every string goes through `t("…")` with keys in `packages/i18n` (vi + en, type-checked).
5. **No colors, radii or fonts defined in app CSS.** Tokens live only in `packages/theme/src/tokens.ts`; run `pnpm theme`. `pnpm theme` fails if an app stylesheet defines tokens (CLIs sometimes write them).
6. **One React version for the whole repo** (pinned via `overrides` in `pnpm-workspace.yaml` to what Expo requires). Never add a different `react`/`react-dom` version anywhere: shared packages are symlinked, and a second React copy causes "Invalid hook call".
7. Shared-state libraries (`react`, `@tanstack/react-query`, `zustand`, `react-hook-form`, `zod`, `axios`) are **peerDependencies** in packages and real dependencies in apps.
8. Follow the existing feature structure; do not introduce new libraries for something already covered (state → Zustand, server state → React Query, forms → RHF + Zod, dates → date-fns, HTTP → generated axios client).
9. Mobile dependencies with native code are installed with `npx expo install` (from `apps/mobile`), never plain `pnpm add`.
10. Icons: Hugeicons on both platforms (`@hugeicons/core-free-icons`), same icon names. No other icon library. Mobile imports icons one by one (`import Delete02Icon from "@hugeicons/core-free-icons/Delete02Icon"`) because Metro does not tree-shake (barrel = ~12k icons, +8MB bundle); ESLint enforces it.

## Where does new code go?

| You need…                                                       | Put it in                                                                                                                                          |
| --------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| New endpoint / field / validation rule                          | `apps/api/src/app/modules/<module>/` → then `pnpm codegen`                                                                                         |
| Hook that calls the API, cache invalidation, auth/session logic | `packages/core/src/features/<feature>/hooks.ts`                                                                                                    |
| Form schema (extend a generated Zod schema with UI-only fields) | `packages/core/src/features/<feature>/schemas.ts`                                                                                                  |
| Pure helper used by both apps (formatting, dates, numbers)      | `packages/core/src/lib/`                                                                                                                           |
| UI text                                                         | `packages/i18n/src/locales/en.ts` + `vi.ts`                                                                                                        |
| Color / radius / font change                                    | `packages/theme/src/tokens.ts` → `pnpm theme`                                                                                                      |
| Push an update to clients                                       | `Event` in `apps/api/src/app/modules/<m>/events.py` + `REALTIME_EVENTS` → `pnpm codegen` → handler in `packages/core/src/features/<f>/realtime.ts` |
| New error case from the API                                     | `ErrorCode` member in `apps/api/src/app/shared/schemas.py` → `pnpm codegen` → translate in `packages/i18n`                                         |
| Web screen/component                                            | `apps/web/src/app/…` (routes) + `apps/web/src/features/<feature>/components/`                                                                      |
| Mobile screen/component                                         | `apps/mobile/src/app/…` (routes) + `apps/mobile/src/features/<feature>/components/`                                                                |
| Web primitive (button, dialog…)                                 | `pnpm dlx shadcn@latest add <name> -c apps/web` → `apps/web/src/components/ui`                                                                     |
| Mobile primitive                                                | `npx @react-native-reusables/cli@latest add <name>` (in `apps/mobile`) → `src/components/ui`, then align it (see mobile AGENTS.md)                 |

## Workflow: adding a feature end to end

1. Backend module (models → schemas → repository → service → provider → router), register it in `apps/api/src/app/modules/__init__.py`. A module calls other modules only through their **service**.
2. `pnpm --filter api db:revision "describe change"` then `pnpm --filter api db:migrate`.
3. Tests in `apps/api/tests/`, run `pnpm --filter api test`.
4. `pnpm codegen` (the API server does **not** need to be running).
5. Hooks + schemas in `packages/core/src/features/<feature>/`, export them from its `index.ts` and add a subpath to `packages/core/package.json` `exports`.
6. Texts in `packages/i18n` (en + vi), UI in web and mobile using those hooks (`apps/*/src/features/<feature>/components`).
7. Verify (below).

## Commands (run from repo root)

```bash
pnpm install                 # JS deps (also links workspaces)
cd apps/api && uv sync       # Python deps
pnpm infra:up                # Postgres 18 + Redis 8 via docker compose
pnpm --filter api db:migrate # apply migrations

pnpm dev:web                 # API (8000) + web (3000)
pnpm dev:mobile              # API (8000) + Expo (8081)
pnpm --filter api worker     # Celery worker (separate terminal)

pnpm codegen                 # backend schema → packages/api-client
pnpm theme                   # tokens → web/native CSS + integrity check
pnpm format                  # Prettier (+ import order) for JS/TS/CSS/MD, ruff for Python
pnpm lint | pnpm typecheck | pnpm test | pnpm build
pnpm knip                    # unused files / exports / dependencies
```

## Definition of done

Run these and make sure all pass before claiming a task is finished:

```bash
pnpm codegen && git diff --exit-code packages/api-client   # contract in sync (commit if it changed)
pnpm theme && git diff --exit-code packages/theme           # tokens generated + not overridden
pnpm format:check && pnpm knip && pnpm lint && pnpm typecheck && pnpm test
pnpm --filter web build                                      # if web changed
pnpm --filter mobile doctor                                  # if mobile deps changed
```

CI (`.github/workflows/ci.yml`) runs the same checks plus `alembic check` (models and migrations must match).

## Repository layout

```
apps/
  api/src/app/{core,shared,modules/<module>}      backend (by module)
  web/src/{app,features/<f>/components,components/{ui,form},lib,styles}
  mobile/src/{app,features/<f>/components,components/{ui,form},lib,hooks}
packages/
  api-client/   generated contract          core/   shared logic by feature (auth, todos, preferences)
  i18n/         messages vi/en              theme/  tokens + generated CSS
  eslint-config/ typescript-config/         tooling
```

Feature names match across `apps/api/modules`, `packages/core/features`, `apps/*/features` (e.g. `todos`).

## Code quality tooling

| Tool                                                                             | Scope                       | Config                                              | When                                                                                                              |
| -------------------------------------------------------------------------------- | --------------------------- | --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| Prettier + `@ianvs/prettier-plugin-sort-imports` + `prettier-plugin-tailwindcss` | JS/TS/CSS/JSON/MD/YAML      | `.prettierrc` (root, single config)                 | editor on save, pre-commit, CI `format:check`                                                                     |
| ESLint (per workspace config; mobile on ESLint 9 for `eslint-config-expo`)       | JS/TS                       | `apps/*/eslint.config.js`, `packages/eslint-config` | pre-commit (staged files), pre-push, CI                                                                           |
| ruff (lint + isort + format), mypy strict                                        | Python                      | `apps/api/pyproject.toml`                           | pre-commit (staged files), CI                                                                                     |
| knip                                                                             | unused files, exports, deps | `knip.json`                                         | CI (`pnpm knip`)                                                                                                  |
| husky + lint-staged                                                              | git hooks                   | `.husky/`, `lint-staged.config.mjs`                 | `pre-commit`: format + lint staged files · `commit-msg`: commitlint · `pre-push`: typecheck + lint (turbo-cached) |
| commitlint (Conventional Commits)                                                | commit messages             | `commitlint.config.mjs`                             | `feat(todos): add due date`, `fix(api): …`, `chore: …`                                                            |
| EditorConfig, VS Code settings                                                   | editors                     | `.editorconfig`, `.vscode/`                         | —                                                                                                                 |

- **Import order** (enforced by Prettier, never hand-sort): built-ins → third-party → blank → `@workspace/*` → blank → `@/…` → blank → relative. Side-effect imports (`import "@/global.css"`, `import "@/lib/polyfills"`) keep their position: put them first when order matters. Python import order is ruff's isort (`known-first-party = ["app"]`).
- Do not bypass hooks (`--no-verify`); fix the reported problem instead.
- knip ignores generated code and the CLI-managed `components/ui/**` (unused exports there are normal). Anything else it reports is dead code: delete it rather than silencing knip.

## Conventions

- TS/JS: Prettier — no semicolons, double quotes, 100 cols, trailing commas (es5).
- Python: ruff (format + lint), mypy `--strict`, line length 100.
- File names are kebab-case (`todo-item.tsx`, `use-refresh-on-focus.ts`); components are PascalCase named exports (route files use default exports as frameworks require).
- Env vars: backend in `apps/api/.env` (see `.env.example`); web `NEXT_PUBLIC_API_URL`; mobile `EXPO_PUBLIC_API_URL`. API URLs are the **origin only** (`http://localhost:8000`): generated paths already include `/api/v1`.
