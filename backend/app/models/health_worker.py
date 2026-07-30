from sqlalchemy import Boolean, Enum, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base
from app.models.enums import Language, WorkerRole


class HealthWorker(Base):
    __tablename__ = "health_workers"

    id: Mapped[int] = mapped_column(primary_key=True)
    facility_id: Mapped[int] = mapped_column(ForeignKey("facilities.id"), nullable=False)

    full_name: Mapped[str] = mapped_column(String(150), nullable=False)
    username: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)

    role: Mapped[WorkerRole] = mapped_column(Enum(WorkerRole), nullable=False, default=WorkerRole.nurse)
    preferred_language: Mapped[Language] = mapped_column(Enum(Language), nullable=False, default=Language.en)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)

    facility: Mapped["Facility"] = relationship(back_populates="health_workers")
