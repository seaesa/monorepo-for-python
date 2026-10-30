from typing import Annotated, Any

from dishka.integrations.fastapi import FromDishka, inject
from fastapi import Depends, Security
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.core.config import Settings
from app.core.exceptions import ForbiddenError, UnauthorizedError
from app.modules.auth.service import AuthService
from app.modules.users.models import User
from app.shared.permissions import Permission
from app.shared.schemas import ErrorCode

bearer_scheme = HTTPBearer(auto_error=False)


@inject
async def get_current_user(
    credentials: Annotated[HTTPAuthorizationCredentials | None, Security(bearer_scheme)],
    auth: FromDishka[AuthService],
) -> User:
    if credentials is None:
        raise UnauthorizedError()
    return await auth.authenticate(credentials.credentials)


CurrentUser = Annotated[User, Depends(get_current_user)]


@inject
async def get_verified_user(user: CurrentUser, settings: FromDishka[Settings]) -> User:
    """Business endpoints require a confirmed address when the deployment asks for it."""
    if settings.require_email_verification and user.email_verified_at is None:
        raise ForbiddenError("Email is not verified", code=ErrorCode.EMAIL_NOT_VERIFIED)
    return user


CurrentVerifiedUser = Annotated[User, Depends(get_verified_user)]


def require_permission(permission: Permission) -> Any:
    """`user: Annotated[User, require_permission(Permission.X)]`: a verified user holding X,
    otherwise 403 `forbidden`. Check permissions, never roles."""

    async def check(user: CurrentVerifiedUser) -> User:
        if permission not in user.permissions:
            raise ForbiddenError("Missing permission", code=ErrorCode.FORBIDDEN)
        return user

    return Depends(check)
