from typing import Annotated

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from app.core.security import decode_access_token
from app.database import get_db
from app.models import HealthWorker
from app.models.enums import WorkerRole

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")


def get_current_worker(
    token: Annotated[str, Depends(oauth2_scheme)],
    db: Annotated[Session, Depends(get_db)],
) -> HealthWorker:
    credentials_error = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials, please log in again.",
        headers={"WWW-Authenticate": "Bearer"},
    )

    payload = decode_access_token(token)
    if payload is None:
        raise credentials_error

    worker = db.get(HealthWorker, int(payload["sub"]))
    if worker is None or not worker.is_active:
        raise credentials_error

    return worker


CurrentWorker = Annotated[HealthWorker, Depends(get_current_worker)]


def require_roles(*allowed_roles: WorkerRole):
    """Use as `Depends(require_roles(WorkerRole.facility_admin))` to restrict
    a route to the given roles. system_admin always gets through."""

    def _check(worker: CurrentWorker) -> HealthWorker:
        if worker.role == WorkerRole.system_admin or worker.role in allowed_roles:
            return worker
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to do this.",
        )

    return _check


def facility_scope(worker: HealthWorker) -> int | None:
    """facility_id to filter a query by, or None if the worker can see
    every facility (system_admin)."""
    if worker.role == WorkerRole.system_admin:
        return None
    return worker.facility_id
