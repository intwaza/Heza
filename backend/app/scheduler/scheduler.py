import logging

from apscheduler.schedulers.background import BackgroundScheduler

from app.config import get_settings
from app.database import SessionLocal
from app.scheduler.jobs import (
    close_stale_adherence_checkins,
    flag_missed_appointments,
    run_weekly_adherence_checkins,
    send_appointment_reminders,
)
from app.sms.factory import get_sms_gateway

logger = logging.getLogger("heza.scheduler")
settings = get_settings()

_scheduler = BackgroundScheduler(timezone="UTC")


def _with_session(job_fn, *, needs_gateway: bool) -> None:
    db = SessionLocal()
    try:
        if needs_gateway:
            job_fn(db, get_sms_gateway())
        else:
            job_fn(db)
    except Exception:
        logger.exception("Scheduled job %s failed", job_fn.__name__)
    finally:
        db.close()


def start_scheduler() -> BackgroundScheduler:
    # Reminders and the missed-appointment sweep both depend on wall-clock
    # thresholds, so hourly (the default) is frequent enough to stay within
    # the reminder windows without hammering the SMS gateway. Intervals are
    # configurable so a local test run can shrink them instead of waiting.
    _scheduler.add_job(
        lambda: _with_session(send_appointment_reminders, needs_gateway=True),
        "interval",
        seconds=settings.reminder_sweep_interval_seconds,
        id="send_appointment_reminders",
        replace_existing=True,
    )
    _scheduler.add_job(
        lambda: _with_session(flag_missed_appointments, needs_gateway=False),
        "interval",
        seconds=settings.missed_sweep_interval_seconds,
        id="flag_missed_appointments",
        replace_existing=True,
    )
    # send_weekly_checkins already skips patients checked in the last 7
    # days, so running this daily (the default) is enough to catch everyone
    # on schedule.
    _scheduler.add_job(
        lambda: _with_session(run_weekly_adherence_checkins, needs_gateway=True),
        "interval",
        seconds=settings.adherence_checkin_interval_seconds,
        id="run_weekly_adherence_checkins",
        replace_existing=True,
    )
    _scheduler.add_job(
        lambda: _with_session(close_stale_adherence_checkins, needs_gateway=False),
        "interval",
        seconds=settings.adherence_closeout_interval_seconds,
        id="close_stale_adherence_checkins",
        replace_existing=True,
    )

    _scheduler.start()
    logger.info("Scheduler started with %d jobs", len(_scheduler.get_jobs()))
    return _scheduler


def stop_scheduler() -> None:
    if _scheduler.running:
        _scheduler.shutdown(wait=False)
