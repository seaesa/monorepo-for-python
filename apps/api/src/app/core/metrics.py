"""Prometheus metrics for the HTTP layer.

Requests are labelled by the **route template** (`/api/v1/todos/{todoId}`), never the raw
path: raw paths would make every id a new label value and blow up the registry.

`/metrics` is unauthenticated and mounted only when `METRICS_ENABLED` is true. Keep it off
the public internet: scrape it over the cluster network or behind the reverse proxy.
"""

import time
from collections.abc import Sequence

from fastapi import Response
from prometheus_client import CONTENT_TYPE_LATEST, Counter, Histogram, generate_latest
from starlette.routing import BaseRoute
from starlette.types import ASGIApp, Message, Receive, Scope, Send

METRICS_PATH = "/metrics"
UNMATCHED = "unmatched"

REQUEST_COUNT = Counter(
    "http_requests_total",
    "HTTP requests handled, by route, method and status code.",
    ["method", "path", "status"],
)
REQUEST_DURATION = Histogram(
    "http_request_duration_seconds",
    "HTTP request duration in seconds, by route and method.",
    ["method", "path"],
)


class MetricsMiddleware:
    """Counts every HTTP request and records its duration, including error responses."""

    def __init__(self, app: ASGIApp, routes: Sequence[BaseRoute] | None = None) -> None:
        self.app = app
        self._paths = {
            id(route.endpoint): route.path  # type: ignore[attr-defined]
            for route in routes or ()
            if getattr(route, "endpoint", None) is not None
        }

    def _path(self, scope: Scope) -> str:
        route = scope.get("route")
        path = getattr(route, "path", None)
        if path is not None:
            return str(path)
        endpoint = scope.get("endpoint")
        return self._paths.get(id(endpoint), UNMATCHED) if endpoint is not None else UNMATCHED

    async def __call__(self, scope: Scope, receive: Receive, send: Send) -> None:
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return

        started = time.perf_counter()
        status = 500

        async def send_with_metrics(message: Message) -> None:
            nonlocal status
            if message["type"] == "http.response.start":
                status = message["status"]
            await send(message)

        try:
            await self.app(scope, receive, send_with_metrics)
        finally:
            path = self._path(scope)
            if path != METRICS_PATH:
                method = scope["method"]
                REQUEST_COUNT.labels(method=method, path=path, status=str(status)).inc()
                REQUEST_DURATION.labels(method=method, path=path).observe(
                    time.perf_counter() - started
                )


def metrics_response() -> Response:
    return Response(content=generate_latest(), media_type=CONTENT_TYPE_LATEST)
