import uuid

from redis.asyncio import Redis

from app.core.exceptions import UnauthorizedError
from app.core.security import TokenEncoder, verify_password
from app.modules.auth.schemas import LoginRequest, TokenPair
from app.modules.users.models import User
from app.modules.users.schemas import UserCreate
from app.modules.users.service import UserService
from app.shared.schemas import ErrorCode

_REVOKED_PREFIX = "auth:revoked:"


class AuthService:
    def __init__(self, users: UserService, tokens: TokenEncoder, redis: Redis) -> None:
        self.users = users
        self.tokens = tokens
        self.redis = redis

    def _issue(self, user: User) -> TokenPair:
        access, expires_in = self.tokens.encode(str(user.id), "access")
        refresh, _ = self.tokens.encode(str(user.id), "refresh")
        return TokenPair(access_token=access, refresh_token=refresh, expires_in=expires_in)

    async def register(self, data: UserCreate) -> TokenPair:
        return self._issue(await self.users.create(data))

    async def login(self, data: LoginRequest) -> TokenPair:
        user = await self.users.get_by_email(data.email)
        if user is None or not verify_password(data.password, user.hashed_password):
            raise UnauthorizedError("Invalid email or password", code=ErrorCode.INVALID_CREDENTIALS)
        if not user.is_active:
            raise UnauthorizedError("Account is disabled", code=ErrorCode.ACCOUNT_DISABLED)
        return self._issue(user)

    async def refresh(self, refresh_token: str) -> TokenPair:
        payload = self.tokens.decode(refresh_token, "refresh")
        if payload is None or await self.redis.exists(_REVOKED_PREFIX + payload["jti"]):
            raise UnauthorizedError("Invalid refresh token", code=ErrorCode.INVALID_TOKEN)
        user = await self.users.get(uuid.UUID(payload["sub"]))
        if user is None or not user.is_active:
            raise UnauthorizedError("Invalid refresh token", code=ErrorCode.INVALID_TOKEN)
        await self._revoke(payload)  # rotate: each refresh token is single-use
        return self._issue(user)

    async def logout(self, refresh_token: str) -> None:
        if payload := self.tokens.decode(refresh_token, "refresh"):
            await self._revoke(payload)

    async def authenticate(self, access_token: str) -> User:
        payload = self.tokens.decode(access_token, "access")
        if payload is None:
            raise UnauthorizedError("Invalid or expired token", code=ErrorCode.INVALID_TOKEN)
        user = await self.users.get(uuid.UUID(payload["sub"]))
        if user is None or not user.is_active:
            raise UnauthorizedError("Invalid or expired token", code=ErrorCode.INVALID_TOKEN)
        return user

    async def _revoke(self, payload: dict[str, object]) -> None:
        ttl = max(int(payload["exp"]) - int(payload["iat"]), 1)  # type: ignore[call-overload]
        await self.redis.set(_REVOKED_PREFIX + str(payload["jti"]), 1, ex=ttl)
