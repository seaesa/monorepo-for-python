from typing import Annotated

from dishka.integrations.fastapi import DishkaRoute, FromDishka
from fastapi import APIRouter, Query, status

from app.modules.auth.dependencies import CurrentUser, require_permission
from app.modules.auth.schemas import DeleteAccountRequest
from app.modules.auth.service import AuthService
from app.modules.users.models import User
from app.modules.users.schemas import UserRead, UserUpdate
from app.modules.users.service import UserService
from app.shared.pagination import CursorParams
from app.shared.permissions import Permission
from app.shared.schemas import CursorPage

router = APIRouter(prefix="/users", tags=["users"], route_class=DishkaRoute)


@router.get("")
async def list_users(
    params: Annotated[CursorParams, Query()],
    _: Annotated[User, require_permission(Permission.USERS_READ)],
    service: FromDishka[UserService],
) -> CursorPage[UserRead]:
    return await service.list(params)


@router.get("/me")
async def get_me(user: CurrentUser) -> UserRead:
    return UserRead.model_validate(user)


@router.patch("/me")
async def update_me(
    data: UserUpdate, user: CurrentUser, service: FromDishka[UserService]
) -> UserRead:
    return UserRead.model_validate(await service.update(user, data))


@router.post("/me/delete", status_code=status.HTTP_204_NO_CONTENT)
async def delete_me(
    data: DeleteAccountRequest, user: CurrentUser, auth: FromDishka[AuthService]
) -> None:
    """Delete the account and everything it owns; the password is the confirmation."""
    await auth.delete_account(user, data.password)
