
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.company import Company
from app.models.company_member import CompanyMember
from app.models.enums import CompanyMemberRole, UserRole
from app.models.user import User

from app.schemas.company_member import (
    CompanyMemberCreate,
    CompanyMemberRoleUpdate,
)


def get_company_owner_membership(
    db: Session,
    company_id: UUID,
    user: User,
) -> CompanyMember:

    company = db.get(Company, company_id)

    if company is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Company not found.",
        )

    membership = db.scalar(
        select(CompanyMember).where(
            CompanyMember.company_id == company_id,
            CompanyMember.user_id == user.id,
            CompanyMember.is_active.is_(True),
        )
    )

    if (
        company.created_by_user_id != user.id
        or membership is None
        or membership.role != CompanyMemberRole.OWNER
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the company owner can manage members.",
        )

    return membership


def add_company_member(
    db: Session,
    company_id: UUID,
    current_user: User,
    member_data: CompanyMemberCreate,
) -> CompanyMember:

    get_company_owner_membership(
        db,
        company_id,
        current_user,
    )

    email = member_data.email.strip().lower()

    member_user = db.scalar(
        select(User).where(
            User.email == email
        )
    )

    if member_user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User with this email was not found.",
        )

    if member_user.role != UserRole.RECRUITER:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only recruiter accounts can join a company.",
        )

    existing_membership = db.scalar(
        select(CompanyMember).where(
            CompanyMember.company_id == company_id,
            CompanyMember.user_id == member_user.id,
        )
    )

    if existing_membership is not None:
        if existing_membership.is_active:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="This recruiter is already a company member.",
            )

        existing_membership.is_active = True
        existing_membership.role = CompanyMemberRole.RECRUITER

        db.commit()
        db.refresh(existing_membership)

        return existing_membership

    membership = CompanyMember(
        company_id=company_id,
        user_id=member_user.id,
        role=CompanyMemberRole.RECRUITER,
        is_active=True,
    )

    db.add(membership)
    db.commit()
    db.refresh(membership)

    return membership


def list_company_members(
    db: Session,
    company_id: UUID,
    current_user: User,
) -> list[CompanyMember]:

    get_company_owner_membership(
        db,
        company_id,
        current_user,
    )

    statement = (
        select(CompanyMember)
        .where(
            CompanyMember.company_id == company_id,
            CompanyMember.is_active.is_(True),
        )
        .order_by(CompanyMember.created_at.asc())
    )

    return list(db.scalars(statement).all())


def update_company_member_role(
    db: Session,
    company_id: UUID,
    member_id: UUID,
    current_user: User,
    role_data: CompanyMemberRoleUpdate,
) -> CompanyMember:

    get_company_owner_membership(
        db,
        company_id,
        current_user,
    )

    membership = db.scalar(
        select(CompanyMember).where(
            CompanyMember.id == member_id,
            CompanyMember.company_id == company_id,
        )
    )

    if membership is None or not membership.is_active:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Active company membership not found.",
        )

    if membership.role == CompanyMemberRole.OWNER:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The company owner role cannot be changed here.",
        )

    if role_data.role == CompanyMemberRole.OWNER:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The owner role cannot be assigned through this operation.",
        )

    membership.role = role_data.role

    db.commit()
    db.refresh(membership)

    return membership


def deactivate_company_member(
    db: Session,
    company_id: UUID,
    member_id: UUID,
    current_user: User,
) -> None:

    get_company_owner_membership(
        db,
        company_id,
        current_user,
    )

    membership = db.scalar(
        select(CompanyMember).where(
            CompanyMember.id == member_id,
            CompanyMember.company_id == company_id,
        )
    )

    if membership is None or not membership.is_active:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Active company membership not found.",
        )

    if membership.role == CompanyMemberRole.OWNER:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The company owner cannot be removed.",
        )

    membership.is_active = False

    db.commit()
