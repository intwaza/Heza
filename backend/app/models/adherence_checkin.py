from datetime import datetime

from sqlalchemy import Boolean, DateTime, Enum, ForeignKey, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base
from app.models.enums import CheckInResponse, CheckInStatus


class AdherenceCheckIn(Base):
    """One row per weekly SMS check-in sent to a patient. `status` goes
    sent -> confirmed/not_confirmed once the patient replies, or
    sent -> no_response if nothing comes back within 48h."""

    __tablename__ = "adherence_checkins"

    id: Mapped[int] = mapped_column(primary_key=True)
    patient_id: Mapped[int] = mapped_column(ForeignKey("patients.id"), nullable=False)

    sent_date: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    status: Mapped[CheckInStatus] = mapped_column(
        Enum(CheckInStatus), nullable=False, default=CheckInStatus.sent
    )
    response: Mapped[CheckInResponse | None] = mapped_column(Enum(CheckInResponse), nullable=True)
    response_date: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    # Running count of consecutive no-response check-ins as of this row,
    # carried forward from the previous check-in. Reset to 0 on any reply.
    consecutive_missed: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    worker_notified: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)

    patient: Mapped["Patient"] = relationship(back_populates="check_ins")
