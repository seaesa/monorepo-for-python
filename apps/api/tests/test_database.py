"""Pool and session settings are applied to the engine, not just stored."""

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncEngine

from app.core.config import Settings
from app.core.database import create_engine


async def test_statement_timeout_reaches_postgres(settings: Settings) -> None:
    engine = create_engine(settings)

    async with engine.connect() as conn:
        value = await conn.scalar(
            text("select setting from pg_settings where name = 'statement_timeout'")
        )

    await engine.dispose()
    assert value == str(settings.database_statement_timeout_ms)


def test_pool_limits_come_from_settings(settings: Settings) -> None:
    engine: AsyncEngine = create_engine(settings)

    assert engine.pool.size() == settings.database_pool_size
    assert engine.pool._max_overflow == settings.database_max_overflow  # type: ignore[attr-defined]
