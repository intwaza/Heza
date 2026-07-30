from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.deps import CurrentWorker
from app.database import get_db
from app.schemas.adherence import AdherenceCheckInOut, SmsWebhookIn
from app.schemas.sms_log import SmsLogEntry
from app.services import adherence_service
from app.sms.factory import get_sms_gateway

router = APIRouter(prefix="/sms", tags=["sms"])


@router.post("/webhook", response_model=AdherenceCheckInOut)
def receive_sms(payload: SmsWebhookIn, db: Annotated[Session, Depends(get_db)]) -> AdherenceCheckInOut:
    """Endpoint the SMS gateway (Africa's Talking/Beem Africa) calls when a
    patient replies to a check-in. In production this would sit behind the
    gateway's IP allowlist or a shared-secret header - left open here since
    there's no real gateway account to configure that with yet."""
    return adherence_service.record_response(db, payload.from_, payload.text)


@router.get("/log", response_model=list[SmsLogEntry])
def sms_log(worker: CurrentWorker) -> list[dict]:
    """Demo/proof helper: every message the (currently mock) SMS provider
    has sent since the backend started, most recent first. Lets anyone
    testing the app see reminders/check-ins actually firing without needing
    a real phone or server log access."""
    return get_sms_gateway().message_log()
