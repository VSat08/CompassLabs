from pydantic import BaseModel, EmailStr
from datetime import datetime
from uuid import UUID
from app.models.enums import UserPlan

# ── Request Schemas (what frontend sends to us) ──────────────────


class SignUpRequest(BaseModel):
    name: str
    email: EmailStr
    password: str


class SignInRequest(BaseModel):
    email: EmailStr
    password: str


# ── Response Schemas (what we send back to frontend) ─────────────


class UserResponse(BaseModel):
    id: UUID
    name: str
    email: EmailStr
    plan: UserPlan
    is_verified: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class AuthResponse(BaseModel):
    user: UserResponse
    message: str
