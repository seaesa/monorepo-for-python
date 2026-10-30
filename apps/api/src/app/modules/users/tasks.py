import structlog

from app.worker import celery_app

logger = structlog.get_logger(__name__)


@celery_app.task
def send_welcome_email(user_id: str) -> None:
    # Plug an email provider in here (Resend, SES, ...).
    logger.info("welcome_email_sent", user_id=user_id)
