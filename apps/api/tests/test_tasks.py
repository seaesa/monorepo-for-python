"""Verification and reset emails travel through Celery, never inline in the request."""

from collections.abc import Iterator
from typing import Any

import pytest
from celery.signals import task_prerun
from httpx import AsyncClient

from app.core.mail import OutboxEmailSender
from app.modules.users.tasks import send_email
from tests.helpers import register_verified

TASK_NAME = "app.modules.users.tasks.send_email"


@pytest.fixture
def dispatched() -> Iterator[list[str]]:
    """Task names Celery actually ran; eager mode runs them inside the request."""
    names: list[str] = []

    def record(sender: Any = None, task: Any = None, **_: Any) -> None:
        names.append(task.name)

    task_prerun.connect(record, weak=False)
    try:
        yield names
    finally:
        task_prerun.disconnect(record)


def test_send_email_retries_with_backoff() -> None:
    assert send_email.max_retries == 5
    assert send_email.retry_backoff is True
    assert send_email.autoretry_for


async def test_register_dispatches_one_verification_email(
    client: AsyncClient, outbox: OutboxEmailSender, dispatched: list[str]
) -> None:
    response = await client.post(
        "/auth/register",
        json={"email": "queued@example.com", "fullName": "Queued", "password": "secret123"},
    )

    assert response.status_code == 201
    assert dispatched == [TASK_NAME]
    assert [m.to for m in outbox.messages] == ["queued@example.com"]
    assert "/verify-email?token=" in outbox.messages[0].text


async def test_forgot_password_dispatches_one_reset_email(
    client: AsyncClient, outbox: OutboxEmailSender, dispatched: list[str]
) -> None:
    await register_verified(client, outbox, "reset@example.com")
    outbox.clear()
    dispatched.clear()

    response = await client.post("/auth/forgot-password", json={"email": "reset@example.com"})

    assert response.status_code == 204
    assert dispatched == [TASK_NAME]
    assert [m.to for m in outbox.messages] == ["reset@example.com"]
    assert "/reset-password?token=" in outbox.messages[0].text
