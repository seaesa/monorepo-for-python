"""Helpers shared by fixtures and tests that build their own server.

A plain module (not a fixture) because `test_realtime` runs a real uvicorn app with its
own container, so it needs the same flow against a different base URL.
"""

import re
from typing import Any

from httpx import AsyncClient

from app.core.mail import OutboxEmailSender

PASSWORD = "secret123"
_TOKEN_RE = re.compile(r"token=([A-Za-z0-9._\-]+)")


async def register_verified(
    client: AsyncClient,
    outbox: OutboxEmailSender,
    email: str,
    *,
    full_name: str = "Test User",
    prefix: str = "",
    password: str = PASSWORD,
) -> dict[str, Any]:
    """Register, confirm the address through the emailed token, return the token pair.

    Business endpoints require a verified address, so almost every test needs this.
    """
    response = await client.post(
        f"{prefix}/auth/register",
        json={"email": email, "fullName": full_name, "password": password},
    )
    assert response.status_code == 201, response.text
    tokens: dict[str, Any] = response.json()

    message = next(m for m in outbox.messages if m.to == email and "/verify-email?token=" in m.text)
    match = _TOKEN_RE.search(message.text)
    assert match is not None, message.text

    verified = await client.post(f"{prefix}/auth/verify-email", json={"token": match.group(1)})
    assert verified.status_code == 204, verified.text
    return tokens
