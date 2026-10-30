"""Opaque keyset cursors: base64url of `{"t": created_at, "i": id}`.

A cursor is a position, not a secret — it names a row the caller can already list.
Encoding keeps clients from depending on the internal shape, so the sort key can
change without breaking them.
"""

import base64
import json
import uuid
from datetime import datetime

from pydantic import Field, field_validator
from pydantic_core import PydanticCustomError

from app.shared.schemas import Schema


def encode_cursor(created_at: datetime, id_: uuid.UUID) -> str:
    payload = json.dumps({"t": created_at.isoformat(), "i": str(id_)}, separators=(",", ":"))
    return base64.urlsafe_b64encode(payload.encode()).decode().rstrip("=")


def decode_cursor(cursor: str) -> tuple[datetime, uuid.UUID]:
    """Inverse of `encode_cursor`; raises `ValueError` for anything it did not issue."""
    try:
        padded = cursor + "=" * (-len(cursor) % 4)
        payload = json.loads(base64.urlsafe_b64decode(padded.encode()))
        return datetime.fromisoformat(payload["t"]), uuid.UUID(payload["i"])
    except (KeyError, TypeError, ValueError) as exc:
        raise ValueError("invalid cursor") from exc


class CursorParams(Schema):
    limit: int = Field(default=20, ge=1, le=100)
    cursor: str | None = None

    @field_validator("cursor")
    @classmethod
    def _check_cursor(cls, value: str | None) -> str | None:
        if value:
            try:
                decode_cursor(value)
            except ValueError:
                raise PydanticCustomError("invalid_cursor", "Invalid pagination cursor") from None
        return value

    @property
    def after(self) -> tuple[datetime, uuid.UUID] | None:
        """The `(created_at, id)` pair the next page starts after."""
        return decode_cursor(self.cursor) if self.cursor else None
