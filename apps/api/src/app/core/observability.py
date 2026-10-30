"""Optional Sentry error reporting.

Reporting is off unless `SENTRY_DSN` is set, so local runs, tests and self-hosted
deployments never depend on a third party. A malformed DSN logs a warning and leaves the
API running: losing error reporting must not take the service down at boot.
"""

import sentry_sdk
import structlog

from app.core.config import Settings

logger = structlog.get_logger(__name__)


def init_error_reporting(settings: Settings) -> bool:
    """Enable Sentry when a DSN is configured. Returns whether reporting is on."""
    if not settings.sentry_dsn:
        return False

    try:
        sentry_sdk.init(
            dsn=settings.sentry_dsn,
            environment=settings.environment,
            release=settings.app_name,
            traces_sample_rate=settings.sentry_traces_sample_rate,
            # Personal data never leaves the service implicitly; attach ids explicitly.
            send_default_pii=False,
        )
    except Exception as exc:  # a bad DSN must not stop the API
        logger.warning("sentry.init_failed", error=str(exc))
        return False

    logger.info("sentry.enabled", environment=settings.environment)
    return True
