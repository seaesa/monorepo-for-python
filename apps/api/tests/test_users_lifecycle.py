"""Account lifecycle: verification state, token version and case-insensitive email uniqueness."""

from collections.abc import AsyncIterator

import pytest
from httpx import AsyncClient
from sqlalchemy import text
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine

from app.core.config import Settings
from app.core.database import create_session_factory
from app.modules.users.repository import UserRepository
from app.modules.users.schemas import UserCreate
from app.modules.users.service import UserService


@pytest.fixture
async def session(settings: Settings) -> AsyncIterator[AsyncSession]:
    engine = create_async_engine(str(settings.database_url))
    factory = create_session_factory(engine)
    async with factory() as session:
        yield session
    await engine.dispose()


@pytest.fixture
def users(session: AsyncSession) -> UserService:
    return UserService(session, UserRepository(session))


async def _insert_raw(session: AsyncSession, email: str) -> None:
    await session.execute(
        text(
            "insert into users (id, email, full_name, hashed_password, is_active, token_version)"
            " values (gen_random_uuid(), :email, 'Raw', 'hash', true, 0)"
        ),
        {"email": email},
    )
    await session.commit()


async def test_new_user_is_not_verified(client: AsyncClient) -> None:
    registered = await client.post(
        "/auth/register",
        json={"email": "new@example.com", "fullName": "New", "password": "secret123"},
    )

    me = await client.get(
        "/users/me", headers={"Authorization": f"Bearer {registered.json()['accessToken']}"}
    )

    assert me.json()["emailVerified"] is False


async def test_mark_verified_records_a_timestamp(users: UserService, session: AsyncSession) -> None:
    user = await users.create(
        UserCreate(email="verify@example.com", full_name="Verify", password="secret123")
    )
    assert user.email_verified_at is None

    await users.mark_verified(user)
    await session.refresh(user)

    assert user.email_verified_at is not None


async def test_delete_removes_the_user(users: UserService) -> None:
    user = await users.create(
        UserCreate(email="gone@example.com", full_name="Gone", password="secret123")
    )

    await users.delete(user)

    assert await users.get(user.id) is None


async def test_email_uniqueness_ignores_case(session: AsyncSession) -> None:
    await _insert_raw(session, "Case@Example.com")

    with pytest.raises(IntegrityError):
        await _insert_raw(session, "case@example.com")
