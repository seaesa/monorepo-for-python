"""Business endpoints stay closed until the address is confirmed (soft gate)."""

import re

from httpx import AsyncClient

from app.core.mail import OutboxEmailSender

PASSWORD = "secret123"
_TOKEN_RE = re.compile(r"token=([A-Za-z0-9._\-]+)")


async def _register(client: AsyncClient) -> dict[str, str]:
    response = await client.post(
        "/auth/register",
        json={"email": "gated@example.com", "fullName": "Gated", "password": PASSWORD},
    )
    assert response.status_code == 201
    return response.json()


def _bearer(tokens: dict[str, str]) -> dict[str, str]:
    return {"Authorization": f"Bearer {tokens['accessToken']}"}


async def test_unverified_user_is_blocked_from_todos(
    client: AsyncClient, outbox: OutboxEmailSender
) -> None:
    tokens = await _register(client)

    response = await client.get("/todos", headers=_bearer(tokens))

    assert response.status_code == 403
    assert response.json()["code"] == "email_not_verified"


async def test_unverified_user_can_still_read_their_profile(
    client: AsyncClient, outbox: OutboxEmailSender
) -> None:
    tokens = await _register(client)

    response = await client.get("/users/me", headers=_bearer(tokens))

    assert response.status_code == 200
    assert response.json()["emailVerified"] is False


async def test_verifying_unlocks_todos(client: AsyncClient, outbox: OutboxEmailSender) -> None:
    tokens = await _register(client)
    message = next(m for m in outbox.messages if "/verify-email?token=" in m.text)
    token = _TOKEN_RE.search(message.text)
    assert token is not None

    await client.post("/auth/verify-email", json={"token": token.group(1)})
    response = await client.get("/todos", headers=_bearer(tokens))

    assert response.status_code == 200
    assert response.json()["items"] == []
