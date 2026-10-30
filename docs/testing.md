# Testing

Tests exist to protect **business behaviour**: what a user may do, what data they see, what the
system promises to clients. They do not protect pixels, framework behaviour or generated code.
Fewer tests that each guard a real rule beat many tests that pin implementation details.

| Level        | Where                                 | Command                              | Needs                              |
| ------------ | ------------------------------------- | ------------------------------------ | ---------------------------------- |
| Backend      | `apps/api/tests/test_*.py`            | `pnpm --filter api test`             | Postgres + Redis (`pnpm infra:up`) |
| Shared logic | `packages/core/src/**/<file>.test.ts` | `pnpm --filter @workspace/core test` | nothing                            |

`pnpm test` runs both. There are no component, screen or browser tests on purpose: screens are
thin renderers of core hooks, and the hooks and the API are where behaviour lives.

## Deciding whether to write a test

Write one when breaking the code would let a user lose data, gain access they should not have,
get a wrong answer from the API, or see an error in the wrong place. Test it once, at the lowest
layer that owns the rule:

- the rule is decided by the API → backend test through HTTP (`client`/`auth_client`);
- the behaviour is client logic shared by both apps → vitest next to the file in `packages/core`.

Skip: rendering, styling, props plumbing, getters, library behaviour (Zod, React Query), the
generated client, and anything already covered at another layer.

## Backend (`apps/api/tests`)

Real Postgres and Redis, no database fakes. Each test gets a fresh schema. Celery runs eagerly
under `ENVIRONMENT=test`, so queued emails and pushes are delivered inline.

| Fixture       | Gives you                                                        |
| ------------- | ---------------------------------------------------------------- |
| `client`      | `AsyncClient` over the app, base URL `http://test/api/v1`        |
| `auth_client` | `client` with a **verified** user's token (`jane@example.com`)   |
| `outbox`      | emails the API sent (`OutboxEmailSender.messages`)               |
| `push_outbox` | pushes the API sent (`OutboxPushSender.messages`, `dead_tokens`) |
| `api_app`     | the FastAPI app                                                  |
| `container`   | the Dishka container, to resolve services directly               |

`tests/helpers.py`: `register_verified(client, outbox, email)` registers and verifies through the
real email link; `PASSWORD` is the default password.

What the suite guards (keep this list true when adding tests):

- **Contract:** every error envelope (`401/403/404/409/422/429`) with `code`, `requestId` and
  `FieldError` details; operation ids unique (`test_openapi.py`).
- **Session:** refresh rotation, reuse detection revoking the family, logout on all devices,
  password change/reset invalidating old tokens, the unverified-email gate, rate limits.
- **Data:** per-owner isolation (a foreign id answers 404), cursor pagination returning every row
  once, explicit `null` in PATCH bodies → 422.
- **Side effects:** emails and pushes queued after commit, pushes rendered per device locale,
  dead tokens removed, signing out everywhere stops pushes, realtime delivered only to the owner,
  and a realtime/Redis outage never failing a write.
- **Architecture:** modules never import another module's repository; migrations create the
  indexes and constraints the models declare.

Name a test after the behaviour: `test_token_moves_to_the_last_user`.

## Shared logic (`packages/core`)

Vitest in node, English pinned in `src/test/setup.ts`. It covers what both apps rely on and a
screen cannot show was right: server errors landing on the right field translated
(`form.test.ts`), the single-flight token refresh (`api-client.test.ts`), persisted session state
(`store.test.ts`), the storage delegate. Add a test here when a hook contains a decision (cache
patching, rollback, mapping), not when it only forwards to the generated client.

## Writing a test

Failing test first for a bug fix or a new rule: run it, read the failure, then implement. Assert
on observable results (status code, response body, cache content, queued messages), never on a
mock you wrote yourself.

## In CI

`.github/workflows/ci.yml`: **api** (ruff, mypy, `alembic check`, pytest with Postgres/Redis
services), **web-mobile** (codegen/theme freshness, format, lint, deps, spelling, duplication,
knip, typecheck, web build, expo-doctor), **unit-test** (`packages/*` vitest) and, on pull
requests, **commitlint**.
