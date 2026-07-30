from datetime import datetime

from pydantic import BaseModel, Field, field_validator

from app.models.enums import Condition, Gender, Language, PatientStatus, RecurrenceDays


class PatientCreate(BaseModel):
    full_name: str = Field(min_length=2, max_length=150)
    age: int = Field(ge=0, le=120)
    gender: Gender
    phone: str = Field(min_length=8, max_length=20)
    condition: Condition
    language: Language = Language.en
    recurrence_days: int = RecurrenceDays.monthly.value
    first_appointment_date: datetime

    @field_validator("phone")
    @classmethod
    def phone_must_look_rwandan(cls, value: str) -> str:
        digits = value.replace(" ", "").replace("-", "")
        if not digits.lstrip("+").isdigit():
            raise ValueError("Phone number must contain digits only (e.g. +250788123456).")
        return digits

    @field_validator("recurrence_days")
    @classmethod
    def recurrence_must_be_allowed(cls, value: int) -> int:
        if value not in (RecurrenceDays.monthly.value, RecurrenceDays.quarterly.value):
            raise ValueError("recurrence_days must be 30 or 90.")
        return value


class PatientUpdate(BaseModel):
    phone: str | None = Field(default=None, min_length=8, max_length=20)
    condition: Condition | None = None
    language: Language | None = None


class PatientOut(BaseModel):
    id: int
    facility_id: int
    full_name: str
    age: int
    gender: Gender
    phone: str
    condition: Condition
    language: Language
    status: PatientStatus
    created_at: datetime

    model_config = {"from_attributes": True}
