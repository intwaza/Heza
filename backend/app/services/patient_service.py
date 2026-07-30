from sqlalchemy.orm import Session

from app.core.audit import record as audit_record
from app.core.errors import AppError, not_found
from app.models import Appointment, HealthWorker, Patient
from app.models.enums import PatientStatus
from app.schemas.patient import PatientCreate, PatientUpdate


def _scoped_query(db: Session, worker: HealthWorker):
    query = db.query(Patient)
    if worker.role.value != "system_admin":
        query = query.filter(Patient.facility_id == worker.facility_id)
    return query


def get_patient(db: Session, patient_id: int, worker: HealthWorker) -> Patient:
    patient = _scoped_query(db, worker).filter(Patient.id == patient_id).first()
    if patient is None:
        raise not_found("Patient", "Umurwayi")
    return patient


def list_patients(db: Session, worker: HealthWorker) -> list[Patient]:
    return _scoped_query(db, worker).order_by(Patient.full_name).all()


def register_patient(db: Session, data: PatientCreate, worker: HealthWorker) -> Patient:
    patient = Patient(
        facility_id=worker.facility_id,
        created_by_id=worker.id,
        full_name=data.full_name,
        age=data.age,
        gender=data.gender,
        phone=data.phone,
        condition=data.condition,
        language=data.language,
        status=PatientStatus.active,
    )
    db.add(patient)
    db.flush()  # need patient.id before creating the appointment

    first_appointment = Appointment(
        patient_id=patient.id,
        scheduled_date=data.first_appointment_date,
        recurrence_days=data.recurrence_days,
    )
    db.add(first_appointment)

    audit_record(
        db,
        entity_type="patient",
        entity_id=patient.id,
        action="register",
        changed_by_id=worker.id,
        after={"full_name": patient.full_name, "condition": patient.condition.value},
    )

    db.commit()
    db.refresh(patient)
    return patient


def update_patient(db: Session, patient_id: int, data: PatientUpdate, worker: HealthWorker) -> Patient:
    patient = get_patient(db, patient_id, worker)
    before = {"phone": patient.phone, "condition": patient.condition.value, "language": patient.language.value}

    if data.phone is not None:
        patient.phone = data.phone
    if data.condition is not None:
        patient.condition = data.condition
    if data.language is not None:
        patient.language = data.language

    audit_record(
        db,
        entity_type="patient",
        entity_id=patient.id,
        action="update",
        changed_by_id=worker.id,
        before=before,
        after={"phone": patient.phone, "condition": patient.condition.value, "language": patient.language.value},
    )

    db.commit()
    db.refresh(patient)
    return patient


def deactivate_patient(db: Session, patient_id: int, worker: HealthWorker) -> Patient:
    patient = get_patient(db, patient_id, worker)
    if patient.status == PatientStatus.deactivated:
        raise AppError(
            en="This patient is already deactivated.",
            rw="Uyu murwayi asanzwe ahagaritswe.",
            status_code=400,
        )

    patient.status = PatientStatus.deactivated
    audit_record(
        db,
        entity_type="patient",
        entity_id=patient.id,
        action="deactivate",
        changed_by_id=worker.id,
    )
    db.commit()
    db.refresh(patient)
    return patient
