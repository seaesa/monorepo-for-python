"""Who may do what. Roles are coarse (stored on the user); endpoints check permissions,
never roles, so a new role is a one-line change here. Both enums are exported through
OpenAPI, so the frontend gates UI with the same vocabulary."""

from enum import StrEnum


class Role(StrEnum):
    MEMBER = "member"
    ADMIN = "admin"


class Permission(StrEnum):
    USERS_READ = "users:read"


ROLE_PERMISSIONS: dict[Role, frozenset[Permission]] = {
    Role.MEMBER: frozenset(),
    Role.ADMIN: frozenset(Permission),
}
