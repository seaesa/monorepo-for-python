from typing import Annotated

from dishka.integrations.fastapi import FromDishka, inject
from fastapi import Depends, Security
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.core.exceptions import UnauthorizedError
from app.modules.auth.service import AuthService
from app.modules.users.models import User

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
