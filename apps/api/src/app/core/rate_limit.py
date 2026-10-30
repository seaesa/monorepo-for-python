"""Fixed-window rate limiting backed by Redis.

The window is part of the Redis key (`rl:<scope>:<subject>:<bucket>`), so a new
window starts a new counter and no cleanup is needed beyond the key's TTL.
Behind a reverse proxy, run uvicorn with `--proxy-headers --forwarded-allow-ips=…`
so `request.client.host` is the real client address.
"""

import time
from collections.abc import Awaitable, Callable
from dataclasses import dataclass
from typing import cast

import structlog
from dishka import AsyncContainer
from fastapi import Request
from redis.asyncio import Redis
from redis.exceptions import RedisError

from app.core.config import Settings
from app.core.exceptions import RateLimitedError

logger = structlog.get_logger(__name__)

_HIT_SCRIPT = """
local current = redis.call('INCR', KEYS[1])
if current == 1 then
  redis.call('EXPIRE', KEYS[1], ARGV[1])
end
return current
"""


@dataclass(frozen=True)
class RateLimitResult:
    allowed: bool
    remaining: int
    retry_after: int


class RateLimiter:
    def __init__(self, redis: Redis, *, clock: Callable[[], float] = time.time) -> None:
        self._redis = redis
        self._clock = clock

    async def hit(self, key: str, limit: int, window_seconds: int) -> RateLimitResult:
        now = self._clock()
        bucket = int(now // window_seconds)
        # Keep the counter a little longer than the window so the TTL always wins.
        current = int(
            await cast(
                Awaitable[str],
                self._redis.eval(_HIT_SCRIPT, 1, f"rl:{key}:{bucket}", str(window_seconds * 2)),
            )
        )
        return RateLimitResult(
            allowed=current <= limit,
            remaining=max(0, limit - current),
            retry_after=max(1, window_seconds - int(now % window_seconds)),
        )


async def _subject(request: Request, *, by_email: bool) -> str:
    if by_email:
        try:
            payload = await request.json()
        except ValueError:
            payload = None
        if isinstance(payload, dict):
            email = str(payload.get("email") or "").strip().lower()
            if email:
                return f"email:{email}"
    return f"ip:{request.client.host if request.client else 'unknown'}"


def rate_limit(scope: str, *, by_email: bool = False) -> Callable[[Request], Awaitable[None]]:
    """Dependency factory: reject the request with 429 once `scope` is exhausted.

    Limits live in `Settings.rate_limit_for`, so deployments tune them with env vars.
    """

    async def _dependency(request: Request) -> None:
        container = cast(AsyncContainer, request.state.dishka_container)
        settings = await container.get(Settings)
        limiter = await container.get(RateLimiter)
        limit, window_seconds = settings.rate_limit_for(scope)
        subject = await _subject(request, by_email=by_email)
        try:
            result = await limiter.hit(f"{scope}:{subject}", limit, window_seconds)
        except RedisError:
            # A limiter that cannot reach Redis must not take the endpoint down with it:
            # losing a few attempts beats refusing every login and password reset.
            logger.warning("rate_limit_unavailable", scope=scope, subject=subject, exc_info=True)
            return
        if not result.allowed:
            logger.warning("rate_limited", scope=scope, subject=subject)
            raise RateLimitedError(retry_after=result.retry_after)

    return _dependency
