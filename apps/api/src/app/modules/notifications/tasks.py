"""Celery tasks. Tasks stay thin: they run container work through `run_async`."""

import uuid
from typing import Any

import httpx
from dishka import AsyncContainer

from app.core.worker_container import run_async
from app.modules.notifications.service import NotificationService
from app.worker import celery_app


async def _deliver(
    container: AsyncContainer, user_id: str, copy: dict[str, dict[str, str]], data: dict[str, Any]
) -> None:
    async with container() as request:
        service = await request.get(NotificationService)
        await service.deliver(uuid.UUID(user_id), copy, data)


@celery_app.task(autoretry_for=(httpx.HTTPError,), retry_backoff=True, max_retries=5)
def send_push(user_id: str, copy: dict[str, dict[str, str]], data: dict[str, Any]) -> None:
    """Push to every device of a user. `copy` maps locale → `{title, body}`."""
    run_async(lambda container: _deliver(container, user_id, copy, data))
