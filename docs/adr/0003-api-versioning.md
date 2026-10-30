# 0003. API versioning: additive evolution under /api/v1

Status: Accepted · Date: 2026-11-17

## Context

Web deploys together with the API, but installed mobile builds keep calling it for months. A
URL version bump (`/v2`) for every change multiplies code paths to maintain; never breaking at all
is unrealistic.

## Decision

1. **Additive by default.** Within `/api/v1` only add: new endpoints, new optional request fields,
   new response fields, new enum members that clients tolerate. CI (`api-contract` job, oasdiff)
   fails a pull request that removes or renames an endpoint, field or parameter, makes an optional
   input required, or narrows a type.
2. **Expand → migrate → contract** for unavoidable changes: add the new shape next to the old one,
   mark the old one `deprecated=True` in FastAPI, ship clients that use the new one, raise
   `MIN_APP_VERSION` so old mobile builds are forced to update (`426 app_update_required`), then
   delete the old shape in a PR labelled `breaking-api`.
3. **New URL version** (`/api/v2`, a new router prefix sharing services) only for a redesign of a
   whole resource family, never for a single field. Both versions run until `MIN_APP_VERSION`
   excludes every v1 client.

## Consequences

- Clients must ignore unknown fields and unknown enum values (no runtime response validation).
- Mobile sends `X-App-Version`; the server owns the minimum supported version.
- Every intentional break carries a label and a plan, visible in review.
