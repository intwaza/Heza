from typing import Annotated

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.deps import CurrentWorker
from app.database import get_db
from app.schemas.patient import PatientCreate, PatientOut, PatientUpdate
from app.schemas.report import PatientHistoryOut
from app.services import patient_service, report_service

router = APIRouter(prefix="/patients", tags=["patients"])


@router.post("", response_model=PatientOut, status_code=status.HTTP_201_CREATED)
def register_patient(
    payload: PatientCreate,
    worker: CurrentWorker,
    db: Annotated[Session, Depends(get_db)],
) -> PatientOut:
    return patient_service.register_patient(db, payload, worker)


@router.get("", response_model=list[PatientOut])
def list_patients(worker: CurrentWorker, db: Annotated[Session, Depends(get_db)]) -> list[PatientOut]:
    return patient_service.list_patients(db, worker)


@router.get("/{patient_id}", response_model=PatientOut)
def get_patient(patient_id: int, worker: CurrentWorker, db: Annotated[Session, Depends(get_db)]) -> PatientOut:
    return patient_service.get_patient(db, patient_id, worker)


@router.patch("/{patient_id}", response_model=PatientOut)
def update_patient(
    patient_id: int,
    payload: PatientUpdate,
    worker: CurrentWorker,
    db: Annotated[Session, Depends(get_db)],
) -> PatientOut:
    return patient_service.update_patient(db, patient_id, payload, worker)


@router.post("/{patient_id}/deactivate", response_model=PatientOut)
def deactivate_patient(
    patient_id: int, worker: CurrentWorker, db: Annotated[Session, Depends(get_db)]
) -> PatientOut:
    return patient_service.deactivate_patient(db, patient_id, worker)


@router.get("/{patient_id}/history", response_model=PatientHistoryOut)
def patient_history(
    patient_id: int, worker: CurrentWorker, db: Annotated[Session, Depends(get_db)]
) -> PatientHistoryOut:
    return report_service.patient_history(db, patient_id, worker)
