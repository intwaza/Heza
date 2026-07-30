from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models import AdherenceCheckIn, Appointment, HealthWorker, Patient
from app.models.enums import AppointmentStatus


def facility_report(db: Session, facility_id: int) -> dict:
    """Attendance/missed rates for a whole facility."""
    total_patients = db.query(func.count(Patient.id)).filter(Patient.facility_id == facility_id).scalar()

    counts = (
        db.query(Appointment.status, func.count(Appointment.id))
        .join(Patient)
        .filter(Patient.facility_id == facility_id)
        .group_by(Appointment.status)
        .all()
    )
    counts_by_status = dict(counts)

    attended = counts_by_status.get(AppointmentStatus.attended, 0)
    missed = counts_by_status.get(AppointmentStatus.missed, 0) + counts_by_status.get(
        AppointmentStatus.followed_up, 0
    )
    total_appointments = sum(counts_by_status.values())

    resolved = attended + missed
    attendance_rate = round(attended / resolved, 4) if resolved else 0.0

    return {
        "facility_id": facility_id,
        "total_patients": total_patients,
        "total_appointments": total_appointments,
        "attended_count": attended,
        "missed_count": missed,
        "attendance_rate": attendance_rate,
    }


def patient_history(db: Session, patient_id: int, worker: HealthWorker) -> dict:
    """Full appointment + adherence history for one patient."""
    from app.services.patient_service import get_patient  # avoid a circular import at module load

    patient = get_patient(db, patient_id, worker)

    appointments = (
        db.query(Appointment)
        .filter(Appointment.patient_id == patient.id)
        .order_by(Appointment.scheduled_date)
        .all()
    )
    check_ins = (
        db.query(AdherenceCheckIn)
        .filter(AdherenceCheckIn.patient_id == patient.id)
        .order_by(AdherenceCheckIn.sent_date)
        .all()
    )

    return {"patient": patient, "appointments": appointments, "check_ins": check_ins}
