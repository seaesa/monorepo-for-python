"""Concurrency and constraint failures must surface as 409s, never as 500s."""

import asyncio
from typing import Any

from httpx import AsyncClient
from sqlalchemy import text
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import create_async_engine

from app.core.config import Settings
from app.modules.users.repository import UserRepository
from app.modules.users.service import UserService

REGISTER = {"email": "race@example.com", "fullName": "Race", "password": "secret123"}


async def _insert_user_row(settings: Settings, email: str) -> None:
    """Commit a user behind the service's back, like a competing request would."""
    engine = create_async_engine(str(settings.database_url))
    try:
        async with engine.begin() as conn:
            await conn.execute(
                text(
                    "insert into users (id, email, full_name, hashed_password, is_active) "
                    "values (gen_random_uuid(), :email, 'Race', 'x', true)"
                ),
                {"email": email},
            )
    finally:
        await engine.dispose()


async def test_insert_collision_returns_conflict(
    client: AsyncClient, settings: Settings, monkeypatch: Any
) -> None:
    await _insert_user_row(settings, REGISTER["email"])

    async def _not_there_yet(self: UserRepository, email: str) -> None:
        return None

    # The row landed after the existence check: the insert is what fails.
    monkeypatch.setattr(UserRepository, "get_by_email", _not_there_yet)

    response = await client.post("/auth/register", json=REGISTER)

    assert response.status_code == 409
    body = response.json()
    assert body["code"] == "email_taken"
    assert body["details"][0]["field"] == "email"


async def test_concurrent_registrations_never_fail_with_500(client: AsyncClient) -> None:
    first, second = await asyncio.gather(
        client.post("/auth/register", json=REGISTER),
        client.post("/auth/register", json=REGISTER),
    )

    assert sorted([first.status_code, second.status_code]) == [201, 409]
    conflict = first if first.status_code == 409 else second
    assert conflict.json()["code"] == "email_taken"


async def test_unmapped_integrity_error_returns_conflict(
    client: AsyncClient, monkeypatch: Any
) -> None:
    async def _boom(self: UserService, data: Any) -> None:
        raise IntegrityError("insert into users", {}, Exception("duplicate key"))

    monkeypatch.setattr(UserService, "create", _boom)

    response = await client.post("/auth/register", json=REGISTER)

    assert response.status_code == 409
    assert response.json()["code"] == "conflict"
