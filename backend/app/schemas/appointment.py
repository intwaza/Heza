from datetime import datetime

from pydantic import BaseModel, Field

from app.models.enums import AppointmentStatus


class AppointmentOut(BaseModel):
    id: int
    patient_id: int
    scheduled_date: datetime
    recurrence_days: int
    status: AppointmentStatus
    attended_date: datetime | None
    follow_up_note: str | None

    model_config = {"from_attributes": True}


class FollowUpNoteIn(BaseModel):
    note: str = Field(min_length=1, max_length=1000)
