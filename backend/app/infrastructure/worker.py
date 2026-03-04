from __future__ import annotations

import os
from celery import Celery
from celery.signals import setup_logging
from kombu import Queue

# ---------------------------------------------------------------------------
# Broker / backend URLs
# ---------------------------------------------------------------------------
REDIS_URL         = os.getenv("REDIS_URL",    "redis://localhost:6379/0")
RESULT_BACKEND    = os.getenv("RESULT_BACKEND", REDIS_URL)

# ---------------------------------------------------------------------------
# Celery application
# ---------------------------------------------------------------------------
celery_app = Celery(
    "pitchperfect",
    broker=REDIS_URL,
    backend=RESULT_BACKEND,
    include=[
        "app.core.tasks.reporting",
    ],
)

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------
celery_app.conf.update(
    # Serialisation
    task_serializer          = "json",
    result_serializer        = "json",
    accept_content           = ["json"],
    timezone                 = "UTC",
    enable_utc               = True,

    # Result TTL – keep task results for 24 h then purge
    result_expires           = 86_400,

    # Reliability
    task_acks_late           = True,    # ACK only after the task completes
    task_reject_on_worker_lost = True,  # Re-queue if a worker crashes mid-task
    worker_prefetch_multiplier = 1,     # One task at a time per worker process

    # Retry defaults (overridden per-task as needed)
    task_max_retries         = 5,

    # Dedicated queues
    task_queues = (
        Queue("default",   routing_key="default"),
        Queue("reporting", routing_key="reporting"),  # heavy PDF jobs
        Queue("ai",        routing_key="ai"),         # Gemini / Whisper tasks
    ),
    task_default_queue       = "default",
    task_default_routing_key = "default",

    # Route specific tasks to dedicated queues
    task_routes = {
        "app.core.tasks.reporting.generate_interview_report": {
            "queue": "reporting",
            "routing_key": "reporting",
        },
    },

    # Beat schedule (optional periodic tasks)
    beat_schedule = {},

    # Logging handled by the app's JSON logger (suppress Celery's default)
    worker_hijack_root_logger = False,
    worker_log_format         = "",
    worker_task_log_format    = "",
)

# ---------------------------------------------------------------------------
# Suppress Celery's default logging setup – use app's JSON formatter instead
# ---------------------------------------------------------------------------
@setup_logging.connect
def configure_worker_logging(**kwargs):
    from app.infrastructure.logging import configure_logging
    configure_logging(os.getenv("LOG_LEVEL", "INFO"))


# ---------------------------------------------------------------------------
# Shared retry policy factory
# Produces exponential back-off: 2^attempt seconds, capped at 600 s (10 min)
# ---------------------------------------------------------------------------
def exponential_retry_policy(
    max_retries: int = 5,
    base_delay:  int = 2,
    max_delay:   int = 600,
) -> dict:
    return {
        "max_retries": max_retries,
        "default_retry_delay": base_delay,
        "retry_backoff": True,
        "retry_backoff_max": max_delay,
        "retry_jitter": True,
    }
