import uuid
from collections.abc import Awaitable
from datetime import UTC, datetime
from typing import Any, Final, cast

from redis.asyncio import Redis

from app.core.config import Settings
from app.core.exceptions import ConflictError, UnauthorizedError
from app.core.security import OneShotTokenType, TokenEncoder, verify_password_async
from app.modules.auth.schemas import LoginRequest, TokenPair
from app.modules.auth.templates import (
    EmailTemplate,
    reset_password_email,
    verification_email,
)
from app.modules.notifications.service import NotificationService
from app.modules.users.models import User
from app.modules.users.schemas import UserCreate
from app.modules.users.service import UserService
from app.shared.locale import Locale
from app.shared.schemas import ErrorCode

_RT_PREFIX: Final = "auth:rt:"
_FAMILY_PREFIX: Final = "auth:fam:"
_USED_PREFIX: Final = "auth:used:"
_USER_FAMILIES_PREFIX: Final = "auth:user:"
_FAMILIES_SUFFIX: Final = ":families"
_REVOKED: Final = "revoked"
_CONSUMED: Final = 1

# Consume a refresh token and detect reuse in one round trip. Redis serialises scripts, so
# exactly one of two concurrent refreshes wins; the loser sees a missing token and kills the
# family. A token that is gone is indistinguishable from theft, so it is treated as theft.
_CONSUME_SCRIPT: Final = """
local revoked = redis.call('GET', KEYS[2])
if revoked then return -1 end
if redis.call('DEL', KEYS[1]) == 0 then
  redis.call('SET', KEYS[2], ARGV[2], 'EX', ARGV[1])
  return 0
end
redis.call('SET', KEYS[3], '1', 'EX', ARGV[1])
return 1
"""


class AuthService:
    def __init__(
        self,
        users: UserService,
        tokens: TokenEncoder,
        redis: Redis,
        settings: Settings,
        notifications: NotificationService,
    ) -> None:
        self.users = users
        self.notifications = notifications
        self.tokens = tokens
        self.redis = redis
        self.settings = settings

    async def _issue(self, user: User, *, family: str | None = None) -> TokenPair:
        """Mint a token pair and register its refresh token as the head of a family."""
        lineage = family or uuid.uuid4().hex
        ttl = self.tokens.refresh_ttl
        access, expires_in = self.tokens.encode(
            str(user.id), "access", version=user.token_version, family=lineage
        )
        refresh, _, jti = self.tokens.encode_refresh(
            str(user.id), lineage, version=user.token_version
        )
        families_key = self._families_key(user.id)
        pipe = self.redis.pipeline()
        pipe.set(_RT_PREFIX + jti, lineage, ex=ttl)
        pipe.sadd(families_key, lineage)
        pipe.expire(families_key, ttl)
        await pipe.execute()
        return TokenPair(access_token=access, refresh_token=refresh, expires_in=expires_in)

    async def register(self, data: UserCreate, locale: Locale = "en") -> TokenPair:
        user = await self.users.create(data)
        await self._send_verification(user, locale)
        return await self._issue(user)

    async def login(self, data: LoginRequest) -> TokenPair:
        user = await self.users.get_by_email(data.email)
        if user is None or not await verify_password_async(data.password, user.hashed_password):
            raise UnauthorizedError("Invalid email or password", code=ErrorCode.INVALID_CREDENTIALS)
        if not user.is_active:
            raise UnauthorizedError("Account is disabled", code=ErrorCode.ACCOUNT_DISABLED)
        return await self._issue(user)

    async def refresh(self, refresh_token: str) -> TokenPair:
        payload = self.tokens.decode(refresh_token, "refresh")
        family = payload.get("fam") if payload else None
        if payload is None or not isinstance(family, str):
            raise UnauthorizedError("Invalid refresh token", code=ErrorCode.INVALID_TOKEN)
        user = await self.users.get(uuid.UUID(str(payload["sub"])))
        if user is None or not user.is_active or not self._version_ok(payload, user):
            raise UnauthorizedError("Invalid refresh token", code=ErrorCode.INVALID_TOKEN)
        if await self._consume(str(payload["jti"]), family) != _CONSUMED:
            raise UnauthorizedError("Invalid refresh token", code=ErrorCode.INVALID_TOKEN)
        return await self._issue(user, family=family)

    async def logout(self, refresh_token: str, *, all_devices: bool = False) -> None:
        payload = self.tokens.decode(refresh_token, "refresh")
        family = payload.get("fam") if payload else None
        if payload is None or not isinstance(family, str):
            return
        if all_devices:
            await self._revoke_user_families(str(payload["sub"]))
            return
        await self._revoke_family(family)
        await self.redis.delete(_RT_PREFIX + str(payload["jti"]))

    async def authenticate(self, access_token: str) -> User:
        payload = self.tokens.decode(access_token, "access")
        if payload is None:
            raise UnauthorizedError("Invalid or expired token", code=ErrorCode.INVALID_TOKEN)
        user = await self.users.get(uuid.UUID(str(payload["sub"])))
        if user is None or not user.is_active or not self._version_ok(payload, user):
            raise UnauthorizedError("Invalid or expired token", code=ErrorCode.INVALID_TOKEN)
        return user

    async def verify_email(self, token: str) -> None:
        payload = self._one_shot(token, "email_verify")
        await self._consume_one_shot(payload)
        user = await self._load(payload)
        if user.email_verified:
            raise ConflictError("Email already verified", code=ErrorCode.EMAIL_ALREADY_VERIFIED)
        await self.users.mark_verified(user)

    async def resend_verification(self, email: str, locale: Locale) -> None:
        """Silent for unknown or already verified addresses, so it cannot enumerate accounts."""
        user = await self.users.get_by_email(email)
        if user is None or user.email_verified:
            return
        await self._send_verification(user, locale)

    async def forgot_password(self, email: str, locale: Locale) -> None:
        """Silent for unknown addresses: the response is the same either way."""
        user = await self.users.get_by_email(email)
        if user is None:
            return
        token, _, _ = self.tokens.encode_one_shot(
            str(user.id), "password_reset", version=user.token_version
        )
        self._send(user.email, reset_password_email(token, locale, self.settings.frontend_url))

    async def reset_password(self, token: str, password: str) -> None:
        payload = self._one_shot(token, "password_reset")
        await self._consume_one_shot(payload)
        user = await self._load(payload)
        await self.users.set_password(user, password)
        await self._revoke_user_families(str(user.id))

    async def change_password(self, user: User, current_password: str, new_password: str) -> None:
        if not await verify_password_async(current_password, user.hashed_password):
            raise UnauthorizedError(
                "Current password is incorrect", code=ErrorCode.INVALID_CREDENTIALS
            )
        await self.users.set_password(user, new_password)
        await self._revoke_user_families(str(user.id))

    async def delete_account(self, user: User, password: str) -> None:
        if not await verify_password_async(password, user.hashed_password):
            raise UnauthorizedError("Password is incorrect", code=ErrorCode.INVALID_CREDENTIALS)
        await self.users.delete(user)
        await self._revoke_user_families(str(user.id))

    def _one_shot(self, token: str, token_type: OneShotTokenType) -> dict[str, Any]:
        payload = self.tokens.decode(token, token_type)
        if payload is None:
            raise UnauthorizedError("Invalid or expired token", code=ErrorCode.INVALID_TOKEN)
        return payload

    async def _load(self, payload: dict[str, Any]) -> User:
        user = await self.users.get(uuid.UUID(str(payload["sub"])))
        if user is None or not user.is_active or not self._version_ok(payload, user):
            raise UnauthorizedError("Invalid or expired token", code=ErrorCode.INVALID_TOKEN)
        return user

    async def _consume_one_shot(self, payload: dict[str, Any]) -> None:
        """Mark a single-use token spent; the second use is indistinguishable from a forged one."""
        fresh = await self.redis.set(
            _USED_PREFIX + str(payload["jti"]), "1", nx=True, ex=self._remaining_ttl(payload)
        )
        if not fresh:
            raise UnauthorizedError("Token already used", code=ErrorCode.INVALID_TOKEN)

    async def _send_verification(self, user: User, locale: Locale) -> None:
        token, _, _ = self.tokens.encode_one_shot(
            str(user.id), "email_verify", version=user.token_version
        )
        self._send(user.email, verification_email(token, locale, self.settings.frontend_url))

    @staticmethod
    def _send(to: str, template: EmailTemplate) -> None:
        """Hand the email to the worker: a slow or failing SMTP server must not fail the request."""
        # Imported here because the task module builds a container, which imports `app.modules`.
        from app.modules.users.tasks import send_email

        send_email.delay(to, template.subject, template.text, template.html)

    @staticmethod
    def _version_ok(payload: dict[str, Any], user: User) -> bool:
        return int(payload.get("ver", 0)) == user.token_version

    @staticmethod
    def _remaining_ttl(payload: dict[str, Any]) -> int:
        expires_at = payload.get("exp")
        if not isinstance(expires_at, (int, float)):
            return 1
        return max(1, int(expires_at - datetime.now(UTC).timestamp()))

    async def _consume(self, jti: str, family: str) -> int:
        result = await cast(
            Awaitable[str],
            self.redis.eval(
                _CONSUME_SCRIPT,
                3,
                _RT_PREFIX + jti,
                _FAMILY_PREFIX + family,
                _USED_PREFIX + jti,
                str(self.tokens.refresh_ttl),
                _REVOKED,
            ),
        )
        return int(result)

    async def _revoke_family(self, family: str) -> None:
        await self.redis.set(_FAMILY_PREFIX + family, _REVOKED, ex=self.tokens.refresh_ttl)

    async def _revoke_user_families(self, user_id: str) -> None:
        key = self._families_key(uuid.UUID(user_id))
        members = await cast(Awaitable[set[Any]], self.redis.smembers(key))
        families = {family.decode() if isinstance(family, bytes) else family for family in members}
        if families:
            ttl = self.tokens.refresh_ttl
            pipe = self.redis.pipeline()
            for family in families:
                pipe.set(_FAMILY_PREFIX + family, _REVOKED, ex=ttl)
            await pipe.execute()
        await self.redis.delete(key)
        await self.notifications.forget_user_devices(uuid.UUID(user_id))

    @staticmethod
    def _families_key(user_id: uuid.UUID) -> str:
        return f"{_USER_FAMILIES_PREFIX}{user_id}{_FAMILIES_SUFFIX}"
