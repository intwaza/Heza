from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.deps import require_roles
from app.database import get_db
from app.models import HealthWorker
from app.models.enums import WorkerRole
from app.schemas.report import FacilityReportOut
from app.services import report_service

router = APIRouter(prefix="/reports", tags=["reports"])


@router.get("/facility", response_model=FacilityReportOut)
def facility_report(
    worker: Annotated[HealthWorker, Depends(require_roles(WorkerRole.facility_admin))],
    db: Annotated[Session, Depends(get_db)],
    facility_id: int | None = None,
) -> FacilityReportOut:
    target_facility_id = facility_id or worker.facility_id
    if worker.role != WorkerRole.system_admin and target_facility_id != worker.facility_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You can only report on your own facility.")

    return report_service.facility_report(db, target_facility_id)
