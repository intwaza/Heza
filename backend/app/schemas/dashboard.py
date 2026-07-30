from app.schemas.appointment import AppointmentOut
from pydantic import BaseModel


class DashboardOut(BaseModel):
    upcoming: list[AppointmentOut]
    attended: list[AppointmentOut]
    missed: list[AppointmentOut]
