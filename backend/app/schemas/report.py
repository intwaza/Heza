from pydantic import BaseModel

from app.schemas.adherence import AdherenceCheckInOut
from app.schemas.appointment import AppointmentOut
from app.schemas.patient import PatientOut


class FacilityReportOut(BaseModel):
    facility_id: int
    total_patients: int
    total_appointments: int
    attended_count: int
    missed_count: int
    attendance_rate: float 


class PatientHistoryOut(BaseModel):
    patient: PatientOut
    appointments: list[AppointmentOut]
    check_ins: list[AdherenceCheckInOut]
