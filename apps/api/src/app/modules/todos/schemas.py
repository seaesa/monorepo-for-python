import uuid
from datetime import datetime

from pydantic import Field

from app.shared.schemas import PageParams, Schema


class TodoRead(Schema):
    id: uuid.UUID
    title: str
    description: str | None
    completed: bool
    due_date: datetime | None
    created_at: datetime
    updated_at: datetime


class TodoCreate(Schema):
    title: str = Field(min_length=1, max_length=255)
    description: str | None = Field(default=None, max_length=5000)
    due_date: datetime | None = None


class TodoUpdate(Schema):
    title: str | None = Field(default=None, min_length=1, max_length=255)
    description: str | None = Field(default=None, max_length=5000)
    completed: bool | None = None
    due_date: datetime | None = None


class TodoFilter(PageParams):
    completed: bool | None = None
    search: str | None = Field(default=None, max_length=100)
