import asyncio
from logging.config import fileConfig

from alembic import context
from sqlalchemy import pool
from sqlalchemy.engine import Connection
from sqlalchemy.ext.asyncio import create_async_engine

import app.modules  # noqa: F401  -- registers every module's models on Base.metadata
from app.core.config import get_settings
from app.core.database import Base

config = context.config
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

target_metadata = Base.metadata
database_url = str(get_settings().database_url)

# A migration waiting on a busy table must fail fast instead of queueing every query behind
# its lock (an outage). Retry the deploy, or split the change, rather than raising these.
SAFETY_SETTINGS = ("SET lock_timeout = '5s'", "SET statement_timeout = '5min'")


def _run_with_safety_settings() -> None:
    with context.begin_transaction():
        for statement in SAFETY_SETTINGS:
            context.execute(statement)
        context.run_migrations()


def run_migrations_offline() -> None:
    context.configure(
        url=database_url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
        compare_type=True,
    )
    _run_with_safety_settings()


def do_run_migrations(connection: Connection) -> None:
    context.configure(connection=connection, target_metadata=target_metadata, compare_type=True)
    _run_with_safety_settings()


async def run_async_migrations() -> None:
    engine = create_async_engine(database_url, poolclass=pool.NullPool)
    async with engine.connect() as connection:
        await connection.run_sync(do_run_migrations)
    await engine.dispose()


if context.is_offline_mode():
    run_migrations_offline()
else:
    asyncio.run(run_async_migrations())
