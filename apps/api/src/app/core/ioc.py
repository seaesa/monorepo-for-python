from collections.abc import AsyncIterator

import socketio
from dishka import AsyncContainer, Provider, Scope, from_context, make_async_container, provide
from dishka.integrations.fastapi import FastapiProvider
from redis.asyncio import Redis
from sqlalchemy.ext.asyncio import AsyncEngine, AsyncSession, async_sessionmaker

from app.core.config import Settings
from app.core.database import create_engine, create_session_factory
from app.core.realtime import RealtimePublisher
from app.core.security import TokenEncoder
from app.modules import MODULE_PROVIDERS


class InfrastructureProvider(Provider):
    # Created in create_app (the Socket.IO server needs them before the container exists).
    settings = from_context(provides=Settings, scope=Scope.APP)
    tokens = from_context(provides=TokenEncoder, scope=Scope.APP)
    socket_server = from_context(provides=socketio.AsyncServer, scope=Scope.APP)

    @provide(scope=Scope.APP)
    async def engine(self, settings: Settings) -> AsyncIterator[AsyncEngine]:
        engine = create_engine(settings)
        yield engine
        await engine.dispose()

    @provide(scope=Scope.APP)
    def session_factory(self, engine: AsyncEngine) -> async_sessionmaker[AsyncSession]:
        return create_session_factory(engine)

    @provide(scope=Scope.REQUEST)
    async def session(
        self, factory: async_sessionmaker[AsyncSession]
    ) -> AsyncIterator[AsyncSession]:
        async with factory() as session:
            yield session

    @provide(scope=Scope.APP)
    async def redis(self, settings: Settings) -> AsyncIterator[Redis]:
        client = Redis.from_url(str(settings.redis_url), decode_responses=True)
        yield client
        await client.aclose()

    realtime = provide(RealtimePublisher, scope=Scope.APP)


def create_container(
    settings: Settings, tokens: TokenEncoder, socket_server: socketio.AsyncServer
) -> AsyncContainer:
    return make_async_container(
        InfrastructureProvider(),
        *(provider() for provider in MODULE_PROVIDERS),
        FastapiProvider(),
        context={Settings: settings, TokenEncoder: tokens, socketio.AsyncServer: socket_server},
    )
