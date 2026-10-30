import asyncio
import socket
from collections.abc import AsyncIterator

import pytest
import socketio
import uvicorn
from httpx import AsyncClient

from app.core.config import Settings
from app.core.realtime import SOCKETIO_PATH
from app.main import create_app


def _free_port() -> int:
    with socket.socket() as s:
        s.bind(("127.0.0.1", 0))
        port: int = s.getsockname()[1]
        return port


@pytest.fixture
async def live_url(settings: Settings) -> AsyncIterator[str]:
    """Real HTTP + WebSocket server (Socket.IO cannot run over the in-memory ASGI transport)."""
    port = _free_port()
    server = uvicorn.Server(
        uvicorn.Config(create_app(settings), host="127.0.0.1", port=port, log_level="warning")
    )
    task = asyncio.create_task(server.serve())
    while not server.started:  # noqa: ASYNC110 -- uvicorn exposes a flag, not an event
        await asyncio.sleep(0.02)
    yield f"http://127.0.0.1:{port}"
    server.should_exit = True
    await task


async def _register(http: AsyncClient, email: str) -> str:
    response = await http.post(
        "/api/v1/auth/register",
        json={"email": email, "fullName": "Live", "password": "secret123"},
    )
    token: str = response.json()["accessToken"]
    return token


async def test_todo_events_reach_all_owner_devices_only(live_url: str) -> None:
    async with AsyncClient(base_url=live_url) as http:
        owner = await _register(http, "owner@example.com")
        stranger = await _register(http, "stranger@example.com")

        async with (
            socketio.AsyncSimpleClient() as phone,
            socketio.AsyncSimpleClient() as laptop,
            socketio.AsyncSimpleClient() as other,
        ):
            for client, token in ((phone, owner), (laptop, owner), (other, stranger)):
                await client.connect(
                    live_url,
                    socketio_path=SOCKETIO_PATH,
                    auth={"token": token},
                    transports=["websocket"],
                )

            response = await http.post(
                "/api/v1/todos",
                json={"title": "Realtime"},
                headers={"Authorization": f"Bearer {owner}"},
            )
            assert response.status_code == 201

            for device in (phone, laptop):
                name, payload = await device.receive(timeout=5)
                assert name == "todo.changed"
                assert payload["action"] == "created"
                assert payload["todo"]["title"] == "Realtime"  # camelCase payload, like HTTP

            with pytest.raises(socketio.exceptions.TimeoutError):
                await other.receive(timeout=0.5)


async def test_connection_requires_valid_token(live_url: str) -> None:
    client = socketio.AsyncSimpleClient()
    with pytest.raises(socketio.exceptions.ConnectionError):
        await client.connect(
            live_url,
            socketio_path=SOCKETIO_PATH,
            auth={"token": "invalid"},
            transports=["websocket"],
        )
