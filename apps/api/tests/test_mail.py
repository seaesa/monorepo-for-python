"""Transactional email goes through a pluggable sender, so dev, tests and prod differ by config."""

from dishka import AsyncContainer

from app.core.config import Settings
from app.core.mail import (
    ConsoleEmailSender,
    EmailMessage,
    EmailSender,
    OutboxEmailSender,
    SmtpEmailSender,
    create_email_sender,
)

MESSAGE = EmailMessage(to="jane@example.com", subject="Verify your email", text="click here")


async def test_outbox_collects_messages() -> None:
    sender = OutboxEmailSender()

    await sender.send(MESSAGE)

    assert sender.messages == [MESSAGE]
    sender.clear()
    assert sender.messages == []


async def test_console_sender_accepts_a_message() -> None:
    await ConsoleEmailSender().send(MESSAGE)


async def test_container_shares_one_outbox(container: AsyncContainer) -> None:
    assert await container.get(EmailSender) is await container.get(EmailSender)


def test_create_email_sender_returns_console() -> None:
    assert isinstance(create_email_sender(Settings(email_backend="console")), ConsoleEmailSender)


def test_create_email_sender_returns_smtp() -> None:
    settings = Settings(email_backend="smtp", smtp_host="localhost", smtp_port=1025)

    assert isinstance(create_email_sender(settings), SmtpEmailSender)


def test_create_email_sender_returns_outbox() -> None:
    assert isinstance(create_email_sender(Settings(email_backend="outbox")), OutboxEmailSender)
