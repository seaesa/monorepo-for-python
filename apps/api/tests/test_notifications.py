"""Push devices: who receives a push, in which language, and dead-token cleanup."""

from urllib.parse import quote

from httpx import AsyncClient

from app.core.mail import OutboxEmailSender
from app.core.push import OutboxPushSender
from app.modules.notifications.templates import push_enabled_copy
from tests.helpers import PASSWORD, register_verified

PHONE = "ExponentPushToken[phone-1]"


async def _register(client: AsyncClient, token: str = PHONE, language: str = "en") -> None:
    response = await client.put(
        "/notifications/devices",
        json={"token": token, "platform": "ios"},
        headers={"Accept-Language": language},
    )
    assert response.status_code == 204, response.text


async def test_push_is_rendered_in_each_device_language(
    auth_client: AsyncClient, push_outbox: OutboxPushSender
) -> None:
    await _register(auth_client, PHONE, "vi")
    await _register(auth_client, "ExponentPushToken[tablet]", "en")

    response = await auth_client.post("/notifications/test")

    assert response.status_code == 202
    titles = {m.to: m.title for m in push_outbox.messages}
    assert titles == {
        PHONE: push_enabled_copy()["vi"].title,
        "ExponentPushToken[tablet]": push_enabled_copy()["en"].title,
    }


async def test_token_follows_the_user_who_signed_in_last(
    auth_client: AsyncClient, outbox: OutboxEmailSender, push_outbox: OutboxPushSender
) -> None:
    await _register(auth_client)
    other = await register_verified(auth_client, outbox, "bob@example.com")
    auth_client.headers["Authorization"] = f"Bearer {other['accessToken']}"
    await _register(auth_client)

    await auth_client.post("/notifications/test")

    assert [m.to for m in push_outbox.messages] == [PHONE]


async def test_unregister_only_removes_own_device(
    auth_client: AsyncClient, outbox: OutboxEmailSender, push_outbox: OutboxPushSender
) -> None:
    jane_auth = auth_client.headers["Authorization"]
    await _register(auth_client)
    other = await register_verified(auth_client, outbox, "bob@example.com")
    auth_client.headers["Authorization"] = f"Bearer {other['accessToken']}"
    response = await auth_client.delete(f"/notifications/devices/{quote(PHONE)}")
    assert response.status_code == 204

    auth_client.headers["Authorization"] = jane_auth
    await auth_client.post("/notifications/test")
    assert [m.to for m in push_outbox.messages] == [PHONE]


async def test_token_rejected_by_the_provider_is_forgotten(
    auth_client: AsyncClient, push_outbox: OutboxPushSender
) -> None:
    await _register(auth_client)
    push_outbox.dead_tokens.add(PHONE)
    await auth_client.post("/notifications/test")
    push_outbox.clear()

    await auth_client.post("/notifications/test")

    assert push_outbox.messages == []


async def test_rejects_a_token_that_is_not_an_expo_token(auth_client: AsyncClient) -> None:
    response = await auth_client.put(
        "/notifications/devices", json={"token": "abc", "platform": "ios"}
    )
    assert response.status_code == 422
    assert response.json()["details"][0]["field"] == "token"


async def test_signing_out_everywhere_stops_pushes(
    auth_client: AsyncClient, push_outbox: OutboxPushSender
) -> None:
    await _register(auth_client)
    response = await auth_client.post(
        "/auth/change-password",
        json={"currentPassword": PASSWORD, "newPassword": "another123"},
    )
    assert response.status_code == 204, response.text

    login = await auth_client.post(
        "/auth/login", json={"email": "jane@example.com", "password": "another123"}
    )
    auth_client.headers["Authorization"] = f"Bearer {login.json()['accessToken']}"
    await auth_client.post("/notifications/test")

    assert push_outbox.messages == []
