from datetime import datetime, timedelta, timezone

from sqlalchemy.orm import Session

from app.config import get_settings
from app.core.errors import AppError
from app.core.security import (
    create_access_token,
    generate_reset_token,
    hash_password,
    verify_password,
)
from app.models import HealthWorker, PasswordResetToken

settings = get_settings()

_BAD_CREDENTIALS = AppError(
    en="Incorrect username or password.",
    rw="Izina cyangwa ijambo ry'ibanga sibyo.",
    status_code=401,
)


def login(db: Session, username: str, password: str) -> tuple[str, int]:
    worker = db.query(HealthWorker).filter(HealthWorker.username == username).first()
    if worker is None or not worker.is_active or not verify_password(password, worker.hashed_password):
        raise _BAD_CREDENTIALS

    token = create_access_token(worker.id, worker.facility_id, worker.role.value)
    return token, settings.access_token_expire_minutes


def initiate_password_reset(db: Session, target_worker_id: int) -> tuple[str, int]:
    """Only a facility_admin/system_admin can do this - there's no
    self-service reset. Returns the raw token so the admin can pass it to
    the worker some other way (call, SMS, whatever the facility already uses)."""
    worker = db.get(HealthWorker, target_worker_id)
    if worker is None:
        raise AppError(en="Health worker not found.", rw="Umukozi w'ubuzima ntabonetse.", status_code=404)

    token = generate_reset_token()
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=settings.password_reset_token_expire_minutes)
    db.add(PasswordResetToken(health_worker_id=worker.id, token=token, expires_at=expires_at))
    db.commit()
    return token, settings.password_reset_token_expire_minutes


def confirm_password_reset(db: Session, token: str, new_password: str) -> None:
    reset_row = db.query(PasswordResetToken).filter(PasswordResetToken.token == token).first()

    invalid_token_error = AppError(
        en="This reset link is invalid or has expired.",
        rw="Uyu murongo wo guhindura ijambo ry'ibanga ntukiri mu bikorwa cyangwa warengeje igihe.",
        status_code=400,
    )

    if reset_row is None or reset_row.used:
        raise invalid_token_error
    if reset_row.expires_at < datetime.now(timezone.utc):
        raise invalid_token_error

    worker = db.get(HealthWorker, reset_row.health_worker_id)
    worker.hashed_password = hash_password(new_password)
    reset_row.used = True
    db.commit()
