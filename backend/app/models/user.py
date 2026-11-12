import uuid
from datetime import datetime

from sqlalchemy import Boolean, Enum as SQLAlchemyEnum, String, DateTime, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.connection import Base
from app.models.enums import UserRole
from app.models.mixins import TimestampMixin


class User(Base, TimestampMixin):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )

    email: Mapped[str] = mapped_column(
        String(255),
        unique=True,
        index=True,
        nullable=False,
    )

    hashed_password: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )

    role: Mapped[UserRole] = mapped_column(
        SQLAlchemyEnum(
            UserRole,
            native_enum=False,
            values_callable=lambda enum_cls: [
                item.value for item in enum_cls
            ],
            length=20,
        ),
        default=UserRole.CANDIDATE,
        nullable=False,
    )

    is_active: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        nullable=False,
    )

    is_verified: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        nullable=False,
    )

    last_login_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    candidate_profile = relationship(
        "CandidateProfile",
        back_populates="user",
        uselist=False,
        cascade="all, delete-orphan",
    )

    recruiter_profile = relationship(
        "RecruiterProfile",
        back_populates="user",
        uselist=False,
        cascade="all, delete-orphan",
    )

    company_memberships = relationship(
        "CompanyMember",
        back_populates="user",
        cascade="all, delete-orphan",
        foreign_keys="CompanyMember.user_id",
    )

    created_companies = relationship(
        "Company",
        back_populates="created_by_user",
        foreign_keys="Company.created_by_user_id",
    )

    posted_jobs = relationship(
        "Job",
        back_populates="posted_by_user",
        foreign_keys="Job.posted_by_user_id",
    )


    notifications = relationship(
        "Notification",
        back_populates="user",
        cascade="all, delete-orphan",
    )

    submitted_reports = relationship(
        "ReportedJob",
        back_populates="reported_by_user",
        foreign_keys="ReportedJob.reported_by_user_id",
    )

    audit_logs = relationship(
        "AuditLog",
        back_populates="actor",
        foreign_keys="AuditLog.actor_user_id",
    )