
import re
import uuid

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.company import Company
from app.models.company_member import CompanyMember
from app.models.enums import CompanyMemberRole, UserRole
from app.models.user import User

from app.schemas.company import CompanyCreate, CompanyUpdate


def generate_company_slug(name: str) -> str:
    """Generate a URL-friendly company slug."""

    slug = re.sub(
        r"[^a-z0-9]+",
        "-",
        name.lower(),
    ).strip("-")

    return slug or "company"


def create_company(
    db: Session,
    user: User,
    company_data: CompanyCreate,
) -> Company:

    if user.role != UserRole.RECRUITER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only recruiters can create companies.",
        )

    base_slug = generate_company_slug(company_data.name)
    slug = base_slug

    counter = 1

    while db.scalar(
        select(Company.id).where(Company.slug == slug)
    ) is not None:
        counter += 1
        slug = f"{base_slug}-{counter}"

    company = Company(
        name=company_data.name,
        slug=slug,
        description=company_data.description,
        website=(
            str(company_data.website)
            if company_data.website
            else None
        ),
        logo_url=(
            str(company_data.logo_url)
            if company_data.logo_url
            else None
        ),
        industry=company_data.industry,
        company_size=company_data.company_size,
        headquarters=company_data.headquarters,
        created_by_user_id=user.id,
    )

    try:
        db.add(company)
        db.flush()

        owner_membership = CompanyMember(
            company_id=company.id,
            user_id=user.id,
            role=CompanyMemberRole.OWNER,
            is_active=True,
        )

        db.add(owner_membership)
        db.commit()
        db.refresh(company)

        return company

    except Exception:
        db.rollback()
        raise


def get_my_companies(
    db: Session,
    user: User,
) -> list[Company]:

    if user.role != UserRole.RECRUITER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only recruiters can access company management.",
        )

    statement = (
        select(Company)
        .join(
            CompanyMember,
            CompanyMember.company_id == Company.id,
        )
        .where(
            CompanyMember.user_id == user.id,
            CompanyMember.is_active.is_(True),
        )
        .order_by(Company.created_at.desc())
    )

    return list(db.scalars(statement).all())


def get_company_by_id(
    db: Session,
    company_id: uuid.UUID,
) -> Company:

    company = db.get(Company, company_id)

    if company is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Company not found.",
        )

    return company


def update_company(
    db: Session,
    user: User,
    company_id: uuid.UUID,
    company_data: CompanyUpdate,
) -> Company:

    if user.role != UserRole.RECRUITER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only recruiters can update companies.",
        )

    company = get_company_by_id(db, company_id)

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
            detail="Only the company owner can update company details.",
        )

    update_data = company_data.model_dump(
        exclude_unset=True
    )

    if "name" in update_data:
        new_name = update_data["name"]

        if new_name:
            base_slug = generate_company_slug(new_name)
            slug = base_slug
            counter = 1

            while db.scalar(
                select(Company.id).where(
                    Company.slug == slug,
                    Company.id != company_id,
                )
            ) is not None:
                counter += 1
                slug = f"{base_slug}-{counter}"

            company.slug = slug

    for field, value in update_data.items():
        if field in ("website", "logo_url"):
            value = str(value) if value else None

        setattr(company, field, value)

    db.commit()
    db.refresh(company)

    return company
