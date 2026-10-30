"""Account lifecycle over HTTP: verify, resend, forgot/reset, change password, delete."""

import re

from httpx import AsyncClient

from app.core.mail import EmailMessage, OutboxEmailSender

PASSWORD = "secret123"
NEW_PASSWORD = "brand-new-secret-456"

_TOKEN_RE = re.compile(r"token=([A-Za-z0-9._\-]+)")


def _bearer(tokens: dict[str, str]) -> dict[str, str]:
    return {"Authorization": f"Bearer {tokens['accessToken']}"}


def _email_with(outbox: OutboxEmailSender, marker: str) -> EmailMessage:
    matches = [message for message in outbox.messages if marker in message.text]
    assert len(matches) == 1, [message.subject for message in outbox.messages]
    return matches[0]


def _token_from(message: EmailMessage) -> str:
    match = _TOKEN_RE.search(message.text)
    assert match is not None, message.text
    return match.group(1)


async def _register(client: AsyncClient, email: str = "jane@example.com") -> dict[str, str]:
    response = await client.post(
        "/auth/register", json={"email": email, "fullName": "Jane", "password": PASSWORD}
    )
    assert response.status_code == 201
    return response.json()


async def test_register_sends_a_verification_email_and_verify_marks_the_user(
    client: AsyncClient, outbox: OutboxEmailSender
) -> None:
    tokens = await _register(client)
    message = _email_with(outbox, "/verify-email?token=")
    assert message.to == "jane@example.com"

    response = await client.post("/auth/verify-email", json={"token": _token_from(message)})

    assert response.status_code == 204
    me = await client.get("/users/me", headers=_bearer(tokens))
    assert me.json()["emailVerified"] is True


async def test_verifying_twice_is_a_conflict(
    client: AsyncClient, outbox: OutboxEmailSender
) -> None:
    await _register(client)
    token = _token_from(_email_with(outbox, "/verify-email?token="))
    await client.post("/auth/verify-email", json={"token": token})

    response = await client.post("/auth/verify-email", json={"token": token})

    assert response.status_code == 401
    assert response.json()["code"] == "invalid_token"


async def test_verifying_with_a_second_fresh_token_is_a_conflict(
    client: AsyncClient, outbox: OutboxEmailSender
) -> None:
    await _register(client)
    first = _token_from(_email_with(outbox, "/verify-email?token="))
    outbox.clear()
    await client.post("/auth/resend-verification", json={"email": "jane@example.com"})
    second = _token_from(_email_with(outbox, "/verify-email?token="))
    await client.post("/auth/verify-email", json={"token": first})

    response = await client.post("/auth/verify-email", json={"token": second})

    assert response.status_code == 409
    assert response.json()["code"] == "email_already_verified"


async def test_verifying_with_a_garbage_token_is_rejected(client: AsyncClient) -> None:
    response = await client.post("/auth/verify-email", json={"token": "not-a-token"})

    assert response.status_code == 401
    assert response.json()["code"] == "invalid_token"


async def test_resend_verification_is_silent_for_unknown_email(
    client: AsyncClient, outbox: OutboxEmailSender
) -> None:
    response = await client.post("/auth/resend-verification", json={"email": "ghost@example.com"})

    assert response.status_code == 204
    assert outbox.messages == []


async def test_resend_verification_sends_a_fresh_token(
    client: AsyncClient, outbox: OutboxEmailSender
) -> None:
    await _register(client)
    outbox.clear()

    response = await client.post("/auth/resend-verification", json={"email": "jane@example.com"})

    assert response.status_code == 204
    assert len(_email_with(outbox, "/verify-email?token=").text) > 0


async def test_forgot_password_is_silent_for_unknown_email(
    client: AsyncClient, outbox: OutboxEmailSender
) -> None:
    response = await client.post("/auth/forgot-password", json={"email": "ghost@example.com"})

    assert response.status_code == 204
    assert outbox.messages == []


async def test_reset_password_changes_the_password_and_revokes_old_sessions(
    client: AsyncClient, outbox: OutboxEmailSender
) -> None:
    tokens = await _register(client)
    outbox.clear()
    await client.post("/auth/forgot-password", json={"email": "jane@example.com"})
    token = _token_from(_email_with(outbox, "/reset-password?token="))

    response = await client.post(
        "/auth/reset-password", json={"token": token, "password": NEW_PASSWORD}
    )

    assert response.status_code == 204
    old_login = await client.post(
        "/auth/login", json={"email": "jane@example.com", "password": PASSWORD}
    )
    assert old_login.status_code == 401
    new_login = await client.post(
        "/auth/login", json={"email": "jane@example.com", "password": NEW_PASSWORD}
    )
    assert new_login.status_code == 200
    assert (await client.get("/users/me", headers=_bearer(tokens))).status_code == 401
    assert (
        await client.post("/auth/refresh", json={"refreshToken": tokens["refreshToken"]})
    ).status_code == 401


async def test_reset_token_is_single_use(client: AsyncClient, outbox: OutboxEmailSender) -> None:
    await _register(client)
    outbox.clear()
    await client.post("/auth/forgot-password", json={"email": "jane@example.com"})
    token = _token_from(_email_with(outbox, "/reset-password?token="))
    await client.post("/auth/reset-password", json={"token": token, "password": NEW_PASSWORD})

    response = await client.post(
        "/auth/reset-password", json={"token": token, "password": "another-secret-789"}
    )

    assert response.status_code == 401
    assert response.json()["code"] == "invalid_token"


async def test_change_password_requires_the_current_password(client: AsyncClient) -> None:
    tokens = await _register(client)

    wrong = await client.post(
        "/auth/change-password",
        json={"currentPassword": "not-my-password", "newPassword": NEW_PASSWORD},
        headers=_bearer(tokens),
    )

    assert wrong.status_code == 401
    assert wrong.json()["code"] == "invalid_credentials"

    changed = await client.post(
        "/auth/change-password",
        json={"currentPassword": PASSWORD, "newPassword": NEW_PASSWORD},
        headers=_bearer(tokens),
    )
    assert changed.status_code == 204
    login = await client.post(
        "/auth/login", json={"email": "jane@example.com", "password": NEW_PASSWORD}
    )
    assert login.status_code == 200


async def test_delete_account_requires_the_password(client: AsyncClient) -> None:
    tokens = await _register(client)

    wrong = await client.post(
        "/users/me/delete", json={"password": "not-my-password"}, headers=_bearer(tokens)
    )

    assert wrong.status_code == 401
    assert wrong.json()["code"] == "invalid_credentials"

    deleted = await client.post(
        "/users/me/delete", json={"password": PASSWORD}, headers=_bearer(tokens)
    )
    assert deleted.status_code == 204
    login = await client.post(
        "/auth/login", json={"email": "jane@example.com", "password": PASSWORD}
    )
    assert login.status_code == 401


async def test_verification_email_follows_the_request_language(
    client: AsyncClient, outbox: OutboxEmailSender
) -> None:
    await client.post(
        "/auth/register",
        json={"email": "vi@example.com", "fullName": "Vi", "password": PASSWORD},
        headers={"Accept-Language": "vi-VN,vi;q=0.9"},
    )

    message = _email_with(outbox, "/verify-email?token=")

    assert "xác nhận" in message.subject.lower()
