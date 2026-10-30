import os
import sys

from celery import Celery

from app.core.config import get_settings

# On platforms where billiard starts pool processes with `spawn` (macOS on Python 3.12+,
# Windows) the child never inherits the parent's tracer registry, so every task dies with
# `ValueError: not enough values to unpack (expected 3, got 0)` in `fast_trace_task`.
# This flag makes the child rebuild its own optimizations instead of relying on fork.
if sys.platform == "darwin" or os.name == "nt":
    os.environ.setdefault("FORKED_BY_MULTIPROCESSING", "1")

settings = get_settings()

celery_app = Celery(
    "app",
    broker=settings.celery_broker_url,
    backend=settings.celery_result_backend,
)
celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_acks_late=True,
    worker_prefetch_multiplier=1,
    task_always_eager=settings.environment == "test",
)
celery_app.autodiscover_tasks(["app.modules.users", "app.modules.notifications"])
