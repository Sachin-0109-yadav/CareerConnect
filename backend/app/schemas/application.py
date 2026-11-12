
from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.models.enums import ApplicationStatus


class JobApplicationCreate(BaseModel):
    resume_id: UUID | None = None
    cover_letter: str | None = Field(default=None, max_length=10000)


class ApplicationStatusUpdate(BaseModel):
    status: ApplicationStatus
    note: str | None = Field(default=None, max_length=2000)


class ApplicationStatusHistoryResponse(BaseModel):
    id: UUID
    previous_status: ApplicationStatus | None
    new_status: ApplicationStatus
    changed_by_user_id: UUID | None
    note: str | None
    changed_at: datetime

    model_config = ConfigDict(from_attributes=True)


class JobApplicationResponse(BaseModel):
    id: UUID
    candidate_profile_id: UUID
    job_id: UUID
    resume_id: UUID | None
    cover_letter: str | None
    status: ApplicationStatus
    applied_at: datetime

    model_config = ConfigDict(from_attributes=True)


class CandidateApplicationResponse(JobApplicationResponse):
    job_title: str
    company_name: str
    job_location: str | None = None


class RecruiterApplicationResponse(JobApplicationResponse):
    candidate_name: str | None = None
    candidate_email: str
    candidate_location: str | None = None
    resume_filename: str | None = None
    status_history: list[ApplicationStatusHistoryResponse] = Field(
        default_factory=list
    )
