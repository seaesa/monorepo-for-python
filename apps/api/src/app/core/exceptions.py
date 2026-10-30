from typing import Any

import structlog
from fastapi import FastAPI, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from sqlalchemy.exc import IntegrityError
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.shared.schemas import ErrorCode, ErrorResponse, FieldError

logger = structlog.get_logger(__name__)


class AppError(Exception):
    """Base class for domain errors. Raise subclasses from services, never HTTPException.

    `code` (an `ErrorCode`) is what clients translate; `message` is an English fallback
    for logs/tools. Pass a specific code when the class default is too generic, and
    `field` when the error belongs to one input so forms show it under that field:

        raise ConflictError("Email already registered", code=ErrorCode.EMAIL_TAKEN, field="email")
    """

    status_code: int = status.HTTP_400_BAD_REQUEST
    code: ErrorCode = ErrorCode.BAD_REQUEST
    message: str = "Bad request"

    def __init__(
        self,
        message: str | None = None,
        *,
        code: ErrorCode | None = None,
        field: str | None = None,
        params: dict[str, Any] | None = None,
        headers: dict[str, str] | None = None,
    ) -> None:
        self.message = message or self.message
        self.code = code or self.code
        self.headers = headers
        self.details = (
            [FieldError(field=field, code=self.code, message=self.message, params=params)]
            if field
            else None
        )
        super().__init__(self.message)


class NotFoundError(AppError):
    status_code = status.HTTP_404_NOT_FOUND
    code = ErrorCode.NOT_FOUND
    message = "Resource not found"


class ConflictError(AppError):
    status_code = status.HTTP_409_CONFLICT
    code = ErrorCode.CONFLICT
    message = "Resource already exists"


class UnauthorizedError(AppError):
    status_code = status.HTTP_401_UNAUTHORIZED
    code = ErrorCode.UNAUTHORIZED
    message = "Not authenticated"


class ForbiddenError(AppError):
    status_code = status.HTTP_403_FORBIDDEN
    code = ErrorCode.FORBIDDEN
    message = "Permission denied"


class UpgradeRequiredError(AppError):
    status_code = status.HTTP_426_UPGRADE_REQUIRED
    code = ErrorCode.APP_UPDATE_REQUIRED
    message = "This app version is no longer supported"


class RateLimitedError(AppError):
    status_code = status.HTTP_429_TOO_MANY_REQUESTS
    code = ErrorCode.RATE_LIMITED
    message = "Too many requests"

    def __init__(self, retry_after: int) -> None:
        super().__init__(headers={"Retry-After": str(retry_after)})


def _request_id(request: Request) -> str | None:
    """The id `RequestIdMiddleware` attached, if the middleware is installed."""
    return getattr(request.state, "request_id", None)


def _error(
    status_code: int,
    code: ErrorCode,
    message: str,
    details: list[FieldError] | None = None,
    headers: dict[str, str] | None = None,
    request_id: str | None = None,
) -> JSONResponse:
    body = ErrorResponse(code=code, message=message, details=details, request_id=request_id)
    return JSONResponse(
        status_code=status_code,
        content=body.model_dump(mode="json", by_alias=True),
        headers=headers,
    )


def _json_safe(ctx: dict[str, Any] | None) -> dict[str, Any] | None:
    """Keep primitive ctx values (min_length, ge, …); drop exceptions/objects."""
    if not ctx:
        return None
    safe = {k: v for k, v in ctx.items() if isinstance(v, str | int | float | bool)}
    return safe or None


def register_exception_handlers(app: FastAPI) -> None:
    @app.exception_handler(AppError)
    async def _app_error(request: Request, exc: AppError) -> JSONResponse:
        return _error(
            exc.status_code,
            exc.code,
            exc.message,
            exc.details,
            exc.headers,
            _request_id(request),
        )

    @app.exception_handler(StarletteHTTPException)
    async def _http_error(request: Request, exc: StarletteHTTPException) -> JSONResponse:
        # Framework-level errors (unknown route, 405, ...) use the same envelope.
        code = ErrorCode.NOT_FOUND if exc.status_code == 404 else ErrorCode.HTTP_ERROR
        return _error(exc.status_code, code, str(exc.detail), request_id=_request_id(request))

    @app.exception_handler(IntegrityError)
    async def _integrity_error(request: Request, exc: IntegrityError) -> JSONResponse:
        # A constraint no service mapped still means "conflict", never a 500.
        logger.warning("integrity_error", error=str(exc.orig))
        return _error(
            status.HTTP_409_CONFLICT,
            ErrorCode.CONFLICT,
            "Resource already exists",
            request_id=_request_id(request),
        )

    @app.exception_handler(RequestValidationError)
    async def _validation_error(request: Request, exc: RequestValidationError) -> JSONResponse:
        details = [
            FieldError(
                field=".".join(str(p) for p in err["loc"][1:]),
                code=err["type"],
                message=err["msg"],
                params=_json_safe(err.get("ctx")),
            )
            for err in exc.errors()
        ]
        return _error(
            422,
            ErrorCode.VALIDATION_ERROR,
            "Invalid request",
            details,
            request_id=_request_id(request),
        )

    @app.exception_handler(Exception)
    async def _unhandled(request: Request, exc: Exception) -> JSONResponse:
        logger.exception("unhandled_error", exc_info=exc)
        return _error(
            500, ErrorCode.INTERNAL_ERROR, "Internal server error", request_id=_request_id(request)
        )


# Attach to routers so the shared error shape is part of the OpenAPI contract.
ERROR_RESPONSES: dict[int | str, dict[str, Any]] = {
    status.HTTP_400_BAD_REQUEST: {"model": ErrorResponse},
    status.HTTP_401_UNAUTHORIZED: {"model": ErrorResponse},
    status.HTTP_403_FORBIDDEN: {"model": ErrorResponse},
    status.HTTP_404_NOT_FOUND: {"model": ErrorResponse},
    status.HTTP_409_CONFLICT: {"model": ErrorResponse},
    status.HTTP_422_UNPROCESSABLE_CONTENT: {"model": ErrorResponse},
    status.HTTP_429_TOO_MANY_REQUESTS: {"model": ErrorResponse},
}
