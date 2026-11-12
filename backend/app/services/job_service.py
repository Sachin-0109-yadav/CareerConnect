
import re
from datetime import datetime, timezone
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session, joinedload

from app.models.company import Company
from app.models.company_member import CompanyMember
from app.models.enums import (
    CompanyMemberRole,
    JobStatus,
    UserRole,
)
from app.models.job import Job
from app.models.job_skill import JobSkill
from app.models.skill import Skill
from app.models.user import User

from app.schemas.job import (
    JobCreate,
    JobUpdate,
    JobResponse,
)


# ============================================================
# JOB UTILITIES
# ============================================================

def generate_job_slug(title: str) -> str:
    slug = re.sub(
        r"[^a-zA-Z0-9]+",
        "-",
        title.lower(),
    ).strip("-")

    return slug or "job"


def get_company_membership(
    db: Session,
    company_id: UUID,
    user: User,
) -> CompanyMember:

    if user.role != UserRole.RECRUITER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only recruiters can manage company jobs.",
        )

    membership = db.scalar(
        select(CompanyMember).where(
            CompanyMember.company_id == company_id,
            CompanyMember.user_id == user.id,
            CompanyMember.is_active.is_(True),
        )
    )

    if membership is None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not an active member of this company.",
        )

    return membership


# ============================================================
# JOB SKILLS
# ============================================================

def validate_skills(
    db: Session,
    skill_ids: list[UUID],
) -> None:

    unique_ids = set(skill_ids)

    if len(unique_ids) != len(skill_ids):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Duplicate skill IDs are not allowed.",
        )

    if not unique_ids:
        return

    existing_ids = set(
        db.scalars(
            select(Skill.id).where(
                Skill.id.in_(unique_ids)
            )
        ).all()
    )

    if existing_ids != unique_ids:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="One or more skill IDs are invalid.",
        )


def replace_job_skills(
    db: Session,
    job_id: UUID,
    skill_ids: list[UUID],
) -> None:

    db.query(JobSkill).filter(
        JobSkill.job_id == job_id
    ).delete(synchronize_session=False)

    for skill_id in skill_ids:
        db.add(
            JobSkill(
                job_id=job_id,
                skill_id=skill_id,
            )
        )


# ============================================================
# CREATE JOB
# ============================================================

def create_job(
    db: Session,
    company_id: UUID,
    current_user: User,
    job_data: JobCreate,
) -> Job:

    company = db.get(Company, company_id)

    if company is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Company not found.",
        )

    membership = get_company_membership(
        db,
        company_id,
        current_user,
    )

    if membership.role not in (
        CompanyMemberRole.OWNER,
        CompanyMemberRole.ADMIN,
        CompanyMemberRole.RECRUITER,
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You cannot post jobs for this company.",
        )

    validate_skills(db, job_data.skill_ids)

    job_values = job_data.model_dump(
        exclude={"skill_ids"}
    )

    base_slug = generate_job_slug(job_data.title)
    slug = base_slug
    counter = 1

    while db.scalar(
        select(Job.id).where(Job.slug == slug)
    ) is not None:
        counter += 1
        slug = f"{base_slug}-{counter}"

    job = Job(
        **job_values,
        slug=slug,
        company_id=company_id,
        posted_by_user_id=current_user.id,
        status=JobStatus.DRAFT,
        is_featured=False,
    )

    try:
        db.add(job)
        db.flush()

        replace_job_skills(
            db,
            job.id,
            job_data.skill_ids,
        )

        db.commit()
        db.refresh(job)

    except Exception:
        db.rollback()
        raise

    return job


# ============================================================
# GET COMPANY JOBS
# ============================================================

def get_company_jobs(
    db: Session,
    company_id: UUID,
    current_user: User,
) -> list[Job]:

    get_company_membership(
        db,
        company_id,
        current_user,
    )

    return list(
        db.scalars(
            select(Job)
            .where(Job.company_id == company_id)
            .order_by(Job.created_at.desc())
        ).all()
    )


# ============================================================
# GET JOB FOR RECRUITER EDITING
# ============================================================

def get_job_for_edit(
    db: Session,
    job_id: UUID,
    current_user: User,
) -> dict:

    job = db.get(Job, job_id)

    if job is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job not found.",
        )

    membership = get_company_membership(
        db,
        job.company_id,
        current_user,
    )

    if (
        membership.role not in (
            CompanyMemberRole.OWNER,
            CompanyMemberRole.ADMIN,
        )
        and job.posted_by_user_id != current_user.id
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You cannot edit this job.",
        )

    job_data = JobResponse.model_validate(
        job
    ).model_dump(
        mode="json"
    )

    skill_ids = db.scalars(
        select(JobSkill.skill_id).where(
            JobSkill.job_id == job.id
        )
    ).all()

    job_data["skill_ids"] = [
        str(skill_id)
        for skill_id in skill_ids
    ]

    return job_data


# ============================================================
# UPDATE JOB
# ============================================================

def update_job(
    db: Session,
    job_id: UUID,
    current_user: User,
    job_data: JobUpdate,
) -> Job:

    job = db.get(Job, job_id)

    if job is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job not found.",
        )

    membership = get_company_membership(
        db,
        job.company_id,
        current_user,
    )

    if (
        membership.role not in (
            CompanyMemberRole.OWNER,
            CompanyMemberRole.ADMIN,
        )
        and job.posted_by_user_id != current_user.id
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You cannot edit this job.",
        )

    changes = job_data.model_dump(
        exclude_unset=True
    )

    # Recruiters cannot change job status through the edit endpoint.
    if "status" in changes:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Use the job status endpoint to change job status.",
        )

    skill_ids = changes.pop("skill_ids", None)

    if skill_ids is not None:
        validate_skills(db, skill_ids)

        replace_job_skills(
            db,
            job.id,
            skill_ids,
        )

    for field, value in changes.items():
        setattr(job, field, value)

    try:
        db.commit()
        db.refresh(job)

    except Exception:
        db.rollback()
        raise

    return job


# ============================================================
# UPDATE JOB STATUS
# ============================================================

def update_job_status(
    db: Session,
    job_id: UUID,
    current_user: User,
    new_status: JobStatus,
) -> Job:

    job = db.get(Job, job_id)

    if job is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job not found.",
        )

    membership = get_company_membership(
        db,
        job.company_id,
        current_user,
    )

    if (
        membership.role not in (
            CompanyMemberRole.OWNER,
            CompanyMemberRole.ADMIN,
        )
        and job.posted_by_user_id != current_user.id
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You cannot change this job's status.",
        )

    if new_status == JobStatus.PUBLISHED:
        company = db.get(Company, job.company_id)

        if (
            company is None
            or company.verification_status != "verified"
        ):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=(
                    "Your company must be verified "
                    "before publishing jobs."
                ),
            )

    job.status = new_status

    if (
        new_status == JobStatus.PUBLISHED
        and job.published_at is None
    ):
        job.published_at = datetime.now(timezone.utc)

    try:
        db.commit()
        db.refresh(job)

    except Exception:
        db.rollback()
        raise

    return job


# ============================================================
# DELETE JOB
# ============================================================

def delete_job(
    db: Session,
    job_id: UUID,
    current_user: User,
) -> None:

    job = db.get(Job, job_id)

    if job is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job not found.",
        )

    membership = get_company_membership(
        db,
        job.company_id,
        current_user,
    )

    if membership.role not in (
        CompanyMemberRole.OWNER,
        CompanyMemberRole.ADMIN,
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only company owners and admins can delete jobs.",
        )

    try:
        db.delete(job)
        db.commit()

    except Exception:
        db.rollback()
        raise


# ============================================================
# PUBLIC JOB SEARCH
# ============================================================

def search_public_jobs(
    db: Session,
    keyword: str | None = None,
    location: str | None = None,
    job_type: str | None = None,
    work_mode: str | None = None,
    experience_level: str | None = None,
    category_id: UUID | None = None,
    min_salary: int | None = None,
    max_salary: int | None = None,
    page: int = 1,
    page_size: int = 10,
    sort_by: str = "latest",
) -> dict:

    """
    Search published jobs from verified companies.
    Supports filtering, sorting and pagination.
    """

    now = datetime.now(timezone.utc)

    query = (
        select(Job)
        .join(Company, Job.company_id == Company.id)
        .options(joinedload(Job.company))
        .where(
            Job.status == JobStatus.PUBLISHED,
            Company.verification_status == "verified",
            or_(
                Job.expires_at.is_(None),
                Job.expires_at > now,
            ),
        )
    )

    if keyword:
        search_term = f"%{keyword.strip()}%"

        query = query.where(
            or_(
                Job.title.ilike(search_term),
                Job.description.ilike(search_term),
                Company.name.ilike(search_term),
            )
        )

    if location:
        query = query.where(
            Job.location.ilike(f"%{location.strip()}%")
        )

    if job_type:
        query = query.where(Job.job_type == job_type)

    if work_mode:
        query = query.where(Job.work_mode == work_mode)

    if experience_level:
        query = query.where(
            Job.experience_level == experience_level
        )

    if category_id:
        query = query.where(Job.category_id == category_id)

    if min_salary is not None:
        query = query.where(
            Job.max_salary.is_not(None),
            Job.max_salary >= min_salary,
        )

    if max_salary is not None:
        query = query.where(
            Job.min_salary.is_not(None),
            Job.min_salary <= max_salary,
        )

    if sort_by == "oldest":
        query = query.order_by(Job.published_at.asc().nullslast())

    elif sort_by == "salary_high":
        query = query.order_by(Job.max_salary.desc().nullslast())

    elif sort_by == "salary_low":
        query = query.order_by(Job.min_salary.asc().nullslast())

    else:
        query = query.order_by(Job.published_at.desc().nullslast())

    count_query = select(func.count()).select_from(
        query.order_by(None).subquery()
    )

    total = db.scalar(count_query) or 0

    offset = (page - 1) * page_size

    jobs = db.scalars(
        query.offset(offset).limit(page_size)
    ).unique().all()

    return {
        "items": jobs,
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": (
            total + page_size - 1
        ) // page_size,
    }


# ============================================================
# PUBLIC JOB DETAILS
# ============================================================

def get_public_job_details(
    db: Session,
    job_id: UUID,
) -> dict:

    """
    Return public job details only when the job is published,
    not expired, and belongs to a verified company.
    """

    now = datetime.now(timezone.utc)

    job = db.scalar(
        select(Job)
        .join(Company, Job.company_id == Company.id)
        .options(
            joinedload(Job.company),
            joinedload(Job.skills).joinedload(JobSkill.skill),
        )
        .where(
            Job.id == job_id,
            Job.status == JobStatus.PUBLISHED,
            Company.verification_status == "verified",
            or_(
                Job.expires_at.is_(None),
                Job.expires_at > now,
            ),
        )
    )

    if job is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job not found or no longer available.",
        )

    return {
        "id": job.id,
        "title": job.title,
        "slug": job.slug,
        "description": job.description,
        "responsibilities": job.responsibilities,
        "requirements": job.requirements,
        "location": job.location,
        "job_type": job.job_type,
        "work_mode": job.work_mode,
        "experience_level": job.experience_level,
        "min_salary": job.min_salary,
        "max_salary": job.max_salary,
        "currency": job.currency,
        "openings": job.openings,
        "is_featured": job.is_featured,
        "company_id": job.company_id,
        "category_id": job.category_id,
        "published_at": job.published_at,
        "expires_at": job.expires_at,
        "created_at": job.created_at,
        "company": job.company,
        "skills": [
            link.skill
            for link in job.skills
            if link.skill is not None
        ],
    }