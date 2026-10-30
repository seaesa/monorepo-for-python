import uuid
from datetime import UTC, datetime, timedelta
from typing import Any, Literal

import jwt
from pwdlib import PasswordHash

from app.core.config import Settings

TokenType = Literal["access", "refresh"]

_password_hash = PasswordHash.recommended()


def hash_password(password: str) -> str:
    return _password_hash.hash(password)


def verify_password(password: str, hashed: str) -> bool:
    return _password_hash.verify(password, hashed)


class TokenEncoder:
    def __init__(self, settings: Settings) -> None:
        self._settings = settings

    def encode(self, subject: str, token_type: TokenType) -> tuple[str, int]:
        """Return `(token, expires_in_seconds)`."""
        if token_type == "access":
            ttl = timedelta(minutes=self._settings.access_token_expire_minutes)
        else:
            ttl = timedelta(days=self._settings.refresh_token_expire_days)
        now = datetime.now(UTC)
        payload = {
            "sub": subject,
            "type": token_type,
            "jti": uuid.uuid4().hex,
            "iat": now,
            "exp": now + ttl,
        }
        token = jwt.encode(payload, self._settings.jwt_secret, self._settings.jwt_algorithm)
        return token, int(ttl.total_seconds())

    def decode(self, token: str, token_type: TokenType) -> dict[str, Any] | None:
        try:
            payload: dict[str, Any] = jwt.decode(
                token, self._settings.jwt_secret, algorithms=[self._settings.jwt_algorithm]
            )
        except jwt.PyJWTError:
            return None
        return payload if payload.get("type") == token_type else None
