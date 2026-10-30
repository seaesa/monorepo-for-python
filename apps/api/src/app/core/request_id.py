"""Request ids: one per request, echoed back, logged, and exposed in error envelopes."""

import re
import uuid

import structlog
from starlette.datastructures import Headers, MutableHeaders
from starlette.types import ASGIApp, Message, Receive, Scope, Send

REQUEST_ID_HEADER = "X-Request-ID"

# Only ids we are willing to echo back: no whitespace, no header-splitting characters.
_VALID_REQUEST_ID = re.compile(r"[A-Za-z0-9._-]{1,128}")


class RequestIdMiddleware:
    """Give every request an id: reuse the caller's `X-Request-ID` or mint one.

    The id lands on `request.state.request_id`, in the response header, in structlog's
    contextvars (so every log line of that request carries it) and in error envelopes, so a
    user can quote it in a bug report and the log line can be found.
    """

    def __init__(self, app: ASGIApp) -> None:
        self.app = app

    async def __call__(self, scope: Scope, receive: Receive, send: Send) -> None:
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return

        incoming = Headers(scope=scope).get(REQUEST_ID_HEADER, "")
        request_id = incoming if _VALID_REQUEST_ID.fullmatch(incoming) else uuid.uuid4().hex
        scope.setdefault("state", {})["request_id"] = request_id
        structlog.contextvars.bind_contextvars(request_id=request_id)

        async def send_with_request_id(message: Message) -> None:
            if message["type"] == "http.response.start":
                MutableHeaders(scope=message)[REQUEST_ID_HEADER] = request_id
            await send(message)

        try:
            await self.app(scope, receive, send_with_request_id)
        finally:
            structlog.contextvars.clear_contextvars()
