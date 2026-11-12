import uuid
from datetime import datetime
from sqlalchemy.orm import Mapped, mapped_column, relationship, synonym

from sqlalchemy import (
    CheckConstraint,
    DateTime,
    Enum as SQLAlchemyEnum,
    ForeignKey,
    Integer,
    String,
    Text,
    Boolean,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.connection import Base
from app.models.enums import JobType, WorkMode, ExperienceLevel, JobStatus
from app.models.mixins import TimestampMixin


def enum_values(enum_class):
    return [item.value for item in enum_class]


class Job(Base, TimestampMixin):
    __tablename__ = "jobs"

    __table_args__ = (
        CheckConstraint(
            "min_salary IS NULL OR max_salary IS NULL "
            "OR min_salary <= max_salary",
            name="ck_job_salary_range",
        ),
        CheckConstraint(
            "openings >= 1",
            name="ck_job_openings_positive",
        ),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )

    title: Mapped[str] = mapped_column(
        String(200),
        nullable=False,
        index=True,
    )

    slug: Mapped[str] = mapped_column(
        String(230),
        unique=True,
        nullable=False,
        index=True,
    )

    description: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )

    responsibilities: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    requirements: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    location: Mapped[str | None] = mapped_column(
        String(200),
        nullable=True,
        index=True,
    )

    job_type: Mapped[JobType] = mapped_column(
        SQLAlchemyEnum(
            JobType,
            native_enum=False,
            values_callable=enum_values,
            length=30,
        ),
        nullable=False,
    )

    work_mode: Mapped[WorkMode] = mapped_column(
        SQLAlchemyEnum(
            WorkMode,
            native_enum=False,
            values_callable=enum_values,
            length=20,
        ),
        nullable=False,
    )

    experience_level: Mapped[ExperienceLevel] = mapped_column(
        SQLAlchemyEnum(
            ExperienceLevel,
            native_enum=False,
            values_callable=enum_values,
            length=20,
        ),
        nullable=False,
    )

    min_salary: Mapped[int | None] = mapped_column(
        Integer,
        nullable=True,
    )

    max_salary: Mapped[int | None] = mapped_column(
        Integer,
        nullable=True,
    )

    salary_currency: Mapped[str] = mapped_column(
        String(10),
        default="INR",
        nullable=False,
    )
    currency = synonym("salary_currency")

    openings: Mapped[int] = mapped_column(
        Integer,
        default=1,
        nullable=False,
    )

    status: Mapped[JobStatus] = mapped_column(
        SQLAlchemyEnum(
            JobStatus,
            native_enum=False,
            values_callable=enum_values,
            length=20,
        ),
        default=JobStatus.DRAFT,
        nullable=False,
        index=True,
    )

    is_featured: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        nullable=False,
    )

    published_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    expires_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    company_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("companies.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    posted_by_user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )

    category_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("job_categories.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )

    company = relationship(
        "Company",
        back_populates="jobs",
    )

    posted_by_user = relationship(
        "User",
        back_populates="posted_jobs",
        foreign_keys=[posted_by_user_id],
    )

    category = relationship(
        "JobCategory",
        back_populates="jobs",
    )

    skills = relationship(
        "JobSkill",
        back_populates="job",
        cascade="all, delete-orphan",
    )

    applications = relationship(
        "JobApplication",
        back_populates="job",
        cascade="all, delete-orphan",
    )

    saved_jobs = relationship(
        "SavedJob",
        back_populates="job",
        cascade="all, delete-orphan",
    )

    reports = relationship(
        "ReportedJob",
        back_populates="job",
        cascade="all, delete-orphan",
    )
