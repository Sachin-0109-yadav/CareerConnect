import uuid
from datetime import datetime

from sqlalchemy import (
    DateTime,
    Enum as SQLAlchemyEnum,
    ForeignKey,
    String,
    Text,
    func,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.connection import Base
from app.models.enums import ReportStatus
from app.models.mixins import TimestampMixin


class ReportedJob(Base, TimestampMixin):
    __tablename__ = "reported_jobs"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )

    job_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("jobs.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    reported_by_user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    reason: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
    )

    description: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    status: Mapped[ReportStatus] = mapped_column(
        SQLAlchemyEnum(
            ReportStatus,
            native_enum=False,
            values_callable=lambda enum_cls: [
                item.value for item in enum_cls
            ],
            length=30,
        ),
        default=ReportStatus.PENDING,
        nullable=False,
        index=True,
    )

    reviewed_by_user_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )

    reviewed_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    job = relationship(
        "Job",
        back_populates="reports",
    )

    reported_by_user = relationship(
        "User",
        back_populates="submitted_reports",
        foreign_keys=[reported_by_user_id],
    )

    reviewed_by_user = relationship(
        "User",
        foreign_keys=[reviewed_by_user_id],
    )