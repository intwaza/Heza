from pydantic import BaseModel

from app.models.enums import Language, WorkerRole


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in_minutes: int


class CurrentWorkerOut(BaseModel):
    id: int
    full_name: str
    username: str
    role: WorkerRole
    facility_id: int
    preferred_language: Language

    model_config = {"from_attributes": True}


class PasswordResetRequest(BaseModel):
    username: str


class PasswordResetToken(BaseModel):
    reset_token: str
    expires_in_minutes: int


class PasswordResetConfirm(BaseModel):
    token: str
    new_password: str
