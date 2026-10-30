# 0002. Configuration from the environment, validated at startup

Status: Accepted · Date: 2026-11-17

## Context

Defaults such as `localhost:8000` hidden in code make staging and production silently talk to the
wrong place. Values copied across files (ports, cookie names, storage keys) drift.

## Decision

- Each runtime has exactly one module that reads the environment and validates it with a schema:
  `apps/api/src/app/core/config.py`, `apps/web/src/lib/env.ts`, `apps/mobile/src/lib/env.ts`
  (mobile build-time config: `app.config.ts`). Everywhere else imports that module; reading
  `process.env` elsewhere is a lint error.
- No fallback values for environment-specific settings in code. Development values live in the
  committed `.env.development` (and `.env.test` for the API); personal overrides go in the ignored
  `.env` / `.env.local`; staging and production get values from their platform and fail to start
  when one is missing.
- Constants live with their owner: backend-owned values are exported through OpenAPI; client
  tunables in `packages/core/src/config.ts`; app-only ones in `apps/<app>/src/config.ts`; a constant
  used by one feature stays in that feature.

## Consequences

- A fresh clone runs with zero setup, and a misconfigured deploy fails at boot, not at first request.
- Secrets never go in committed env files; gitleaks runs on commit and in CI.
