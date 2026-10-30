from collections.abc import AsyncIterator

import pytest
from asgi_lifespan import LifespanManager
from httpx import ASGITransport, AsyncClient

from app.core.config import Settings
from app.main import create_app


@pytest.fixture
async def strict_client(settings: Settings) -> AsyncIterator[AsyncClient]:
    app = create_app(settings.model_copy(update={"min_app_version": "2.1.0"}))
    async with LifespanManager(app):
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test/api/v1") as client:
            yield client


async def test_outdated_app_must_update(strict_client: AsyncClient) -> None:
    response = await strict_client.get("/health", headers={"X-App-Version": "2.0.9"})

    assert response.status_code == 426
    assert response.json()["code"] == "app_update_required"


@pytest.mark.parametrize("version", ["2.1.0", "2.10.0", "3.0.0"])
async def test_supported_app_versions_pass(strict_client: AsyncClient, version: str) -> None:
    response = await strict_client.get("/health", headers={"X-App-Version": version})

    assert response.status_code == 200


async def test_clients_without_a_version_are_never_blocked(strict_client: AsyncClient) -> None:
    assert (await strict_client.get("/health")).status_code == 200
