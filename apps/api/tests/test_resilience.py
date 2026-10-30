"""Availability properties the suite did not pin: hashing off the loop, limiter outages."""

import threading

from httpx import AsyncClient
from redis.exceptions import ConnectionError as RedisConnectionError

from app.core import security
from app.core.rate_limit import RateLimiter
from tests.helpers import PASSWORD, register_verified


async def test_login_hashes_off_the_event_loop_thread(
    client: AsyncClient, outbox: object, monkeypatch: object
) -> None:
    """argon2 takes ~100 ms of CPU: on the loop it would serialise every request."""
    await register_verified(client, outbox, "thread@example.com")  # type: ignore[arg-type]

    threads: list[str] = []
    original = security._password_hash.verify

    def record(password: str, hashed: str) -> bool:
        threads.append(threading.current_thread().name)
        return original(password, hashed)

    monkeypatch.setattr(security._password_hash, "verify", record)  # type: ignore[attr-defined]

    response = await client.post(
        "/auth/login", json={"email": "thread@example.com", "password": PASSWORD}
    )

    assert response.status_code == 200
    assert threads, "the password was never verified"
    assert threads[0] != threading.main_thread().name


async def test_forgot_password_survives_a_limiter_outage(
    client: AsyncClient, monkeypatch: object
) -> None:
    """A rate limiter that cannot reach Redis must not take password reset down with it."""

    async def unavailable(self: RateLimiter, key: str, limit: int, window_seconds: int) -> object:
        raise RedisConnectionError("redis is down")

    monkeypatch.setattr(RateLimiter, "hit", unavailable)  # type: ignore[attr-defined]

    response = await client.post("/auth/forgot-password", json={"email": "nobody@example.com"})

    assert response.status_code == 204
