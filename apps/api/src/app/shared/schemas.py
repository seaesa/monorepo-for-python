from collections.abc import Callable
from enum import StrEnum
from typing import Any

from pydantic import BaseModel, ConfigDict, field_validator
from pydantic.alias_generators import to_camel
from pydantic_core import PydanticCustomError


class Schema(BaseModel):
    """Base for every API schema: snake_case in Python, camelCase on the wire."""

    model_config = ConfigDict(
        alias_generator=to_camel,
        populate_by_name=True,
        from_attributes=True,
    )


def reject_null(*fields: str) -> Any:
    """Reject an explicit `null` for PATCH fields whose column is NOT NULL.

    Omitting the field is still valid (the validator only runs for values present in the
    request body), so `PATCH {"completed": true}` keeps working while
    `PATCH {"completed": null}` becomes a 422 instead of a database error.
    """

    def _reject(value: Any) -> Any:
        if value is None:
            raise PydanticCustomError("null_not_allowed", "This field cannot be null")
        return value

    return field_validator(*fields, mode="before")(_reject)


class ErrorCode(StrEnum):
    """Every error code the API can return. Exported to OpenAPI as an enum, so the
    frontend gets a TS union and `packages/i18n` must translate each one (type-checked).
    Add a member here before raising a new code."""

    BAD_REQUEST = "bad_request"
    UNAUTHORIZED = "unauthorized"
    INVALID_CREDENTIALS = "invalid_credentials"
    INVALID_TOKEN = "invalid_token"
    ACCOUNT_DISABLED = "account_disabled"
    EMAIL_NOT_VERIFIED = "email_not_verified"
    EMAIL_ALREADY_VERIFIED = "email_already_verified"
    FORBIDDEN = "forbidden"
    NOT_FOUND = "not_found"
    CONFLICT = "conflict"
    EMAIL_TAKEN = "email_taken"
    VALIDATION_ERROR = "validation_error"
    RATE_LIMITED = "rate_limited"
    APP_UPDATE_REQUIRED = "app_update_required"
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
    request_id: str | None = None


class CursorPage[T](Schema):
    """Keyset page. `next_cursor` is null on the last page; there is no total count."""

    items: list[T]
    next_cursor: str | None

    @classmethod
    def create(cls, items: list[T], limit: int, cursor_of: Callable[[T], str]) -> "CursorPage[T]":
        """Slice `limit` items (the caller fetched `limit + 1`) and point at the next page."""
        page = items[:limit]
        has_more = len(items) > limit
        return cls(items=page, next_cursor=cursor_of(page[-1]) if has_more else None)
