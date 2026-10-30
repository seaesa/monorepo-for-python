from dishka.integrations.fastapi import DishkaRoute, FromDishka
from fastapi import APIRouter, status

from app.modules.auth.schemas import LoginRequest, RefreshRequest, TokenPair
from app.modules.auth.service import AuthService
from app.modules.users.schemas import UserCreate

router = APIRouter(prefix="/auth", tags=["auth"], route_class=DishkaRoute)


@router.post("/register", status_code=status.HTTP_201_CREATED)
async def register(data: UserCreate, auth: FromDishka[AuthService]) -> TokenPair:
    return await auth.register(data)


@router.post("/login")
async def login(data: LoginRequest, auth: FromDishka[AuthService]) -> TokenPair:
    return await auth.login(data)


@router.post("/refresh")
async def refresh_token(data: RefreshRequest, auth: FromDishka[AuthService]) -> TokenPair:
    return await auth.refresh(data.refresh_token)


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
async def logout(data: RefreshRequest, auth: FromDishka[AuthService]) -> None:
    await auth.logout(data.refresh_token)
