"""The list query is backed by a real keyset index."""

from collections.abc import AsyncIterator

import pytest
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncEngine, create_async_engine

from app.core.config import Settings


@pytest.fixture
async def engine(settings: Settings) -> AsyncIterator[AsyncEngine]:
    engine = create_async_engine(str(settings.database_url))
    yield engine
    await engine.dispose()


async def _index_defs(engine: AsyncEngine, table: str) -> dict[str, str]:
    async with engine.connect() as conn:
        rows = await conn.execute(
            text(
                "select indexname, indexdef from pg_indexes "
                "where schemaname = 'public' and tablename = :table"
            ),
            {"table": table},
        )
        return dict(rows.all())


async def test_todos_has_a_keyset_index(engine: AsyncEngine) -> None:
    definition = (await _index_defs(engine, "todos"))["ix_todos_owner_created_at_id"]

    assert definition.endswith("(owner_id, created_at DESC, id DESC)")


async def test_single_column_owner_index_is_replaced(engine: AsyncEngine) -> None:
    # The keyset index starts with owner_id, so it serves the foreign-key lookups too.
    assert "ix_todos_owner_id" not in await _index_defs(engine, "todos")
