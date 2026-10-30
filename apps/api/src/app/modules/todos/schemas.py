import uuid
from datetime import datetime

from pydantic import Field

from app.shared.pagination import CursorParams
from app.shared.schemas import Schema, reject_null


class TodoRead(Schema):
    id: uuid.UUID
    title: str
    description: str | None
    completed: bool
    created_at: datetime
    updated_at: datetime


class TodoCreate(Schema):
    title: str = Field(min_length=1, max_length=255)
    description: str | None = Field(default=None, max_length=5000)


class TodoUpdate(Schema):
    """`title` and `completed` cannot be nulled; `description` can (it clears the value)."""

    title: str | None = Field(default=None, min_length=1, max_length=255)
    description: str | None = Field(default=None, max_length=5000)
    completed: bool | None = None

    _reject_null = reject_null("title", "completed")


class TodoFilter(CursorParams):
    completed: bool | None = None
