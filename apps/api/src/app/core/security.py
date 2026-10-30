import asyncio
import uuid
from datetime import UTC, datetime, timedelta
from typing import Any, Literal

import jwt
from pwdlib import PasswordHash

from app.core.config import Settings

TokenType = Literal["access", "refresh", "email_verify", "password_reset"]
OneShotTokenType = Literal["email_verify", "password_reset"]

_password_hash = PasswordHash.recommended()


def hash_password(password: str) -> str:
    return _password_hash.hash(password)


def verify_password(password: str, hashed: str) -> bool:
    return _password_hash.verify(password, hashed)


async def hash_password_async(password: str) -> str:
    """argon2 costs ~100 ms of CPU; hashing on the loop would serialise every request."""
    return await asyncio.to_thread(hash_password, password)


async def verify_password_async(password: str, hashed: str) -> bool:
    return await asyncio.to_thread(verify_password, password, hashed)


class TokenEncoder:
    def __init__(self, settings: Settings) -> None:
        self._settings = settings

    @property
    def refresh_ttl(self) -> int:
        """Refresh-token lifetime in seconds; also the TTL of the Redis keys tracking it."""
        return int(timedelta(days=self._settings.refresh_token_expire_days).total_seconds())

    @property
    def email_ttl(self) -> int:
        return int(timedelta(minutes=self._settings.email_token_expire_minutes).total_seconds())

    @property
    def reset_ttl(self) -> int:
        return int(timedelta(minutes=self._settings.reset_token_expire_minutes).total_seconds())

    def encode(
        self,
        subject: str,
        token_type: TokenType,
        *,
        version: int = 0,
        family: str | None = None,
        expires_in: int | None = None,
    ) -> tuple[str, int]:
        """Return `(token, expires_in_seconds)`.

        `version` is the user's token version (checked once accounts can invalidate all
        sessions); `family` groups the tokens of one session lineage so a stolen refresh
        token can revoke its siblings.
        """
        token, ttl, _ = self._encode(
            subject,
            token_type,
            version=version,
            family=family,
            expires_in=expires_in,
        )
        return token, ttl

    def encode_refresh(
        self, subject: str, family: str, *, version: int = 0
    ) -> tuple[str, int, str]:
        """Return `(token, expires_in_seconds, jti)` so the caller can register it."""
        return self._encode(subject, "refresh", version=version, family=family)

    def encode_one_shot(
        self, subject: str, token_type: OneShotTokenType, *, version: int = 0
    ) -> tuple[str, int, str]:
        """Return `(token, expires_in_seconds, jti)` for a single-use email link."""
        return self._encode(subject, token_type, version=version, family=None)

    def _encode(
        self,
        subject: str,
        token_type: TokenType,
        *,
        version: int,
        family: str | None,
        expires_in: int | None = None,
    ) -> tuple[str, int, str]:
        ttl = expires_in or self._default_ttl(token_type)
        now = datetime.now(UTC)
        jti = uuid.uuid4().hex
        payload: dict[str, Any] = {
            "sub": subject,
            "type": token_type,
            "jti": jti,
            "iat": now,
            "exp": now + timedelta(seconds=ttl),
            "ver": version,
        }
        if family:
            payload["fam"] = family
        token = jwt.encode(payload, self._settings.jwt_secret, self._settings.jwt_algorithm)
        return token, ttl, jti

    def _default_ttl(self, token_type: TokenType) -> int:
        match token_type:
            case "access":
                return int(
                    timedelta(minutes=self._settings.access_token_expire_minutes).total_seconds()
                )
            case "refresh":
                return self.refresh_ttl
            case "email_verify":
                return self.email_ttl
            case "password_reset":
                return self.reset_ttl

    def decode(self, token: str, token_type: TokenType) -> dict[str, Any] | None:
        try:
            payload: dict[str, Any] = jwt.decode(
                token, self._settings.jwt_secret, algorithms=[self._settings.jwt_algorithm]
            )
        except jwt.PyJWTError:
            return None
        return payload if payload.get("type") == token_type else None
