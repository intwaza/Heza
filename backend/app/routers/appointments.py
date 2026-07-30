from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.deps import CurrentWorker
from app.database import get_db
from app.schemas.appointment import AppointmentOut, FollowUpNoteIn
from app.services import appointment_service

router = APIRouter(prefix="/appointments", tags=["appointments"])


@router.post("/{appointment_id}/attend", response_model=AppointmentOut)
def mark_attended(
    appointment_id: int, worker: CurrentWorker, db: Annotated[Session, Depends(get_db)]
) -> AppointmentOut:
    return appointment_service.mark_attended(db, appointment_id, worker)


@router.post("/{appointment_id}/follow-up", response_model=AppointmentOut)
def add_follow_up_note(
    appointment_id: int,
    payload: FollowUpNoteIn,
    worker: CurrentWorker,
    db: Annotated[Session, Depends(get_db)],
) -> AppointmentOut:
    return appointment_service.add_follow_up_note(db, appointment_id, payload.note, worker)
