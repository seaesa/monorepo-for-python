# Monorepo: FastAPI + Next.js + Expo

A base for products that ship a web app and a mobile app on one backend. Everything here exists to
keep three promises as the product grows:

1. **The backend owns the truth.** Data shapes, validation rules, error codes and realtime events
   are declared once, in the API, and every client is generated from them.
2. **Behaviour is written once.** Web and mobile differ only in pixels and platform wiring; how a
   feature _behaves_ (fetching, caching, forms, session, errors) lives in shared packages.
3. **Rules are enforced by tools, not memory.** Formatting, layering, naming, spelling, dead code,
   duplication and contract drift all fail a command. If a rule matters and no tool checks it,
   add the check rather than a paragraph.

Read this file, then [docs/conventions.md](docs/conventions.md), then the `AGENTS.md` of every
folder you are about to touch (nested files override this one for their scope). Deeper guides:
[architecture](docs/architecture.md) · [adding a feature](docs/adding-a-feature.md) ·
[testing](docs/testing.md) · [deployment & releases](docs/deployment.md).

## Map

| Path                         | Responsibility                                                       | Rules                                                          |
| ---------------------------- | -------------------------------------------------------------------- | -------------------------------------------------------------- |
| `apps/api`                   | Backend: modular monolith, the only place business rules are decided | [apps/api/AGENTS.md](apps/api/AGENTS.md)                       |
| `apps/web`                   | Web UI (Next.js App Router, shadcn `base-maia`, Tailwind v4)         | [apps/web/AGENTS.md](apps/web/AGENTS.md)                       |
| `apps/mobile`                | iOS/Android UI + device capabilities (Expo, Uniwind, RN Reusables)   | [apps/mobile/AGENTS.md](apps/mobile/AGENTS.md)                 |
| `packages/api-client`        | **Generated** contract: types, Zod schemas, SDK, React Query helpers | [packages/api-client/AGENTS.md](packages/api-client/AGENTS.md) |
| `packages/core`              | Shared behaviour: feature hooks, form logic, stores, realtime, utils | [packages/core/AGENTS.md](packages/core/AGENTS.md)             |
| `packages/i18n`              | Every user-visible string, vi + en, type-checked                     | [packages/i18n/AGENTS.md](packages/i18n/AGENTS.md)             |
| `packages/theme`             | Design tokens → generated CSS for web and mobile                     | [packages/theme/AGENTS.md](packages/theme/AGENTS.md)           |
| `packages/typescript-config` | Shared `tsconfig` presets                                            |                                                                |

```
apps/api  (Pydantic schemas, routes, ErrorCode, realtime Events)
   │  pnpm codegen
   ▼
packages/api-client   generated: types · zod · sdk · query options        (never hand-edited)
   ▼
packages/core         features/<f>: hooks · forms · schemas · store · realtime   lib/: pure helpers
   ▼                  + packages/i18n (text)   + packages/theme (tokens)
apps/web · apps/mobile   screens and components only, calling core hooks
```

Dependencies only point down this picture. `pnpm lint:deps` (dependency-cruiser) fails on an
upward or sideways import: a package importing an app, one app importing the other, a core
feature reaching into another feature's internals, `core/lib` importing a feature.

## Principles (how to decide)

These outlive any library choice. When a rule below and a habit from another codebase disagree,
the rule wins.

- **Contract first.** A new field, endpoint, validation rule, error case or realtime event starts
  in `apps/api`, then `pnpm codegen`. Never hand-write an API type, URL, query key or fetch call.
  Never edit `packages/api-client/src/gen/**` (CI regenerates and fails on drift).
- **One source of truth per concern.** Business rule → API service. Data shape → Pydantic schema.
  Error meaning → `ErrorCode`. Text → `packages/i18n`. Color/radius/font → `packages/theme`.
  Version of a shared dependency → `catalog:` in `pnpm-workspace.yaml`. If you find yourself
  writing the same fact in two places, one of them is wrong.
- **Share behaviour, not pixels.** If web and mobile would contain the same logic (a hook, a form's
  submit/error handling, a list filter, a formatter), it goes to `packages/core` as a headless hook
  and both apps render it. UI components are **not** shared across platforms.
- **The client never decides business outcomes.** It validates for convenience (generated Zod) and
  renders what the server says. Permission, ownership, state transitions and limits are enforced
  in the API even if the UI already hides the button.
- **Errors are data.** The API answers `{ code, message, details }`; the UI translates `code`, never
  shows `message`. A new failure case is a new `ErrorCode` member, translated in both languages
  (typecheck fails otherwise). See [Errors](#errors) below.
- **Fewer, better abstractions.** Reuse what exists before adding a helper; add a helper only for a
  second real caller. Do not add a library for something an existing one covers (state → Zustand,
  server state → React Query, forms → RHF + Zod, dates → date-fns, HTTP → generated client).
- **Delete instead of disabling.** Dead code, unused exports, commented-out blocks and
  `oxlint-disable` without a reason are rejected. knip and jscpd run in CI.
- **Leave it as you would want to find it.** Every change ships with its i18n keys, migration,
  regenerated contract, updated `AGENTS.md`/docs if a rule changed, and passing checks.

## Where does new code go?

| You need…                                                    | Put it in                                                                                                                                                              |
| ------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A business rule, endpoint, field or validation               | `apps/api/src/app/modules/<module>/` → `pnpm codegen`                                                                                                                  |
| A new failure case                                           | `ErrorCode` in `apps/api/src/app/shared/schemas.py` → `pnpm codegen` → translate in `packages/i18n` (en + vi)                                                          |
| A hook that reads/writes server data, cache updates, session | `packages/core/src/features/<feature>/hooks.ts`                                                                                                                        |
| A form's state + submit + server-error mapping               | `packages/core/src/features/<feature>/forms.ts` (`use<Action>Form`), rendered by each app                                                                              |
| A form schema (generated Zod + UI-only fields)               | `packages/core/src/features/<feature>/schemas.ts`                                                                                                                      |
| Client state shared by both apps                             | `packages/core/src/features/<feature>/store.ts` (Zustand)                                                                                                              |
| A pure helper (format, parse, compute) with no feature       | `packages/core/src/lib/`                                                                                                                                               |
| Push an update to connected clients                          | `Event` in `apps/api/.../<module>/events.py` + `REALTIME_EVENTS` → `pnpm codegen` → `packages/core/src/features/<f>/realtime.ts`, listed in `src/realtime/registry.ts` |
| A push notification                                          | copy in `apps/api/.../<module>/templates.py` → `NotificationService.notify(user_id, copy)` after commit                                                                |
| A transactional email                                        | template in `apps/api/.../<module>/templates.py` → `send_email.delay(...)` after commit                                                                                |
| Background or slow work                                      | Celery task in `apps/api/.../<module>/tasks.py`, enqueued after commit                                                                                                 |
| UI text                                                      | `packages/i18n/src/locales/en.ts` + `vi.ts`                                                                                                                            |
| Color / radius / font                                        | `packages/theme/src/tokens.ts` → `pnpm theme`                                                                                                                          |
| A screen                                                     | `apps/<app>/src/app/…` (routing only) + `apps/<app>/src/features/<feature>/components/`                                                                                |
| A UI primitive (button, dialog…)                             | CLI only: shadcn (web) / React Native Reusables (mobile) → `src/components/ui`                                                                                         |
| A device capability (camera, location, push…)                | `apps/mobile/src/lib/<capability>.ts` (setup) + `apps/mobile/src/hooks/use-<capability>.ts` or a feature hook                                                          |
| A new environment variable                                   | the runtime's env module (`core/config.py`, `apps/<app>/src/lib/env.ts`) + its `.env.development`; deployed values on the platform (ADR 0002)                          |
| A value the backend owns (limit, path, version)              | the API, exported through OpenAPI → `pnpm codegen`; never copied into the client                                                                                       |
| A client tunable shared by both apps                         | `packages/core/src/config.ts` (stale times, retries, storage keys)                                                                                                     |
| A constant used by one feature / one app                     | `features/<feature>/constants.ts` · `apps/<app>/src/config.ts`                                                                                                         |
| Restrict an action to some users                             | a `Permission` in `apps/api/src/app/shared/permissions.py` mapped to roles → `Depends(require_permission(...))`; hide UI with `useHasPermission` (ADR 0004)            |
| A change an old mobile build cannot handle                   | additive change first; otherwise expand → migrate → raise `MIN_APP_VERSION` → remove (ADR 0003)                                                                        |
| A decision that is costly to reverse                         | an ADR in `docs/adr/` before the change                                                                                                                                |
| A test                                                       | Next to the logic it protects; see [Testing](#testing)                                                                                                                 |

Feature names match across layers: `apps/api/.../modules/todos`, `packages/core/src/features/todos`,
`apps/*/src/features/todos`. A feature folder in an app has `components/` and, only when needed,
`hooks/` for UI-only hooks of that feature.

## Naming

English only, everywhere: identifiers, files, folders, commits, comments, docs, test names. The
only Vietnamese allowed is translation content in `packages/i18n/src/locales/vi.ts` and
user-facing copy in backend `templates.py`.

| Thing                         | Convention                                              | Example                                         |
| ----------------------------- | ------------------------------------------------------- | ----------------------------------------------- |
| TS files and folders          | kebab-case; the file is named after its main export     | `use-push-registration.ts`, `todo-item.tsx`     |
| Python files, functions, vars | snake_case; classes PascalCase                          | `push_enabled_copy`, `NotificationService`      |
| React components              | PascalCase named export, noun phrase                    | `TodoList`, `DeviceSection`                     |
| Hooks                         | `use` + what it gives you, not how it works             | `useCurrentUser`, `useTodoList`, `useLoginForm` |
| Query hooks                   | `use<Entity>` / `use<Entity>s` / `useInfinite<Entity>s` | `useInfiniteTodos`                              |
| Mutation hooks                | `use<Verb><Entity>`                                     | `useCreateTodo`, `useRegisterPushDevice`        |
| Form hooks                    | `use<Action>Form` returning `{ form, onSubmit, … }`     | `useResetPasswordForm`                          |
| Stores                        | `use<Thing>Store`                                       | `useAuthStore`, `usePreferencesStore`           |
| Booleans                      | `is`/`has`/`can`/`should` + condition                   | `isDone`, `hasNextPage`, `canEdit`              |
| Event handlers / callbacks    | props `on<Event>`, local handlers `handle<Event>`       | `onCreated`, `handleSubmit`                     |
| Constants                     | `SCREAMING_SNAKE_CASE` for fixed sets and config        | `TODO_STATUS_FILTERS`, `SUPPORTED_LOCALES`      |
| API handlers (operationId)    | `verb_noun`, unique across the API → SDK names          | `list_todos` → `listTodos`, `listTodosOptions`  |
| Realtime events               | `<module>.<past-tense or noun>`                         | `todos.changed`                                 |
| i18n keys                     | `<feature>.<element>` camelCase, grouped by feature     | `todos.deleteTitle`, `errors.email_taken`       |

Name for the reader who sees only the call site: `useTodoList()` over `useData()`,
`formatRelativeDate` over `fmt`. No abbreviations beyond universal ones (`id`, `url`, `api`).
Full guide with decision examples: [docs/conventions.md](docs/conventions.md).

## Comments

Code says _what_; a comment says _why_ when the why is not obvious. Write one when you encode a
non-obvious constraint (a race, a platform quirk, an ordering requirement, a security reason, a
workaround with its upstream issue). Do not narrate code, restate names, leave TODOs without an
issue link, or keep commented-out code. Public functions in `packages/*` get a one-line doc
comment when the name alone does not tell a caller how to use it safely.

## Testing

Tests protect **business behaviour**, not implementation and not pixels.

- **Test:** rules that would cost money, data, security or trust if they broke: permissions and
  ownership, state transitions, validation the client cannot enforce, error codes returned to
  clients, token/session handling, pagination correctness, side effects (email/push queued,
  realtime emitted after commit), and non-trivial pure logic in `packages/core` (cache updates,
  form error mapping, refresh single-flight).
- **Do not test:** screens, components, styles, framework behaviour, generated code, trivial
  getters, or the same rule twice at different layers.
- Backend tests run against real Postgres + Redis (no DB mocks). Frontend logic tests are vitest
  in `packages/core`, next to the file (`form.test.ts`).
- A bug fix starts with a failing test that reproduces it, if the bug is in tested territory.

Details and fixtures: [docs/testing.md](docs/testing.md).

## Performance defaults

- Lists are cursor-paginated end to end; never load an unbounded collection.
- Every column used to filter or order has an index (review autogenerated migrations).
- No N+1: load what a response needs in one query per collection.
- Slow or external work (email, push, third-party calls) is a Celery task, never inside a request.
- Clients update React Query caches from mutations and realtime events instead of refetching
  everything; optimistic updates roll back on error.
- React Compiler is on in both apps: do not add `useMemo`/`useCallback`/`memo` by reflex.
- Mobile: import icons one by one (Metro does not tree-shake; the barrel is ~8 MB), use `FlatList`
  for anything that can grow.

## Errors

| Case                              | Backend                                                          | Frontend                                       |
| --------------------------------- | ---------------------------------------------------------------- | ---------------------------------------------- |
| Input invalid (client can check)  | constraint on the Pydantic field → generated Zod rule            | under the field, before any request            |
| Input invalid (server only, 422)  | Pydantic error `type` + `ctx`                                    | under the field, `validation.<type>`           |
| Domain error tied to an input     | `raise ConflictError(code=ErrorCode.EMAIL_TAKEN, field="email")` | under that field, `errors.<code>`              |
| Domain error not tied to an input | `raise UnauthorizedError(code=ErrorCode.INVALID_CREDENTIALS)`    | `FormRootError` / toast, `errors.<code>`       |
| No response / unknown shape       | —                                                                | client codes `network_error` / `unknown_error` |

Forms get all of this for free through `useApiForm` (`packages/core/src/lib/form.ts`).

## Workflow

1. Read the nested `AGENTS.md` of the areas you touch; look at the `todos` feature as the reference.
2. Backend first (module → migration → tests → `pnpm codegen`), then `packages/core`, then i18n,
   then both apps. Step-by-step: [docs/adding-a-feature.md](docs/adding-a-feature.md).
3. Keep the change scoped to the request. Mention unrelated problems instead of fixing them.
4. Run the definition of done.

## Definition of done

```bash
pnpm codegen && git diff --exit-code packages/api-client   # contract in sync
pnpm theme && git diff --exit-code packages/theme           # tokens generated, not overridden
pnpm check            # format · oxlint · deps · spelling · duplication · monorepo · knip · typecheck · tests
pnpm --filter web build                                      # if web changed
pnpm --filter mobile doctor                                  # if mobile deps/config changed
pnpm --filter api db:lint                                    # if a migration was added
```

CI (`.github/workflows/ci.yml`) runs the same plus `alembic check` and commitlint on PRs.

## Commands

```bash
pnpm install && (cd apps/api && uv sync)
pnpm infra:up                     # Postgres + Redis + Mailpit (docker compose)
pnpm --filter api db:migrate      # apply migrations
pnpm dev:web | pnpm dev:mobile    # API (8000) + web (3000) | API + Expo (8081)
pnpm --filter api worker          # Celery worker
pnpm codegen | pnpm theme         # regenerate contract | tokens
pnpm format | pnpm lint:fix       # auto-fix
pnpm check                        # everything CI checks except build/doctor
```

## Tooling

| Tool                                                 | Guards                                                                      | Config                                     |
| ---------------------------------------------------- | --------------------------------------------------------------------------- | ------------------------------------------ |
| oxfmt                                                | formatting, import order, Tailwind class order                              | `.oxfmtrc.json`                            |
| oxlint (type-aware) + ESLint plugins via `jsPlugins` | correctness, React hooks/Compiler rules, TanStack Query rules, naming, a11y | `.oxlintrc.json`                           |
| dependency-cruiser                                   | layer boundaries, cycles, feature isolation                                 | `.dependency-cruiser.cjs`                  |
| knip                                                 | unused files, exports, dependencies                                         | `knip.json`                                |
| jscpd                                                | copy-paste between files/apps                                               | `.jscpd.json`                              |
| cspell                                               | spelling in code and docs (English)                                         | `cspell.json`, `.cspell/project-words.txt` |
| sherif                                               | monorepo hygiene (versions, package.json)                                   | —                                          |
| ruff, mypy `--strict`                                | Python lint, format, types                                                  | `apps/api/pyproject.toml`                  |
| lefthook                                             | pre-commit (format, lint, spell on staged), commit-msg, pre-push            | `lefthook.yml`                             |
| commitlint                                           | Conventional Commits with a fixed scope list                                | `commitlint.config.mjs`                    |
| import-linter, deptry                                | Python layer contracts (core/shared never import modules), declared deps    | `apps/api/pyproject.toml`                  |
| squawk                                               | migrations safe on a live database (locks, rewrites)                        | `apps/api/.squawk.toml`                    |
| oasdiff (CI, pull requests)                          | no breaking API change without the `breaking-api` label (ADR 0003)          | —                                          |
| gitleaks (pre-commit, CI), `pnpm audit`, pip-audit   | committed secrets, known vulnerable production dependencies                 | —                                          |
| Renovate                                             | grouped weekly dependency updates; Expo-managed packages excluded           | `renovate.json`                            |
| mise                                                 | one version of Node, pnpm, Python, uv and CLI tools for everyone and CI     | `mise.toml`                                |

- Import order and formatting are owned by oxfmt: never hand-sort. Python imports: ruff isort.
- Never bypass hooks (`--no-verify`); fix the problem. Never add a disable comment without a
  `-- reason`.
- A real project word cspell does not know goes in `.cspell/project-words.txt`; a typo gets fixed.
- Commits: `type(scope): subject` in English, e.g. `feat(todos): add due date`. Scopes are listed
  in `commitlint.config.mjs`.

## Hard constraints

- **One React version** for the whole repo (`overrides` in `pnpm-workspace.yaml`, set by Expo).
  Shared-state libraries (`react`, `@tanstack/react-query`, `zustand`, `react-hook-form`, `zod`,
  `axios`) are `peerDependencies` in packages and real dependencies in apps.
- Shared dependency versions live in the pnpm `catalog:`; workspaces reference `"catalog:"`.
- Mobile native dependencies: `npx expo install <pkg>` from `apps/mobile`, never `pnpm add`.
- Icons: Hugeicons on both platforms (`@hugeicons/core-free-icons`), same names. No other set.
- Configuration (ADR 0002): the environment is read **only** in `apps/api/src/app/core/config.py`,
  `apps/web/src/lib/env.ts`, `apps/mobile/src/lib/env.ts` and `apps/mobile/app.config.ts`, each
  validated by a schema. `process.env` anywhere else is a lint error. No environment-specific
  defaults in code: development values live in the committed `.env.development` (`.env.test` for
  the API), personal overrides in ignored `.env`/`.env.local`, deployed values in the platform.
  API URLs are the **origin only**: generated paths include `/api/v1`.
- Constants have one owner (see "Where does new code go?"): never repeat a literal that already
  exists elsewhere (port, path, storage key, cookie name, page size).
- Secrets never enter the repo or client bundles (`NEXT_PUBLIC_*`/`EXPO_PUBLIC_*` are public).
