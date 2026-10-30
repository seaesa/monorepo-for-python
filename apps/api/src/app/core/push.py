"""Push notifications behind one interface, so the environment picks the transport.

`console` logs (local), `expo` sends through the Expo Push API (works for both APNs and FCM
without holding their credentials here), `outbox` keeps messages in memory for tests.
Every sender returns the tokens the provider rejected as dead, so the caller can forget them.
"""

from collections.abc import Sequence
from dataclasses import dataclass, field
from typing import Any, ClassVar, Protocol

import httpx
import structlog

from app.core.config import Settings

logger = structlog.get_logger(__name__)

EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send"
# Expo accepts at most 100 messages per request.
EXPO_BATCH_SIZE = 100


@dataclass(frozen=True, slots=True)
class PushMessage:
    to: str
    title: str
    body: str
    data: dict[str, Any] = field(default_factory=dict)


class PushSender(Protocol):
    async def send(self, messages: Sequence[PushMessage]) -> list[str]: ...


class ConsolePushSender:
    async def send(self, messages: Sequence[PushMessage]) -> list[str]:
        for message in messages:
            logger.info("push_console", to=message.to, title=message.title, body=message.body)
        return []


class OutboxPushSender:
    """In-memory, shared per process (see `OutboxEmailSender`). Tokens listed in
    `dead_tokens` are reported back as rejected, to exercise the cleanup path."""

    _sent: ClassVar[list[PushMessage]] = []
    dead_tokens: ClassVar[set[str]] = set()

    @property
    def messages(self) -> list[PushMessage]:
        return self._sent

    async def send(self, messages: Sequence[PushMessage]) -> list[str]:
        self._sent.extend(messages)
        return [m.to for m in messages if m.to in self.dead_tokens]

    def clear(self) -> None:
        self._sent.clear()
        self.dead_tokens.clear()


class ExpoPushSender:
    def __init__(self, settings: Settings) -> None:
        self._headers = {"Accept": "application/json"}
        if settings.expo_access_token:
            self._headers["Authorization"] = f"Bearer {settings.expo_access_token}"

    async def send(self, messages: Sequence[PushMessage]) -> list[str]:
        dead: list[str] = []
        async with httpx.AsyncClient(timeout=10, headers=self._headers) as client:
            for start in range(0, len(messages), EXPO_BATCH_SIZE):
                batch = messages[start : start + EXPO_BATCH_SIZE]
                response = await client.post(
                    EXPO_PUSH_URL,
                    json=[
                        {"to": m.to, "title": m.title, "body": m.body, "data": m.data}
                        for m in batch
                    ],
                )
                response.raise_for_status()
                # Tickets come back in request order.
                for message, ticket in zip(batch, response.json()["data"], strict=True):
                    if ticket.get("status") == "ok":
                        continue
                    error = ticket.get("details", {}).get("error")
                    if error == "DeviceNotRegistered":
                        dead.append(message.to)
                    else:
                        logger.warning("push_rejected", error=error, message=ticket.get("message"))
        return dead


def create_push_sender(settings: Settings) -> PushSender:
    match settings.push_backend:
        case "expo":
            return ExpoPushSender(settings)
        case "outbox":
            return OutboxPushSender()
        case "console":
            return ConsolePushSender()
