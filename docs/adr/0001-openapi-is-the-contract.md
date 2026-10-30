# 0001. The OpenAPI schema is the only contract

Status: Accepted · Date: 2026-11-17

## Context

Web and mobile talk to one API. Hand-written types, fetchers and validation drift from the backend
silently and fail at runtime in front of users.

## Decision

Pydantic schemas and routes in `apps/api` are the source of truth. `pnpm codegen` exports
`openapi.json` and generates `packages/api-client` (types, Zod schemas, SDK, React Query options).
Frontend code never declares API types, URLs, query keys or error codes by hand. Error codes are an
enum in the schema, so a code without a translation fails typecheck. Realtime event payloads and
transport constants are exported through the same schema. Generated responses are not validated at
runtime (`validator: false`): an older app must tolerate fields a newer API adds.

## Consequences

- Changing the API is a backend change plus `pnpm codegen`; CI fails if the generated client is stale.
- The contract is diffable, which makes breaking-change detection possible (ADR 0003).
- Constraints live on Pydantic fields so forms validate exactly like the server.
