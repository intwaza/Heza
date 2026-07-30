from datetime import datetime, timedelta, timezone

from sqlalchemy.orm import Session

from app.core.errors import AppError
from app.models import AdherenceCheckIn, Patient
from app.models.enums import CheckInResponse, CheckInStatus, PatientStatus
from app.sms.gateway import SmsGateway
from app.sms.templates import adherence_checkin as render_checkin

WEEKLY_INTERVAL = timedelta(days=7)
RESPONSE_WINDOW = timedelta(hours=48)
ALERT_THRESHOLD = 3


def record_response(db: Session, from_phone: str, text: str) -> AdherenceCheckIn:
    """A patient replied Y or N to their weekly check-in, via the inbound
    SMS webhook."""
    patient = (
        db.query(Patient)
        .filter(Patient.phone == from_phone, Patient.status == PatientStatus.active)
        .first()
    )
    if patient is None:
        raise AppError(en="Unknown sender phone number.", rw="Nimero itazwi.", status_code=404)

    pending = (
        db.query(AdherenceCheckIn)
        .filter(AdherenceCheckIn.patient_id == patient.id, AdherenceCheckIn.status == CheckInStatus.sent)
        .order_by(AdherenceCheckIn.sent_date.desc())
        .first()
    )
    if pending is None:
        raise AppError(
            en="No pending check-in to respond to.",
            rw="Nta gikorwa cyo kwemeza gitegereje.",
            status_code=404,
        )

    reply = text.strip().upper()[:1]
    if reply not in ("Y", "N"):
        raise AppError(
            en="Please reply Y for yes or N for no.",
            rw="Nyamuneka subiza Y niba ari yego cyangwa N niba ari oya.",
            status_code=400,
        )

    pending.response = CheckInResponse(reply)
    pending.response_date = datetime.now(timezone.utc)
    pending.status = CheckInStatus.confirmed if reply == "Y" else CheckInStatus.not_confirmed
    pending.consecutive_missed = 0  # any reply, Y or N, breaks a non-response streak

    db.commit()
    db.refresh(pending)
    return pending


def _latest_checkin_for(db: Session, patient_id: int) -> AdherenceCheckIn | None:
    return (
        db.query(AdherenceCheckIn)
        .filter(AdherenceCheckIn.patient_id == patient_id)
        .order_by(AdherenceCheckIn.sent_date.desc())
        .first()
    )


def send_weekly_checkins(db: Session, gateway: SmsGateway) -> list[AdherenceCheckIn]:
    """Sends a check-in to every active patient who hasn't had one in the
    last 7 days. If a message can't go out right now (quiet hours) the
    patient just gets picked up on the next run instead of skipped."""
    now = datetime.now(timezone.utc)
    cutoff = now - WEEKLY_INTERVAL
    sent: list[AdherenceCheckIn] = []

    patients = db.query(Patient).filter(Patient.status == PatientStatus.active).all()
    for patient in patients:
        last = _latest_checkin_for(db, patient.id)
        if last is not None and last.sent_date > cutoff:
            continue

        message = render_checkin(patient.full_name, patient.language)
        result = gateway.send(patient.phone, message)
        if not result.sent:
            continue

        carried_streak = last.consecutive_missed if last else 0
        checkin = AdherenceCheckIn(
            patient_id=patient.id,
            sent_date=now,
            status=CheckInStatus.sent,
            consecutive_missed=carried_streak,
        )
        db.add(checkin)
        sent.append(checkin)

    db.commit()
    return sent


def close_overdue_checkins(db: Session) -> list[AdherenceCheckIn]:
    """Any check-in still "sent" 48h after going out gets closed as a
    non-response, and the streak triggers a worker alert at 3 in a row."""
    now = datetime.now(timezone.utc)
    overdue_cutoff = now - RESPONSE_WINDOW

    overdue = (
        db.query(AdherenceCheckIn)
        .filter(AdherenceCheckIn.status == CheckInStatus.sent, AdherenceCheckIn.sent_date < overdue_cutoff)
        .all()
    )

    for checkin in overdue:
        checkin.status = CheckInStatus.no_response
        checkin.consecutive_missed += 1
        if checkin.consecutive_missed >= ALERT_THRESHOLD:
            checkin.worker_notified = True

    db.commit()
    return overdue
