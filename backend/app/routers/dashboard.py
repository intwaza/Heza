from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.deps import CurrentWorker
from app.database import get_db
from app.schemas.dashboard import DashboardOut
from app.services import appointment_service

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("", response_model=DashboardOut)
def get_dashboard(worker: CurrentWorker, db: Annotated[Session, Depends(get_db)]) -> DashboardOut:
    return appointment_service.get_dashboard(db, worker)
