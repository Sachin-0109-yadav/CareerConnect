
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


# =====================================
# Candidate Profile Schemas
# =====================================

class CandidateProfileUpdate(BaseModel):
    full_name: str | None = Field(default=None, max_length=150)
    headline: str | None = Field(default=None, max_length=200)
    phone: str | None = Field(default=None, max_length=20)
    location: str | None = Field(default=None, max_length=150)
    bio: str | None = None
    linkedin_url: str | None = Field(default=None, max_length=500)
    github_url: str | None = Field(default=None, max_length=500)
    portfolio_url: str | None = Field(default=None, max_length=500)


class CandidateProfileResponse(BaseModel):
    id: UUID
    user_id: UUID

    full_name: str | None
    headline: str | None
    phone: str | None
    location: str | None
    bio: str | None

    linkedin_url: str | None
    github_url: str | None
    portfolio_url: str | None

    model_config = ConfigDict(from_attributes=True)


# =====================================
# Recruiter Profile Schemas
# =====================================

class RecruiterProfileUpdate(BaseModel):
    full_name: str | None = Field(default=None, max_length=150)
    job_title: str | None = Field(default=None, max_length=150)
    phone: str | None = Field(default=None, max_length=20)


class RecruiterProfileResponse(BaseModel):
    id: UUID
    user_id: UUID

    full_name: str | None
    job_title: str | None
    phone: str | None

    model_config = ConfigDict(from_attributes=True)
