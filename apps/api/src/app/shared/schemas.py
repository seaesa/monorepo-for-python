from enum import StrEnum
from typing import Any

from pydantic import BaseModel, ConfigDict, Field
from pydantic.alias_generators import to_camel


class Schema(BaseModel):
    """Base for every API schema: snake_case in Python, camelCase on the wire."""

    model_config = ConfigDict(
        alias_generator=to_camel,
        populate_by_name=True,
        from_attributes=True,
    )


class ErrorCode(StrEnum):
    """Every error code the API can return. Exported to OpenAPI as an enum, so the
    frontend gets a TS union and `packages/i18n` must translate each one (type-checked).
    Add a member here before raising a new code."""

    BAD_REQUEST = "bad_request"
    UNAUTHORIZED = "unauthorized"
    INVALID_CREDENTIALS = "invalid_credentials"
    INVALID_TOKEN = "invalid_token"
    ACCOUNT_DISABLED = "account_disabled"
    FORBIDDEN = "forbidden"
    NOT_FOUND = "not_found"
    CONFLICT = "conflict"
    EMAIL_TAKEN = "email_taken"
    VALIDATION_ERROR = "validation_error"
    HTTP_ERROR = "http_error"
    INTERNAL_ERROR = "internal_error"


class FieldError(Schema):
    """Error attached to one input field (dot path of camelCase names, e.g. `items.0.title`).

    `code` is an `ErrorCode` for domain errors raised with `field=…`, or a Pydantic error
    type (`missing`, `string_too_short`, …) for request validation; `params` carries
    values for interpolation (e.g. `{"min_length": 8}`).
    """

    field: str
    code: str
    message: str
    params: dict[str, Any] | None = None


class ErrorResponse(Schema):
    code: ErrorCode
    message: str
    details: list[FieldError] | None = None


class Page[T](Schema):
    items: list[T]
    total: int
    page: int
    size: int
    pages: int

    @classmethod
    def create(cls, items: list[T], total: int, page: int, size: int) -> "Page[T]":
        return cls(items=items, total=total, page=page, size=size, pages=-(-total // size))


class PageParams(Schema):
    page: int = Field(default=1, ge=1)
    size: int = Field(default=20, ge=1, le=100)

    @property
    def offset(self) -> int:
        return (self.page - 1) * self.size
