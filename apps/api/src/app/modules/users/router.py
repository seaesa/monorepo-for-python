from dishka.integrations.fastapi import DishkaRoute, FromDishka
from fastapi import APIRouter

from app.modules.auth.dependencies import CurrentUser
from app.modules.users.schemas import UserRead, UserUpdate
from app.modules.users.service import UserService

router = APIRouter(prefix="/users", tags=["users"], route_class=DishkaRoute)


@router.get("/me")
async def get_me(user: CurrentUser) -> UserRead:
    return UserRead.model_validate(user)


@router.patch("/me")
async def update_me(
    data: UserUpdate, user: CurrentUser, service: FromDishka[UserService]
) -> UserRead:
    return UserRead.model_validate(await service.update(user, data))
