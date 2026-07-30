from datetime import datetime

from sqlalchemy import DateTime, Enum, ForeignKey, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base
from app.models.enums import Condition, Gender, Language, PatientStatus


class Patient(Base):
    __tablename__ = "patients"

    id: Mapped[int] = mapped_column(primary_key=True)
    facility_id: Mapped[int] = mapped_column(ForeignKey("facilities.id"), nullable=False)
    created_by_id: Mapped[int] = mapped_column(ForeignKey("health_workers.id"), nullable=False)

    full_name: Mapped[str] = mapped_column(String(150), nullable=False)
    age: Mapped[int] = mapped_column(Integer, nullable=False)
    gender: Mapped[Gender] = mapped_column(Enum(Gender), nullable=False)
    phone: Mapped[str] = mapped_column(String(20), nullable=False)
    condition: Mapped[Condition] = mapped_column(Enum(Condition), nullable=False)
    language: Mapped[Language] = mapped_column(Enum(Language), nullable=False, default=Language.en)
    status: Mapped[PatientStatus] = mapped_column(
        Enum(PatientStatus), nullable=False, default=PatientStatus.active
    )

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    facility: Mapped["Facility"] = relationship(back_populates="patients")
    appointments: Mapped[list["Appointment"]] = relationship(
        back_populates="patient", order_by="Appointment.scheduled_date"
    )
    check_ins: Mapped[list["AdherenceCheckIn"]] = relationship(
        back_populates="patient", order_by="AdherenceCheckIn.sent_date"
    )
