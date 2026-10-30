"""Realtime: Socket.IO server + Redis pub/sub.

- Clients connect to `/ws/socket.io` with `auth: { token: <access token> }`; each socket joins
  the room `user:<id>`, so an event reaches every device of that user.
- The Redis client manager fans emits out to all API instances.
- Payloads are `Event` schemas; they are added to OpenAPI (`RealtimeEvents`) so the frontend
  gets typed events from codegen.
"""

import uuid
from typing import Any, ClassVar

import socketio

from app.core.config import Settings
from app.core.security import TokenEncoder
from app.shared.schemas import Schema

SOCKETIO_PATH = "/ws/socket.io"


class Event(Schema):
    """Base for realtime payloads. Subclasses set `event_name` ("<module>.<what>")."""

    event_name: ClassVar[str]


class RealtimePublisher:
    """Injected into services to push events to a user's connected devices."""

    def __init__(self, server: socketio.AsyncServer) -> None:
        self._server = server

    async def to_user(self, user_id: uuid.UUID, event: Event) -> None:
        await self._server.emit(
            event.event_name,
            event.model_dump(mode="json", by_alias=True),
            room=f"user:{user_id}",
        )


class AppNamespace(socketio.AsyncNamespace):
    def __init__(self, tokens: TokenEncoder) -> None:
        super().__init__("/")
        self._tokens = tokens

    async def on_connect(self, sid: str, environ: dict[str, Any], auth: Any = None) -> None:
        token = auth.get("token") if isinstance(auth, dict) else None
        payload = self._tokens.decode(token, "access") if token else None
        if payload is None:
            # Read by the client to refresh the token and reconnect.
            raise socketio.exceptions.ConnectionRefusedError("unauthorized")
        await self.enter_room(sid, f"user:{payload['sub']}")


def create_socket_server(settings: Settings, tokens: TokenEncoder) -> socketio.AsyncServer:
    server = socketio.AsyncServer(
        async_mode="asgi",
        client_manager=socketio.AsyncRedisManager(str(settings.redis_url)),
        cors_allowed_origins=settings.cors_origins,
    )
    server.register_namespace(AppNamespace(tokens))
    return server
