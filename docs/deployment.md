# Deployment

Three containers and two managed services:

```
        ┌────────────┐
        │  web (Next)│  :3000  static + RSC, talks to the API from the browser
        └─────┬──────┘
              │ HTTPS
        ┌─────▼──────┐        ┌──────────────┐
        │  api       │◄──────►│ Postgres 18  │
        │  FastAPI   │        └──────────────┘
        │  :8000     │◄──────►│ Redis 8      │  cache · rate limits · socket fan-out
        └─────┬──────┘        └──────────────┘
              │ enqueue
        ┌─────▼──────┐
        │  worker    │  Celery (email, push, future background jobs)
        └────────────┘
```

`docker-compose.full.yml` runs exactly this locally:

```bash
JWT_SECRET=$(openssl rand -hex 32) \
  docker compose -f docker-compose.full.yml up --build
```

It migrates the database before the API starts, waits for Postgres and Redis health, and sends
email through Mailpit (`http://localhost:8025`).

## Environment

Every app validates its environment at startup and refuses to start when a value is missing; there
are no fallbacks in code. Development values are committed (`apps/*/.env.development`,
`apps/api/.env.test`); deployed environments set everything below on the platform.

Backend (`apps/api/src/app/core/config.py`):

| Variable                     | Required in production | Notes                                                             |
| ---------------------------- | ---------------------- | ----------------------------------------------------------------- |
| `ENVIRONMENT`                | yes                    | `production` turns off `/docs` and enables the strict checks      |
| `JWT_SECRET`                 | yes                    | ≥ 32 chars; the development placeholder is rejected               |
| `DATABASE_URL`               | yes                    | `postgresql+asyncpg://…`                                          |
| `REDIS_URL`                  | yes                    | cache, rate limits, socket fan-out                                |
| `CELERY_BROKER_URL`          | yes                    | usually a different Redis database                                |
| `CELERY_RESULT_BACKEND`      | yes                    |                                                                   |
| `CORS_ORIGINS`               | yes                    | comma separated; empty is rejected in production                  |
| `FRONTEND_URL`               | yes                    | base URL for links inside emails                                  |
| `EMAIL_BACKEND`              | yes                    | `smtp` in production (`console` is rejected)                      |
| `SMTP_HOST` / `SMTP_PORT`    | with smtp              | `SMTP_USERNAME` / `SMTP_PASSWORD` / `SMTP_START_TLS` as needed    |
| `REQUIRE_EMAIL_VERIFICATION` | no                     | default `true`; business endpoints 403 until verified             |
| `METRICS_ENABLED`            | no                     | default `true`; see below                                         |
| `SENTRY_DSN`                 | no                     | empty disables error reporting entirely                           |
| `RATE_LIMIT_*`               | no                     | attempts per window for login/register/email                      |
| `PUSH_BACKEND`               | yes (for push)         | `expo` in production; `console` logs, `outbox` is for tests       |
| `EXPO_ACCESS_TOKEN`          | no                     | only if "enhanced push security" is on in the Expo project        |
| `MIN_APP_VERSION`            | no                     | older mobile builds get `426 app_update_required` (forced update) |

Frontend:

| Variable                                              | When      | Notes                                                         |
| ----------------------------------------------------- | --------- | ------------------------------------------------------------- |
| `NEXT_PUBLIC_API_URL`                                 | **build** | API origin only (`https://api.example.com`), no `/api/v1`     |
| `NEXT_PUBLIC_APP_ENV`                                 | **build** | `development` · `staging` · `production` (Sentry environment) |
| `NEXT_PUBLIC_SENTRY_DSN`                              | build     | empty disables error reporting                                |
| `SENTRY_AUTH_TOKEN` / `SENTRY_ORG` / `SENTRY_PROJECT` | build     | upload source maps (web and EAS builds)                       |

Mobile (EAS environment variables, per `environment` in `eas.json`): `EXPO_PUBLIC_API_URL`,
`EXPO_PUBLIC_APP_ENV` (set by the profile), `EXPO_PUBLIC_SENTRY_DSN`, `EXPO_PUBLIC_IOS_STORE_ID`
(forced-update link), `APP_ID`, `EAS_PROJECT_ID`. Create them with `eas env:create` or the dashboard.

`NEXT_PUBLIC_*` is inlined at build time: rebuilding the image is how you change it.

## Migrations

Run once per release, before the new API code serves traffic:

```bash
cd apps/api
uv run alembic upgrade head
uv run alembic check     # CI already fails if models and migrations disagree
```

They are idempotent; the compose file runs `alembic upgrade head` in the API container's command.

## Health and readiness

`GET /api/v1/health` pings Postgres and Redis and returns
`{"status": "ok", "database": "ok", "redis": "ok"}`. Point both the container healthcheck and the
load balancer probe at it; a failing dependency turns it red, so the instance leaves rotation.

## Metrics and error reporting

- Prometheus scrapes `GET /metrics` on the API port. It is unauthenticated and exposes route
  names and traffic volume — keep it on the private network (or set `METRICS_ENABLED=false`).
- Useful series: `http_requests_total{path,status}` for error rates,
  `http_request_duration_seconds_bucket` for p95 latency.
- Sentry: set `SENTRY_DSN` to switch it on; `send_default_pii` stays off, so attach user ids
  explicitly when you need them.

## Scaling

- **API:** stateless — run as many replicas as you like behind the load balancer. Socket.IO
  clients connect with `transports: ["websocket"]` only, so no sticky sessions are required, and
  the Redis manager fans events out across replicas.
- **Database pool:** each API replica opens `DATABASE_POOL_SIZE` (default 10) plus up to
  `DATABASE_MAX_OVERFLOW` (10) connections. Keep
  `replicas × (pool_size + max_overflow)` below the Postgres `max_connections` budget.
- **Worker:** scale replicas, not concurrency, for isolation; the queue is Redis-backed.
- **Redis:** one instance is enough for cache, rate limits and pub/sub; use a managed instance
  with persistence if you rely on refresh-token families (they are the session store).

## Security checklist

- [ ] `JWT_SECRET` generated per environment and stored in the secret manager.
- [ ] `CORS_ORIGINS` lists only your real origins.
- [ ] HTTPS everywhere; the API behind a proxy that sets `X-Forwarded-*`.
- [ ] `/metrics` and `/docs` not reachable from the public internet.
- [ ] `REQUIRE_EMAIL_VERIFICATION` on, and a real SMTP provider configured.
- [ ] Rate limits sized for your traffic (`RATE_LIMIT_LOGIN_ATTEMPTS`, …).
- [ ] Postgres backups and a tested restore.
- [ ] `SENTRY_DSN` set, so failures are visible before users report them.

## CI/CD

`.github/workflows/ci.yml` must be green before a merge: API lint/types/migrations/tests, contract
and theme freshness (`pnpm codegen` / `pnpm theme` with `git diff --exit-code`), format, lint,
dependency rules, spelling, duplication, knip, typecheck, the web build, `expo-doctor`, the
shared-logic unit tests and, on pull requests, commit message linting.

## Mobile releases (EAS)

Builds run on EAS (Expo Application Services); signing keys and provisioning live there.

One-time setup:

1. `cd apps/mobile && npx eas-cli@latest init` — creates the EAS project; copy its id.
2. Set `APP_ID` in `eas.json` (`build.base.env`) to your bundle id / package name.
3. `npx eas-cli credentials` for each platform (or let the first build generate them).
4. Push notifications: upload the APNs key (iOS) and the FCM v1 service account (Android) with
   `npx eas-cli credentials`; set `PUSH_BACKEND=expo` on the API.
5. GitHub repository secrets: `EXPO_TOKEN` (an Expo access token) and `EAS_PROJECT_ID`.

Releasing:

```bash
git tag v1.2.0 && git push origin v1.2.0
```

`.github/workflows/mobile-release.yml` then builds `production` for iOS and Android (store IPA +
AAB, build numbers auto-incremented on EAS) and `preview` for Android (an installable APK), and
attaches all three to the GitHub Release of that tag. Submit to the stores with
`npx eas-cli submit -p ios|android --latest`. The app version shown to users is `version` in
`app.config.ts`; bump it in the release commit.

Deployment itself is left to your platform (Fly, Render, ECS, Kubernetes…): build
`apps/api/Dockerfile` and `apps/web/Dockerfile`, run migrations as a release step, then roll the
API and worker. `docker-compose.full.yml` is a working reference for the wiring.
