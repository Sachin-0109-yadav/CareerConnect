import uuid

from sqlalchemy import ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.connection import Base
from app.models.mixins import TimestampMixin


class CandidateProfile(Base, TimestampMixin):
    __tablename__ = "candidate_profiles"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        unique=True,
        nullable=False,
    )

    full_name: Mapped[str | None] = mapped_column(
        String(150),
        nullable=True,
    )

    headline: Mapped[str | None] = mapped_column(
        String(200),
        nullable=True,
    )

    phone: Mapped[str | None] = mapped_column(
        String(20),
        nullable=True,
    )

    location: Mapped[str | None] = mapped_column(
        String(150),
        nullable=True,
    )

    bio: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    linkedin_url: Mapped[str | None] = mapped_column(
        String(500),
        nullable=True,
    )

    github_url: Mapped[str | None] = mapped_column(
        String(500),
        nullable=True,
    )

    portfolio_url: Mapped[str | None] = mapped_column(
        String(500),
        nullable=True,
    )

    user = relationship(
        "User",
        back_populates="candidate_profile",
    )

    skills = relationship(
        "CandidateSkill",
        back_populates="candidate_profile",
        cascade="all, delete-orphan",
    )

    education = relationship(
        "Education",
        back_populates="candidate_profile",
        cascade="all, delete-orphan",
    )

    experience = relationship(
        "Experience",
        back_populates="candidate_profile",
        cascade="all, delete-orphan",
    )

    resumes = relationship(
        "Resume",
        back_populates="candidate_profile",
        cascade="all, delete-orphan",
    )

    applications = relationship(
        "JobApplication",
        back_populates="candidate_profile",
        cascade="all, delete-orphan",
    )

    saved_jobs = relationship(
        "SavedJob",
        back_populates="candidate_profile",
        cascade="all, delete-orphan",
    )