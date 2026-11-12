import uuid

from sqlalchemy import (
    Boolean,
    Enum as SQLAlchemyEnum,
    ForeignKey,
    UniqueConstraint,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.connection import Base
from app.models.enums import CompanyMemberRole
from app.models.mixins import TimestampMixin


class CompanyMember(Base, TimestampMixin):
    __tablename__ = "company_members"

    __table_args__ = (
        UniqueConstraint(
            "company_id",
            "user_id",
            name="uq_company_member",
        ),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )

    company_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("companies.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    role: Mapped[CompanyMemberRole] = mapped_column(
        SQLAlchemyEnum(
            CompanyMemberRole,
            native_enum=False,
            values_callable=lambda enum_cls: [
                item.value for item in enum_cls
            ],
            length=20,
        ),
        default=CompanyMemberRole.RECRUITER,
        nullable=False,
    )

    is_active: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        nullable=False,
    )

    company = relationship(
        "Company",
        back_populates="members",
    )

    user = relationship(
        "User",
        back_populates="company_memberships",
        foreign_keys=[user_id],
    )