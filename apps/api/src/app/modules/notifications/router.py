from typing import Annotated

from dishka.integrations.fastapi import DishkaRoute, FromDishka
from fastapi import APIRouter, Path, status

from app.modules.auth.dependencies import CurrentUser, CurrentVerifiedUser
from app.modules.notifications.schemas import PushDeviceRegister
from app.modules.notifications.service import NotificationService
from app.modules.notifications.templates import push_enabled_copy
from app.shared.locale import RequestLocale

router = APIRouter(prefix="/notifications", tags=["notifications"], route_class=DishkaRoute)


@router.put("/devices", status_code=status.HTTP_204_NO_CONTENT)
async def register_push_device(
    data: PushDeviceRegister,
    user: CurrentUser,
    locale: RequestLocale,
    service: FromDishka[NotificationService],
) -> None:
    """Idempotent: call on every app start; it also moves the token to the signed-in user."""
    await service.register_device(user.id, data, locale)


@router.delete("/devices/{token}", status_code=status.HTTP_204_NO_CONTENT)
async def unregister_push_device(
    token: Annotated[str, Path()], user: CurrentUser, service: FromDishka[NotificationService]
) -> None:
    await service.unregister_device(user.id, token)


@router.post("/test", status_code=status.HTTP_202_ACCEPTED)
async def send_test_push(
    user: CurrentVerifiedUser, service: FromDishka[NotificationService]
) -> None:
    service.notify(user.id, push_enabled_copy())
