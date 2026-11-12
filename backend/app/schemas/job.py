
from datetime import datetime
from uuid import UUID

from pydantic import (
    BaseModel,
    ConfigDict,
    Field,
    HttpUrl,
    model_validator,
)

from app.models.enums import (
    JobType,
    WorkMode,
    ExperienceLevel,
    JobStatus,
)


class JobCreate(BaseModel):
    title: str = Field(min_length=3, max_length=200)
    description: str = Field(min_length=30)
    responsibilities: str | None = None
    requirements: str | None = None

    location: str = Field(min_length=2, max_length=200)

    job_type: JobType
    work_mode: WorkMode
    experience_level: ExperienceLevel

    min_salary: float | None = Field(default=None, ge=0)
    max_salary: float | None = Field(default=None, ge=0)
    currency: str = Field(default="INR", min_length=3, max_length=3)

    openings: int = Field(default=1, ge=1, le=10000)

    category_id: UUID
    skill_ids: list[UUID] = Field(default_factory=list)

    expires_at: datetime | None = None

    @model_validator(mode="after")
    def validate_salary_range(self):
        if (
            self.min_salary is not None
            and self.max_salary is not None
            and self.min_salary > self.max_salary
        ):
            raise ValueError(
                "Minimum salary cannot exceed maximum salary."
            )

        return self


class JobUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=3, max_length=200)
    description: str | None = Field(default=None, min_length=30)
    responsibilities: str | None = None
    requirements: str | None = None

    location: str | None = Field(default=None, min_length=2, max_length=200)

    job_type: JobType | None = None
    work_mode: WorkMode | None = None
    experience_level: ExperienceLevel | None = None

    min_salary: float | None = Field(default=None, ge=0)
    max_salary: float | None = Field(default=None, ge=0)
    currency: str | None = Field(default=None, min_length=3, max_length=3)

    openings: int | None = Field(default=None, ge=1, le=10000)

    category_id: UUID | None = None
    skill_ids: list[UUID] | None = None

    expires_at: datetime | None = None

    @model_validator(mode="after")
    def validate_salary_range(self):
        minimum = self.min_salary
        maximum = self.max_salary

        if (
            minimum is not None
            and maximum is not None
            and minimum > maximum
        ):
            raise ValueError(
                "Minimum salary cannot exceed maximum salary."
            )

        return self


class JobStatusUpdate(BaseModel):
    status: JobStatus


class JobResponse(BaseModel):
    id: UUID
    title: str
    slug: str
    description: str
    responsibilities: str | None
    requirements: str | None

    location: str
    job_type: JobType
    work_mode: WorkMode
    experience_level: ExperienceLevel

    min_salary: float | None
    max_salary: float | None
    currency: str
    openings: int

    status: JobStatus
    is_featured: bool

    company_id: UUID
    posted_by_user_id: UUID
    category_id: UUID

    published_at: datetime | None
    expires_at: datetime | None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

class PublicCompanyResponse(BaseModel):
    id: UUID
    name: str
    slug: str
    description: str | None = None
    website: str | None = None
    logo_url: str | None = None
    industry: str | None = None
    company_size: str | None = None
    headquarters: str | None = None

    model_config = ConfigDict(from_attributes=True)


class PublicSkillResponse(BaseModel):
    id: UUID
    name: str

    model_config = ConfigDict(from_attributes=True)


class PublicJobDetailResponse(BaseModel):
    id: UUID
    title: str
    slug: str
    description: str
    responsibilities: str | None = None
    requirements: str | None = None

    location: str | None = None
    job_type: JobType
    work_mode: WorkMode
    experience_level: ExperienceLevel

    min_salary: int | None = None
    max_salary: int | None = None
    currency: str

    openings: int
    is_featured: bool

    company_id: UUID
    category_id: UUID | None = None

    published_at: datetime | None = None
    expires_at: datetime | None = None
    created_at: datetime

    company: PublicCompanyResponse
    skills: list[PublicSkillResponse]

    model_config = ConfigDict(from_attributes=True)
