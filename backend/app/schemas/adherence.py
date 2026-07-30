from datetime import datetime

from pydantic import BaseModel, Field

from app.models.enums import CheckInResponse, CheckInStatus


class AdherenceCheckInOut(BaseModel):
    id: int
    patient_id: int
    sent_date: datetime
    status: CheckInStatus
    response: CheckInResponse | None
    response_date: datetime | None
    consecutive_missed: int

    model_config = {"from_attributes": True}


class SmsWebhookIn(BaseModel):
    """Shape of the inbound webhook payload the SMS gateway calls when a
    patient replies. Field names mirror Africa's Talking's incoming-message
    webhook (`from`, `text`) closely enough to be a realistic stand-in."""

    from_: str = Field(alias="from")
    text: str

    model_config = {"populate_by_name": True}
