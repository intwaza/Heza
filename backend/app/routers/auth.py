from typing import Annotated

from fastapi import APIRouter, Depends, Response, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.core.deps import CurrentWorker, require_roles
from app.database import get_db
from app.models import HealthWorker
from app.models.enums import WorkerRole
from app.schemas.auth import (
    CurrentWorkerOut,
    PasswordResetConfirm,
    PasswordResetToken,
    TokenResponse,
)
from app.services import auth_service

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/login", response_model=TokenResponse)
def login(
    form_data: Annotated[OAuth2PasswordRequestForm, Depends()],
    db: Annotated[Session, Depends(get_db)],
) -> TokenResponse:
    token, expires_in = auth_service.login(db, form_data.username, form_data.password)
    return TokenResponse(access_token=token, expires_in_minutes=expires_in)


@router.get("/me", response_model=CurrentWorkerOut)
def read_current_worker(worker: CurrentWorker) -> CurrentWorkerOut:
    return worker


@router.post("/password-reset/confirm", status_code=status.HTTP_204_NO_CONTENT)
def confirm_password_reset(
    payload: PasswordResetConfirm,
    db: Annotated[Session, Depends(get_db)],
) -> Response:
    auth_service.confirm_password_reset(db, payload.token, payload.new_password)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


# Registered after /password-reset/confirm on purpose: FastAPI matches
# routes in declaration order, and this {worker_id} path would otherwise
# swallow "confirm" as if it were a worker id.
@router.post("/password-reset/{worker_id}", response_model=PasswordResetToken)
def initiate_password_reset(
    worker_id: int,
    db: Annotated[Session, Depends(get_db)],
    _: Annotated[HealthWorker, Depends(require_roles(WorkerRole.facility_admin))],
) -> PasswordResetToken:
    token, expires_in = auth_service.initiate_password_reset(db, worker_id)
    return PasswordResetToken(reset_token=token, expires_in_minutes=expires_in)
