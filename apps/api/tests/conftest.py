import os

os.environ["ENVIRONMENT"] = "test"
os.environ.setdefault(
    "DATABASE_URL", "postgresql+asyncpg://postgres:postgres@localhost:5432/app_test"
)
os.environ.setdefault("REDIS_URL", "redis://localhost:6379/15")

from collections.abc import AsyncIterator

import asyncpg
import pytest
from asgi_lifespan import LifespanManager
from httpx import ASGITransport, AsyncClient
from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine

import app.modules  # noqa: F401
from app.core.config import Settings, get_settings
from app.core.database import Base
from app.main import create_app


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
    engine = create_async_engine(str(settings.database_url))
    async with engine.begin() as conn:
        tables = ", ".join(t.name for t in Base.metadata.sorted_tables)
        await conn.execute(text(f"truncate {tables} cascade"))
    await engine.dispose()


@pytest.fixture
async def client(settings: Settings) -> AsyncIterator[AsyncClient]:
    app = create_app(settings)
    async with LifespanManager(app):
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test/api/v1") as ac:
            yield ac


@pytest.fixture
async def auth_client(client: AsyncClient) -> AsyncClient:
    response = await client.post(
        "/auth/register",
        json={"email": "jane@example.com", "fullName": "Jane", "password": "secret123"},
    )
    client.headers["Authorization"] = f"Bearer {response.json()['accessToken']}"
    return client
