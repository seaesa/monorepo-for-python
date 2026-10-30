"""Async runtime for Celery tasks.

A Celery worker is not a FastAPI app: there is no request scope and no loop of its own,
while everything below the task (engine, Redis, SMTP) is async. Each task builds a fresh
container, so every async resource is created on the loop that uses it and closed before
that loop ends — an engine pooled across `asyncio.run` calls would be bound to a dead loop.
"""

import asyncio
from collections.abc import Awaitable, Callable
from concurrent.futures import ThreadPoolExecutor

from dishka import AsyncContainer, make_async_container

from app.core.config import Settings, get_settings
from app.core.ioc import InfrastructureProvider
from app.core.security import TokenEncoder
from app.modules import MODULE_PROVIDERS


def create_worker_container() -> AsyncContainer:
    """The API's providers without the FastAPI ones (no request scope, no realtime server)."""
    settings = get_settings()
    return make_async_container(
        InfrastructureProvider(),
        *(provider() for provider in MODULE_PROVIDERS),
        context={Settings: settings, TokenEncoder: TokenEncoder(settings)},
    )


async def with_container[T](work: Callable[[AsyncContainer], Awaitable[T]]) -> T:
    container = create_worker_container()
    try:
        return await work(container)
    finally:
        await container.close()


def run_async[T](work: Callable[[AsyncContainer], Awaitable[T]]) -> T:
    """Run container work to completion from a synchronous Celery task.

    `task_always_eager` (tests) calls the task from inside a running loop, where
    `asyncio.run` is illegal, so the work finishes on a short-lived thread instead.
    """

    def run() -> T:
        return asyncio.run(with_container(work))

    try:
        asyncio.get_running_loop()
    except RuntimeError:
        return run()
    with ThreadPoolExecutor(max_workers=1) as pool:
        return pool.submit(run).result()
