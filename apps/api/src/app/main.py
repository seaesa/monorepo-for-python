from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

import socketio
from dishka.integrations.fastapi import setup_dishka
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import Settings, get_settings
from app.core.exceptions import ERROR_RESPONSES, register_exception_handlers
from app.core.ioc import create_container
from app.core.logging import configure_logging
from app.core.openapi import generate_operation_id, include_realtime_events
from app.core.realtime import SOCKETIO_PATH, create_socket_server
from app.core.security import TokenEncoder
from app.modules import MODULE_ROUTERS, REALTIME_EVENTS


def create_app(settings: Settings | None = None) -> FastAPI:
    settings = settings or get_settings()
    configure_logging(settings)

    tokens = TokenEncoder(settings)
    socket_server = create_socket_server(settings, tokens)

    @asynccontextmanager
    async def lifespan(app: FastAPI) -> AsyncIterator[None]:
        yield
        await app.state.dishka_container.close()

    app = FastAPI(
        title=settings.app_name,
        version="0.1.0",
        lifespan=lifespan,
        generate_unique_id_function=generate_operation_id,
        docs_url="/docs" if not settings.is_production else None,
        redoc_url=None,
    )
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    register_exception_handlers(app)
    for router in MODULE_ROUTERS:
        app.include_router(router, prefix=settings.api_prefix, responses=ERROR_RESPONSES)

    # Socket.IO on the same origin/port: ws(s)://<api>/ws/socket.io
    app.mount("/ws", socketio.ASGIApp(socket_server, socketio_path=SOCKETIO_PATH))
    include_realtime_events(app, REALTIME_EVENTS)

    setup_dishka(create_container(settings, tokens, socket_server), app)
    return app


app = create_app()
