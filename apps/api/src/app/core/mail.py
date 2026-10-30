"""Transactional email behind one interface, so the environment picks the transport.

`console` prints (local), `smtp` sends through a real server (Mailpit in dev,
your provider in production), `outbox` keeps messages in memory so tests can
assert on what a user would have received.
"""

from dataclasses import dataclass
from email.message import EmailMessage as MimeMessage
from typing import ClassVar, Protocol

import aiosmtplib
import structlog

from app.core.config import Settings

logger = structlog.get_logger(__name__)


@dataclass(frozen=True, slots=True)
class EmailMessage:
    to: str
    subject: str
    text: str
    html: str | None = None


class EmailSender(Protocol):
    async def send(self, message: EmailMessage) -> None: ...


class ConsoleEmailSender:
    """Writes the email to the log instead of sending it."""

    async def send(self, message: EmailMessage) -> None:
        logger.info("email_console", to=message.to, subject=message.subject, text=message.text)


class OutboxEmailSender:
    """Keeps every email in memory; tests read `messages` and call `clear()`.

    The inbox is shared by every instance in the process: under `task_always_eager` the
    Celery task builds its own container, and its outbox must be the one tests read.
    """

    _inbox: ClassVar[list[EmailMessage]] = []

    @property
    def messages(self) -> list[EmailMessage]:
        return self._inbox

    async def send(self, message: EmailMessage) -> None:
        self._inbox.append(message)

    def clear(self) -> None:
        self._inbox.clear()


class SmtpEmailSender:
    def __init__(self, settings: Settings) -> None:
        self._settings = settings

    async def send(self, message: EmailMessage) -> None:
        mime = MimeMessage()
        mime["From"] = self._settings.email_from
        mime["To"] = message.to
        mime["Subject"] = message.subject
        mime.set_content(message.text)
        if message.html is not None:
            mime.add_alternative(message.html, subtype="html")
        await aiosmtplib.send(
            mime,
            hostname=self._settings.smtp_host,
            port=self._settings.smtp_port,
            username=self._settings.smtp_username,
            password=self._settings.smtp_password,
            start_tls=self._settings.smtp_start_tls,
        )


def create_email_sender(settings: Settings) -> EmailSender:
    match settings.email_backend:
        case "smtp":
            return SmtpEmailSender(settings)
        case "outbox":
            return OutboxEmailSender()
        case "console":
            return ConsoleEmailSender()
