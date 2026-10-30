"""Celery tasks. Tasks stay thin: they run container work through `run_async`."""

import aiosmtplib
import structlog
from dishka import AsyncContainer

from app.core.mail import EmailMessage, EmailSender
from app.core.worker_container import run_async
from app.worker import celery_app

logger = structlog.get_logger(__name__)


async def _deliver(container: AsyncContainer, message: EmailMessage) -> None:
    sender = await container.get(EmailSender)
    await sender.send(message)


@celery_app.task(
    autoretry_for=(OSError, aiosmtplib.SMTPException), retry_backoff=True, max_retries=5
)
def send_email(to: str, subject: str, text: str, html: str | None = None) -> None:
    """Deliver one transactional email; the transport comes from `EMAIL_BACKEND`."""
    message = EmailMessage(to=to, subject=subject, text=text, html=html)
    run_async(lambda container: _deliver(container, message))
    logger.info("email_sent", to=to, subject=subject)
