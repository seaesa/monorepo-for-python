from dishka.integrations.fastapi import DishkaRoute, FromDishka
from fastapi import APIRouter, Depends, Query, status

from app.core.rate_limit import rate_limit
from app.modules.auth.dependencies import CurrentUser
from app.modules.auth.schemas import (
    ChangePasswordRequest,
    EmailRequest,
    LoginRequest,
    RefreshRequest,
    ResetPasswordRequest,
    TokenPair,
    VerifyEmailRequest,
)
from app.modules.auth.service import AuthService
from app.modules.users.schemas import UserCreate
from app.shared.locale import RequestLocale

router = APIRouter(prefix="/auth", tags=["auth"], route_class=DishkaRoute)


@router.post(
    "/register",
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(rate_limit("register"))],
)
async def register(
    data: UserCreate,
    auth: FromDishka[AuthService],
    locale: RequestLocale,
) -> TokenPair:
    return await auth.register(data, locale)


@router.post("/login", dependencies=[Depends(rate_limit("login", by_email=True))])
async def login(data: LoginRequest, auth: FromDishka[AuthService]) -> TokenPair:
    return await auth.login(data)


@router.post("/refresh")
async def refresh_token(data: RefreshRequest, auth: FromDishka[AuthService]) -> TokenPair:
    return await auth.refresh(data.refresh_token)


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
async def logout(
    data: RefreshRequest,
    auth: FromDishka[AuthService],
    all_devices: bool = Query(default=False, alias="allDevices"),
) -> None:
    await auth.logout(data.refresh_token, all_devices=all_devices)


@router.post("/verify-email", status_code=status.HTTP_204_NO_CONTENT)
async def verify_email(data: VerifyEmailRequest, auth: FromDishka[AuthService]) -> None:
    await auth.verify_email(data.token)


@router.post(
    "/resend-verification",
    status_code=status.HTTP_204_NO_CONTENT,
    dependencies=[Depends(rate_limit("email", by_email=True))],
)
async def resend_verification(
    data: EmailRequest,
    auth: FromDishka[AuthService],
    locale: RequestLocale,
) -> None:
    await auth.resend_verification(data.email, locale)


@router.post(
    "/forgot-password",
    status_code=status.HTTP_204_NO_CONTENT,
    dependencies=[Depends(rate_limit("email", by_email=True))],
)
async def forgot_password(
    data: EmailRequest,
    auth: FromDishka[AuthService],
    locale: RequestLocale,
) -> None:
    await auth.forgot_password(data.email, locale)


@router.post("/reset-password", status_code=status.HTTP_204_NO_CONTENT)
async def reset_password(data: ResetPasswordRequest, auth: FromDishka[AuthService]) -> None:
    await auth.reset_password(data.token, data.password)


@router.post("/change-password", status_code=status.HTTP_204_NO_CONTENT)
async def change_password(
    data: ChangePasswordRequest, user: CurrentUser, auth: FromDishka[AuthService]
) -> None:
    await auth.change_password(user, data.current_password, data.new_password)
