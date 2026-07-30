from datetime import datetime

from sqlalchemy import Boolean, DateTime, Enum, ForeignKey, Integer, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base
from app.models.enums import AppointmentStatus, RecurrenceDays


class Appointment(Base):
    __tablename__ = "appointments"

    id: Mapped[int] = mapped_column(primary_key=True)
    patient_id: Mapped[int] = mapped_column(ForeignKey("patients.id"), nullable=False)

    scheduled_date: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    recurrence_days: Mapped[int] = mapped_column(Integer, nullable=False, default=RecurrenceDays.monthly.value)
    status: Mapped[AppointmentStatus] = mapped_column(
        Enum(AppointmentStatus), nullable=False, default=AppointmentStatus.upcoming
    )

    attended_date: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    follow_up_note: Mapped[str | None] = mapped_column(Text, nullable=True)

    reminder_48h_sent: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    reminder_24h_sent: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)

    patient: Mapped["Patient"] = relationship(back_populates="appointments")
