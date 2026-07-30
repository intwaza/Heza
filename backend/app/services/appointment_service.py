from datetime import datetime, timedelta, timezone

from sqlalchemy.orm import Session, joinedload

from app.core.audit import record as audit_record
from app.core.errors import AppError, not_found
from app.models import Appointment, HealthWorker, Patient
from app.models.enums import AppointmentStatus, PatientStatus


def _scoped_appointment_query(db: Session, worker: HealthWorker):
    query = db.query(Appointment).join(Patient)
    if worker.role.value != "system_admin":
        query = query.filter(Patient.facility_id == worker.facility_id)
    return query


def get_appointment(db: Session, appointment_id: int, worker: HealthWorker) -> Appointment:
    appointment = _scoped_appointment_query(db, worker).filter(Appointment.id == appointment_id).first()
    if appointment is None:
        raise not_found("Appointment", "Igihe cyo kwa muganga")
    return appointment


def mark_attended(db: Session, appointment_id: int, worker: HealthWorker) -> Appointment:
    appointment = get_appointment(db, appointment_id, worker)
    if appointment.status not in (AppointmentStatus.upcoming, AppointmentStatus.missed):
        raise AppError(
            en=f"This appointment is already marked as {appointment.status.value}.",
            rw="Iyi gahunda isanzwe yanditswe nk'iyarangiye.",
            status_code=400,
        )

    now = datetime.now(timezone.utc)
    appointment.status = AppointmentStatus.attended
    appointment.attended_date = now

    # attending resets the cycle - schedule the next one recurrence_days out
    next_appointment = Appointment(
        patient_id=appointment.patient_id,
        scheduled_date=now + timedelta(days=appointment.recurrence_days),
        recurrence_days=appointment.recurrence_days,
    )
    db.add(next_appointment)

    audit_record(
        db,
        entity_type="appointment",
        entity_id=appointment.id,
        action="mark_attended",
        changed_by_id=worker.id,
        after={"attended_date": now.isoformat()},
    )

    db.commit()
    db.refresh(appointment)
    return appointment


def add_follow_up_note(db: Session, appointment_id: int, note: str, worker: HealthWorker) -> Appointment:
    appointment = get_appointment(db, appointment_id, worker)
    if appointment.status != AppointmentStatus.missed:
        raise AppError(
            en="Follow-up notes can only be added to missed appointments.",
            rw="Inyandiko zo gukurikirana zishobora kongerwaho gusa ku gahunda zitagenzuwe.",
            status_code=400,
        )

    appointment.follow_up_note = note
    appointment.status = AppointmentStatus.followed_up

    audit_record(
        db,
        entity_type="appointment",
        entity_id=appointment.id,
        action="follow_up_note",
        changed_by_id=worker.id,
        after={"note": note},
    )

    db.commit()
    db.refresh(appointment)
    return appointment


def get_dashboard(db: Session, worker: HealthWorker) -> dict[str, list[Appointment]]:
    """Appointments grouped into the three dashboard buckets, scoped to the
    worker's facility and limited to active patients."""
    base = (
        _scoped_appointment_query(db, worker)
        .options(joinedload(Appointment.patient))
        .filter(Patient.status == PatientStatus.active)
    )

    return {
        "upcoming": base.filter(Appointment.status == AppointmentStatus.upcoming)
        .order_by(Appointment.scheduled_date)
        .all(),
        "attended": base.filter(Appointment.status == AppointmentStatus.attended)
        .order_by(Appointment.attended_date.desc())
        .all(),
        "missed": base.filter(
            Appointment.status.in_([AppointmentStatus.missed, AppointmentStatus.followed_up])
        )
        .order_by(Appointment.scheduled_date)
        .all(),
    }
