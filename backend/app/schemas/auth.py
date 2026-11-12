from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, EmailStr, Field

from app.models.enums import UserRole


# -----------------------------
# User Registration
# -----------------------------

class UserRegister(BaseModel):
    email: EmailStr

    password: str = Field(
        min_length=8,
        max_length=128,
    )

    role: Literal["candidate", "recruiter"] = "candidate"


# -----------------------------
# User Login
# -----------------------------

class UserLogin(BaseModel):
    email: EmailStr

    password: str = Field(
        min_length=8,
        max_length=128,
    )


# -----------------------------
# Public User Response
# -----------------------------

class UserPublic(BaseModel):
    id: UUID
    email: EmailStr
    role: UserRole
    is_active: bool
    is_verified: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# -----------------------------
# JWT Token Response
# -----------------------------

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


# -----------------------------
# Authentication Response
# -----------------------------

class AuthResponse(BaseModel):
    user: UserPublic
    token: Token