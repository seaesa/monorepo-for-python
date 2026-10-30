import os

# Selects `.env.test` (see `app.core.config`); must run before any app import.
os.environ["ENVIRONMENT"] = "test"

from collections.abc import AsyncIterator

import asyncpg
import pytest
from asgi_lifespan import LifespanManager
from dishka import AsyncContainer
from fastapi import FastAPI
from httpx import ASGITransport, AsyncClient
from redis.asyncio import Redis
from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine

import app.modules  # noqa: F401
from app.core.config import Settings, get_settings
from app.core.database import Base
from app.core.mail import EmailSender, OutboxEmailSender
from app.core.push import OutboxPushSender, PushSender
from app.main import create_app
from tests.helpers import register_verified


async def _ensure_database(settings: Settings) -> None:
    url = settings.database_url
    dsn = str(url).replace("+asyncpg", "").rsplit("/", 1)[0] + "/postgres"
    name = url.path.lstrip("/") if url.path else "app_test"
    conn = await asyncpg.connect(dsn)
    try:
        if not await conn.fetchval("select 1 from pg_database where datname = $1", name):
            await conn.execute(f'create database "{name}"')
    finally:
        await conn.close()


@pytest.fixture(scope="session")
def settings() -> Settings:
    return get_settings()


@pytest.fixture(scope="session", autouse=True)
async def _schema(settings: Settings) -> AsyncIterator[None]:
    await _ensure_database(settings)
    engine = create_async_engine(str(settings.database_url))
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)
    yield
    await engine.dispose()


@pytest.fixture(autouse=True)
async def _clean_tables(settings: Settings) -> AsyncIterator[None]:
    yield
    OutboxEmailSender().clear()
    OutboxPushSender().clear()
    redis = Redis.from_url(str(settings.redis_url), decode_responses=True)
    try:
        await redis.flushdb()
    finally:
        await redis.aclose()
    engine = create_async_engine(str(settings.database_url))
    async with engine.begin() as conn:
        tables = ", ".join(t.name for t in Base.metadata.sorted_tables)
        await conn.execute(text(f"truncate {tables} cascade"))
    await engine.dispose()


@pytest.fixture
async def api_app(settings: Settings) -> AsyncIterator[FastAPI]:
    app = create_app(settings)
    async with LifespanManager(app):
        yield app


@pytest.fixture
def container(api_app: FastAPI) -> AsyncContainer:
    return api_app.state.dishka_container  # type: ignore[no-any-return]


@pytest.fixture
async def outbox(container: AsyncContainer) -> OutboxEmailSender:
    sender = await container.get(EmailSender)
    assert isinstance(sender, OutboxEmailSender)
    return sender


@pytest.fixture
async def push_outbox(container: AsyncContainer) -> OutboxPushSender:
    sender = await container.get(PushSender)
    assert isinstance(sender, OutboxPushSender)
    return sender


@pytest.fixture
async def client(api_app: FastAPI) -> AsyncIterator[AsyncClient]:
    transport = ASGITransport(app=api_app)
    async with AsyncClient(transport=transport, base_url="http://test/api/v1") as ac:
        yield ac


@pytest.fixture
async def auth_client(client: AsyncClient, outbox: OutboxEmailSender) -> AsyncClient:
    """A registered **and verified** user: business endpoints require a confirmed address."""
    tokens = await register_verified(client, outbox, "jane@example.com", full_name="Jane")
    client.headers["Authorization"] = f"Bearer {tokens['accessToken']}"
    return client
