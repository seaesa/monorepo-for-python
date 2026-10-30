"""Credential endpoints are rate limited per subject, with a sliding window."""

from dishka import AsyncContainer
from httpx import AsyncClient
from redis.asyncio import Redis

from app.core.rate_limit import RateLimiter


class FakeClock:
    def __init__(self, now: float = 1_000.0) -> None:
        self.now = now

    def __call__(self) -> float:
        return self.now


async def test_sixth_login_attempt_is_rate_limited(client: AsyncClient) -> None:
    payload = {"email": "jane@example.com", "password": "wrong-password"}
    for _ in range(5):
        assert (await client.post("/auth/login", json=payload)).status_code == 401

    response = await client.post("/auth/login", json=payload)

    assert response.status_code == 429
    assert response.json()["code"] == "rate_limited"
    assert int(response.headers["Retry-After"]) > 0


async def test_limit_is_per_email(client: AsyncClient) -> None:
    for _ in range(5):
        await client.post("/auth/login", json={"email": "jane@example.com", "password": "nope"})

    response = await client.post(
        "/auth/login", json={"email": "john@example.com", "password": "nope"}
    )

    assert response.status_code == 401


async def test_window_resets_after_it_elapses(container: AsyncContainer) -> None:
    redis = await container.get(Redis)
    clock = FakeClock()
    limiter = RateLimiter(redis, clock=clock)

    assert (await limiter.hit("scope:subject", 2, 60)).allowed
    assert (await limiter.hit("scope:subject", 2, 60)).allowed

    blocked = await limiter.hit("scope:subject", 2, 60)
    assert blocked.allowed is False
    assert blocked.remaining == 0
    assert 0 < blocked.retry_after <= 60

    clock.now += 60
    allowed = await limiter.hit("scope:subject", 2, 60)

    assert allowed.allowed is True
    assert allowed.remaining == 1
