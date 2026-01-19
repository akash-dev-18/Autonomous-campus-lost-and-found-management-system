from celery import Celery
from app.config import settings

# Create Celery app
celery_app = Celery(
    "lost_found_worker",
    broker=settings.CELERY_BROKER_URL,
    backend=settings.CELERY_RESULT_BACKEND,
    include=[
        "app.workers.email_tasks",
        "app.workers.matching_tasks",
    ]
)

# Celery configuration
celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
    task_time_limit=30 * 60,  # 30 minutes
    task_soft_time_limit=25 * 60,  # 25 minutes
    worker_prefetch_multiplier=1,
    worker_max_tasks_per_child=1000,
)

# Celery Beat schedule for periodic tasks
celery_app.conf.beat_schedule = {
    "cleanup-expired-items": {
        "task": "app.workers.matching_tasks.cleanup_expired_items",
        "schedule": settings.CLEANUP_SCHEDULE_HOURS * 3600,  # Run every N hours
    },
    "run-matching-algorithm": {
        "task": "app.workers.matching_tasks.run_matching_for_all_items",
        "schedule": 3600,  # Run every hour
    },
}
