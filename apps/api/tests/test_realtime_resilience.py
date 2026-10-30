"""A broken realtime transport must never turn a committed write into a 500."""

import uuid

import pytest
import socketio
from fastapi import FastAPI
from httpx import AsyncClient

from app.core.realtime import RealtimePublisher
from app.modules.todos.events import TodoChanged


class ExplodingServer:
    async def emit(self, *args: object, **kwargs: object) -> None:
        raise RuntimeError("redis is down")


async def test_publish_failure_is_swallowed_and_logged() -> None:
    publisher = RealtimePublisher(ExplodingServer())  # type: ignore[arg-type]

    await publisher.to_user(uuid.uuid4(), TodoChanged(action="deleted", id=uuid.uuid4()))


async def test_creating_a_todo_survives_a_broken_publisher(
    api_app: FastAPI, auth_client: AsyncClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    server = await api_app.state.dishka_container.get(socketio.AsyncServer)

    async def explode(*args: object, **kwargs: object) -> None:
        raise RuntimeError("redis is down")

    monkeypatch.setattr(server, "emit", explode)

    response = await auth_client.post("/todos", json={"title": "still saved"})

    assert response.status_code == 201
