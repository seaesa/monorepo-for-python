import uuid
from datetime import datetime

from pydantic import EmailStr, Field

from app.shared.schemas import Schema


class UserRead(Schema):
    id: uuid.UUID
    email: EmailStr
    full_name: str
    is_active: bool
    created_at: datetime


class UserCreate(Schema):
    email: EmailStr
    full_name: str = Field(min_length=1, max_length=255)
    password: str = Field(min_length=8, max_length=128)


class UserUpdate(Schema):
    full_name: str | None = Field(default=None, min_length=1, max_length=255)
