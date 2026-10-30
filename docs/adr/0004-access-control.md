# 0004. Permission-based access control

Status: Accepted · Date: 2026-11-17

## Context

Checks like `if user.role == "admin"` scattered across routes and screens become impossible to
audit and to change when a new role appears.

## Decision

- Code checks **permissions** (`Permission.USERS_READ`), never roles. Roles (`Role`) map to
  permission sets in one place: `apps/api/src/app/shared/permissions.py`.
- Routes declare what they need with `Depends(require_permission(Permission.X))`; services that
  act on owned data also filter by owner (authorization is not only a route concern).
- The user's effective permissions are returned by `GET /users/me`; clients only use them to hide
  UI (`useHasPermission`), never as the security boundary.
- Roles are assigned by an operator command (`uv run python -m app.cli set-role`), not by an API.

## Consequences

- Adding a role is one mapping change. Per-tenant or per-resource rules can later replace the
  static map without touching call sites.
