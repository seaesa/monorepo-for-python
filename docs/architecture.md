# Architecture

One backend, two clients, one generated contract.

```
apps/api (FastAPI)                    ← the only source of truth for the API
   │  pnpm codegen (OpenAPI → TypeScript)
   ▼
packages/api-client  types · zod · axios sdk · react-query options   (generated, never edited)
   ▼
packages/core        hooks, form hooks, stores, realtime client      (all shared behaviour)
   ▼                                   ▼
apps/web (Next.js)              apps/mobile (Expo)
```

Everything a screen needs — fetching, caching, invalidation, validation, error translation —
lives in `packages/core`. The apps only contain UI and platform wiring (storage, env,
navigation). That is why a feature is added once and shows up on both clients.

## Backend layers

```
router  ──►  service  ──►  repository  ──►  database
               │
               └──►  another module's SERVICE   (never its repository, models or tables)
```

| Layer           | Responsibility                                                                             |
| --------------- | ------------------------------------------------------------------------------------------ |
| `router.py`     | HTTP shape: paths, status codes, dependency injection. No logic, no `HTTPException`.       |
| `service.py`    | Use cases, transaction boundary (`await session.commit()`), side effects after commit.     |
| `repository.py` | Queries for one model. `flush()` only, never `commit()`.                                   |
| `models.py`     | SQLAlchemy tables. Cross-module references are ids + foreign keys, never `relationship()`. |

`tests/test_architecture.py` parses imports and fails when a module reaches into another
module's repository, so the boundary is enforced, not just documented.

## Request lifecycle

1. **`RequestIdMiddleware`** (outermost) reuses a valid `X-Request-ID` or mints one, binds it to
   structlog context, and returns it on the response.
2. **`CORSMiddleware`** answers preflights for the web and Expo origins.
3. **`MetricsMiddleware`** (when `METRICS_ENABLED`) times the request and counts it by route
   template, so `/api/v1/todos/{todoId}` is one series instead of one per id.
4. **Dishka** builds a request-scoped container: one `AsyncSession`, one `UserService`, …
5. The route runs. Errors are raised as `AppError` subclasses and rendered by the handlers in
   `core/exceptions.py`.
6. After the response, the session is closed and the container is disposed.

## Errors

One envelope, everywhere:

```json
{
  "code": "email_taken",
  "message": "Email already registered",
  "details": [{ "field": "email", "code": "email_taken", "message": "…", "params": null }],
  "requestId": "0f6c…"
}
```

- `code` is a member of `ErrorCode` (exported to OpenAPI as a TS union).
- `details` carries `FieldError`s for 422 validation **and** for domain errors raised with
  `field=…`, so a form can put every message on its own input.
- Clients never display `message`: `applyServerErrors` translates `errors.<code>` or
  `validation.<code>` from `packages/i18n` and falls back to `root.server`.

## Auth

- Short-lived access token (15 min) + rotating refresh token (7 days), both JWTs carrying
  `sub`, `type`, `jti`, `iat`, `exp` and `ver`.
- Refresh rotation is atomic in Redis (Lua `EVAL`): a refresh token can be consumed once. Reusing
  a consumed token revokes the whole token _family_, so a stolen token cannot outlive detection.
- `ver` is `users.token_version`; changing or resetting a password bumps it and invalidates every
  token issued before.
- `logout?allDevices=true` revokes every family the user has open.
- Email verification is a soft gate: unverified users can log in and read their profile, but
  business endpoints answer `403 email_not_verified` while `REQUIRE_EMAIL_VERIFICATION` is on.
- Credential endpoints are rate limited per email (login, register, resend, forgot password) in
  Redis, answering `429 rate_limited` with `Retry-After`.

## Realtime

Socket.IO is mounted on the API at `/ws/socket.io`. A client connects with
`auth: { token }`, the namespace validates the access token and joins `user:<id>`, so every
device of that user receives the event. Services publish **after** commit through
`RealtimePublisher`; a publish failure is logged and swallowed, because the write already
happened and must not turn into a 500.

Event payloads are Pydantic models in `<module>/events.py`, registered in `REALTIME_EVENTS`, and
exported into OpenAPI (`RealtimeEvents`). `packages/core` maps each event to a cache update, so a
list refreshes itself without extra code in the screens.

## Data access

- `BaseRepository` provides `get`, `find_one`, `list`, `create`, `update`, `delete`.
- Lists are **cursor paginated** (`limit` + opaque `cursor`), ordered by a stable keyset
  (`created_at DESC, id DESC`) so a page never repeats or skips a row when new rows arrive.
  The response is `{ items, nextCursor }`; `nextCursor: null` means the last page.
- Every todo query is filtered by `owner_id`; a foreign id answers `404`, never `403`, so ids do
  not leak existence.

## Observability

- **Logs:** structlog — JSON in production, colourised console elsewhere, always with
  `request_id`.
- **Metrics:** Prometheus text at `GET /metrics` (root, unauthenticated, `METRICS_ENABLED`):
  `http_requests_total{method,path,status}` and `http_request_duration_seconds{method,path}`.
- **Errors:** Sentry is enabled by setting `SENTRY_DSN`; without it the SDK is never initialised
  and `send_default_pii` stays off.

## Push notifications

```
module service ──notify(user_id, copy)──► Celery send_push ──► NotificationService.deliver
                                                                  │ per device: copy[device.locale]
                                                                  ▼
                                                            PushSender (Expo push API)
                                                                  │ DeviceNotRegistered
                                                                  ▼
                                                            delete dead tokens
```

- Devices register with `PUT /notifications/devices` (idempotent; the token follows the last
  signed-in user) and send `Accept-Language`, so each device gets pushes in its own language.
- Copy is written in the backend (`templates.py`), like emails. Apps never compose push text.
- Logout unregisters the current device; signing out everywhere forgets all the user's devices.

## Frontend layers

```
apps/<app>/src/app/**                  routing only: which screen, which guard
apps/<app>/src/features/<f>/components render: markup + platform components
packages/core/src/features/<f>         behaviour: hooks.ts · forms.ts · schemas.ts · store.ts · realtime.ts
packages/core/src/lib                  pure helpers, no feature knowledge
packages/api-client                    generated contract
```

Boundaries are checked by dependency-cruiser (`pnpm lint:deps`, rules in `.dependency-cruiser.cjs`):
no cycles, packages never import apps, apps never import each other, a core feature is used by
another only through its `index.ts`, `core/lib` imports no feature.

## Mobile platform

- Expo with Continuous Native Generation: `ios/`/`android/` are generated from `app.config.ts`.
- Device capabilities follow one shape: config plugin + permission text → `src/lib/<capability>.ts`
  → a hook exposing `{ status, request }`. Shipped: push notifications, foreground location.
- Release builds run on EAS from a `v*` tag (see [deployment.md](./deployment.md)).

## Testing

Business rules are tested in the API against real Postgres/Redis; shared client logic in
`packages/core` with vitest. No screen or browser tests. See [testing.md](./testing.md).
