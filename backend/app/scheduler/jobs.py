import logging
from datetime import datetime, timedelta, timezone

from sqlalchemy.orm import Session, joinedload

from app.core.audit import record as audit_record
from app.models import Appointment, Patient
from app.models.enums import AppointmentStatus, PatientStatus
from app.services.adherence_service import close_overdue_checkins, send_weekly_checkins
from app.sms.gateway import SmsGateway
from app.sms.templates import reminder_24h, reminder_48h

logger = logging.getLogger("heza.scheduler")

REMINDER_48H_WINDOW = timedelta(hours=48)
REMINDER_24H_WINDOW = timedelta(hours=24)
MISSED_GRACE_PERIOD = timedelta(hours=24)


def send_appointment_reminders(db: Session, gateway: SmsGateway) -> None:
    """Sends the 48h and 24h reminder for every upcoming appointment that's
    crossed the threshold and hasn't had that reminder yet."""
    now = datetime.now(timezone.utc)

    candidates = (
        db.query(Appointment)
        .join(Patient)
        .options(joinedload(Appointment.patient))
        .filter(
            Appointment.status == AppointmentStatus.upcoming,
            Patient.status == PatientStatus.active,
            Appointment.scheduled_date > now,
        )
        .all()
    )

    for appointment in candidates:
        patient = appointment.patient
        time_until = appointment.scheduled_date - now
        date_str = appointment.scheduled_date.strftime("%d %b, %H:%M")

        if not appointment.reminder_48h_sent and time_until <= REMINDER_48H_WINDOW:
            message = reminder_48h(patient.full_name, date_str, patient.language)
            if gateway.send(patient.phone, message).sent:
                appointment.reminder_48h_sent = True

        if not appointment.reminder_24h_sent and time_until <= REMINDER_24H_WINDOW:
            message = reminder_24h(patient.full_name, date_str, patient.language)
            if gateway.send(patient.phone, message).sent:
                appointment.reminder_24h_sent = True

    db.commit()


def flag_missed_appointments(db: Session) -> list[Appointment]:
    """Any upcoming appointment more than 24h past its scheduled time
    without being marked attended becomes 'missed'. The dashboard's missed
    list is what actually shows this to the health worker - no separate
    notification table."""
    now = datetime.now(timezone.utc)
    cutoff = now - MISSED_GRACE_PERIOD

    overdue = (
        db.query(Appointment)
        .filter(Appointment.status == AppointmentStatus.upcoming, Appointment.scheduled_date < cutoff)
        .all()
    )

    for appointment in overdue:
        appointment.status = AppointmentStatus.missed
        audit_record(
            db,
            entity_type="appointment",
            entity_id=appointment.id,
            action="auto_flag_missed",
            changed_by_id=None,
        )
        logger.info("Appointment %s flagged as missed", appointment.id)

    db.commit()
    return overdue


def run_weekly_adherence_checkins(db: Session, gateway: SmsGateway) -> None:
    sent = send_weekly_checkins(db, gateway)
    logger.info("Sent %d adherence check-ins", len(sent))


def close_stale_adherence_checkins(db: Session) -> None:
    overdue = close_overdue_checkins(db)
    alerts = [c for c in overdue if c.worker_notified]
    if alerts:
        logger.warning("%d patients hit 3+ consecutive non-responses", len(alerts))
