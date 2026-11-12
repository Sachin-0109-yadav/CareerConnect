
from datetime import datetime, timedelta, timezone
from typing import Literal
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field
from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session, joinedload

from app.database.connection import get_db
from app.dependencies.auth import require_admin

from app.models.user import User
from app.models.enums import (
    UserRole,
    JobStatus,
    ReportStatus,
)
from app.models.company import Company
from app.models.job import Job
from app.models.job_application import JobApplication
from app.models.reported_job import ReportedJob


router = APIRouter(prefix="/admin", tags=["Admin"])


# ============================================================
# REQUEST SCHEMAS
# ============================================================

class UserStatusUpdate(BaseModel):
    is_active: bool = Field(
        ...,
        description="True to activate or false to suspend the account.",
    )


class CompanyVerificationUpdate(BaseModel):
    verification_status: Literal["verified", "rejected"]


class JobModerationUpdate(BaseModel):
    status: Literal["published", "closed", "archived"]


class ReportStatusUpdate(BaseModel):
    status: Literal[
        "under_review",
        "resolved",
        "dismissed",
    ]


# ============================================================
# ADMIN DASHBOARD
# ============================================================

@router.get("/dashboard/stats")
def get_admin_dashboard_stats(
    current_admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """Return platform-wide statistics."""

    def count_records(model, *conditions):
        statement = select(func.count()).select_from(model)

        if conditions:
            statement = statement.where(*conditions)

        return db.scalar(statement) or 0

    # Users
    total_users = count_records(User)

    total_candidates = count_records(
        User, User.role == UserRole.CANDIDATE
    )

    total_recruiters = count_records(
        User, User.role == UserRole.RECRUITER
    )

    total_admins = count_records(
        User, User.role == UserRole.ADMIN
    )

    active_users = count_records(
        User, User.is_active.is_(True)
    )

    inactive_users = count_records(
        User, User.is_active.is_(False)
    )

    # Companies
    total_companies = count_records(Company)

    pending_companies = count_records(
        Company, Company.verification_status == "pending"
    )

    verified_companies = count_records(
        Company, Company.verification_status == "verified"
    )

    rejected_companies = count_records(
        Company, Company.verification_status == "rejected"
    )

    # Jobs
    total_jobs = count_records(Job)

    job_status_counts = {
        job_status.value: count_records(
            Job, Job.status == job_status
        )
        for job_status in JobStatus
    }

    # Applications
    total_applications = count_records(JobApplication)

    # Reports
    report_status_counts = {
        report_status.value: count_records(
            ReportedJob,
            ReportedJob.status == report_status,
        )
        for report_status in ReportStatus
    }

    # Registrations over the last seven days
    seven_days_ago = (
        datetime.now(timezone.utc) - timedelta(days=6)
    )

    registration_statement = (
        select(
            func.date(User.created_at).label("registration_date"),
            func.count(User.id).label("total"),
        )
        .where(User.created_at >= seven_days_ago)
        .group_by(func.date(User.created_at))
        .order_by(func.date(User.created_at))
    )

    registration_rows = db.execute(
        registration_statement
    ).all()

    registrations_last_7_days = [
        {
            "date": row.registration_date.isoformat(),
            "count": row.total,
        }
        for row in registration_rows
    ]

    return {
        "users": {
            "total": total_users,
            "candidates": total_candidates,
            "recruiters": total_recruiters,
            "admins": total_admins,
            "active": active_users,
            "inactive": inactive_users,
        },
        "companies": {
            "total": total_companies,
            "pending": pending_companies,
            "verified": verified_companies,
            "rejected": rejected_companies,
        },
        "jobs": {
            "total": total_jobs,
            "by_status": job_status_counts,
        },
        "applications": {
            "total": total_applications,
        },
        "reports": {
            "total": sum(report_status_counts.values()),
            **report_status_counts,
        },
        "registrations_last_7_days": registrations_last_7_days,
    }


# ============================================================
# USER MANAGEMENT
# ============================================================

@router.get("/users")
def get_all_users(
    search: str | None = Query(default=None),
    role: UserRole | None = Query(default=None),
    is_active: bool | None = Query(default=None),
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=20, ge=1, le=100),
    current_admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """List and filter platform users."""

    statement = select(User)

    if search:
        statement = statement.where(
            User.email.ilike(f"%{search.strip()}%")
        )

    if role is not None:
        statement = statement.where(User.role == role)

    if is_active is not None:
        statement = statement.where(
            User.is_active == is_active
        )

    total = db.scalar(
        select(func.count()).select_from(
            statement.subquery()
        )
    ) or 0

    users = db.scalars(
        statement
        .order_by(User.created_at.desc())
        .offset(skip)
        .limit(limit)
    ).all()

    return {
        "total": total,
        "skip": skip,
        "limit": limit,
        "users": [
            {
                "id": str(user.id),
                "email": user.email,
                "role": user.role.value,
                "is_active": user.is_active,
                "is_verified": user.is_verified,
                "created_at": user.created_at.isoformat(),
            }
            for user in users
        ],
    }


@router.get("/users/{user_id}")
def get_user_details(
    user_id: UUID,
    current_admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """Get details of an individual user."""

    user = db.get(User, user_id)

    if user is None:
        raise HTTPException(
            status_code=404,
            detail="User not found.",
        )

    return {
        "id": str(user.id),
        "email": user.email,
        "role": user.role.value,
        "is_active": user.is_active,
        "is_verified": user.is_verified,
        "last_login_at": (
            user.last_login_at.isoformat()
            if user.last_login_at else None
        ),
        "created_at": user.created_at.isoformat(),
        "updated_at": user.updated_at.isoformat(),
    }


@router.patch("/users/{user_id}/status")
def update_user_status(
    user_id: UUID,
    payload: UserStatusUpdate,
    current_admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """Activate or suspend a user account."""

    user = db.get(User, user_id)

    if user is None:
        raise HTTPException(
            status_code=404,
            detail="User not found.",
        )

    if user.id == current_admin.id and not payload.is_active:
        raise HTTPException(
            status_code=400,
            detail="You cannot suspend your own admin account.",
        )

    user.is_active = payload.is_active

    try:
        db.commit()
        db.refresh(user)
    except Exception:
        db.rollback()
        raise

    return {
        "message": (
            "User account activated."
            if user.is_active
            else "User account suspended."
        ),
        "user_id": str(user.id),
        "email": user.email,
        "is_active": user.is_active,
    }


# ============================================================
# COMPANY MANAGEMENT
# ============================================================

@router.get("/companies")
def get_all_companies(
    verification_status: Literal[
        "pending", "verified", "rejected"
    ] | None = None,
    search: str | None = None,
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=20, ge=1, le=100),
    current_admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """List and filter companies."""

    statement = select(Company)

    if verification_status:
        statement = statement.where(
            Company.verification_status == verification_status
        )

    if search:
        statement = statement.where(
            Company.name.ilike(f"%{search.strip()}%")
        )

    total = db.scalar(
        select(func.count()).select_from(
            statement.subquery()
        )
    ) or 0

    companies = db.scalars(
        statement
        .order_by(Company.created_at.desc())
        .offset(skip)
        .limit(limit)
    ).all()

    return {
        "total": total,
        "skip": skip,
        "limit": limit,
        "companies": [
            {
                "id": str(company.id),
                "name": company.name,
                "slug": company.slug,
                "website": company.website,
                "industry": company.industry,
                "headquarters": company.headquarters,
                "verification_status": company.verification_status,
                "created_at": company.created_at.isoformat(),
            }
            for company in companies
        ],
    }


@router.get("/companies/{company_id}")
def get_company_details(
    company_id: UUID,
    current_admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """View complete company details."""

    company = db.get(Company, company_id)

    if company is None:
        raise HTTPException(
            status_code=404,
            detail="Company not found.",
        )

    return {
        "id": str(company.id),
        "name": company.name,
        "slug": company.slug,
        "description": company.description,
        "website": company.website,
        "logo_url": company.logo_url,
        "industry": company.industry,
        "company_size": company.company_size,
        "headquarters": company.headquarters,
        "verification_status": company.verification_status,
        "verified_by_user_id": (
            str(company.verified_by_user_id)
            if company.verified_by_user_id else None
        ),
        "verified_at": (
            company.verified_at.isoformat()
            if company.verified_at else None
        ),
        "created_at": company.created_at.isoformat(),
    }


@router.patch("/companies/{company_id}/verification")
def update_company_verification(
    company_id: UUID,
    payload: CompanyVerificationUpdate,
    current_admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """Approve or reject a company."""

    company = db.get(Company, company_id)

    if company is None:
        raise HTTPException(
            status_code=404,
            detail="Company not found.",
        )

    company.verification_status = payload.verification_status
    company.verified_by_user_id = current_admin.id
    company.verified_at = datetime.now(timezone.utc)

    try:
        db.commit()
        db.refresh(company)
    except Exception:
        db.rollback()
        raise

    return {
        "message": (
            "Company verified successfully."
            if company.verification_status == "verified"
            else "Company verification rejected."
        ),
        "company_id": str(company.id),
        "company_name": company.name,
        "verification_status": company.verification_status,
        "verified_at": company.verified_at.isoformat(),
    }


# ============================================================
# ADMIN JOB MODERATION
# ============================================================

@router.get("/jobs")
def get_all_jobs(
    search: str | None = Query(default=None),
    job_status: Literal[
        "draft", "published", "closed", "archived"
    ] | None = Query(default=None, alias="status"),
    company_id: UUID | None = Query(default=None),
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=20, ge=1, le=100),
    current_admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """List and filter all platform jobs."""

    statement = (
        select(Job)
        .join(Company, Job.company_id == Company.id)
    )

    if search:
        search_term = f"%{search.strip()}%"

        statement = statement.where(
            or_(
                Job.title.ilike(search_term),
                Company.name.ilike(search_term),
            )
        )

    if job_status:
        statement = statement.where(
            Job.status == JobStatus(job_status)
        )

    if company_id:
        statement = statement.where(
            Job.company_id == company_id
        )

    total = db.scalar(
        select(func.count()).select_from(
            statement.subquery()
        )
    ) or 0

    jobs = db.scalars(
        statement
        .options(joinedload(Job.company))
        .order_by(Job.created_at.desc())
        .offset(skip)
        .limit(limit)
    ).unique().all()

    return {
        "total": total,
        "skip": skip,
        "limit": limit,
        "jobs": [
            {
                "id": str(job.id),
                "title": job.title,
                "slug": job.slug,
                "company_id": str(job.company_id),
                "company_name": job.company.name,
                "company_verification_status": (
                    job.company.verification_status
                ),
                "status": job.status.value,
                "location": job.location,
                "job_type": job.job_type.value,
                "work_mode": job.work_mode.value,
                "experience_level": job.experience_level.value,
                "created_at": job.created_at.isoformat(),
                "published_at": (
                    job.published_at.isoformat()
                    if job.published_at else None
                ),
            }
            for job in jobs
        ],
    }


@router.get("/jobs/{job_id}")
def get_admin_job_details(
    job_id: UUID,
    current_admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """View complete job information for moderation."""

    job = db.scalar(
        select(Job)
        .options(joinedload(Job.company))
        .where(Job.id == job_id)
    )

    if job is None:
        raise HTTPException(
            status_code=404,
            detail="Job not found.",
        )

    return {
        "id": str(job.id),
        "title": job.title,
        "slug": job.slug,
        "description": job.description,
        "responsibilities": job.responsibilities,
        "requirements": job.requirements,
        "location": job.location,
        "job_type": job.job_type.value,
        "work_mode": job.work_mode.value,
        "experience_level": job.experience_level.value,
        "min_salary": job.min_salary,
        "max_salary": job.max_salary,
        "currency": job.currency,
        "openings": job.openings,
        "status": job.status.value,
        "is_featured": job.is_featured,
        "company": {
            "id": str(job.company.id),
            "name": job.company.name,
            "verification_status": job.company.verification_status,
            "website": job.company.website,
            "headquarters": job.company.headquarters,
        },
        "created_at": job.created_at.isoformat(),
        "published_at": (
            job.published_at.isoformat()
            if job.published_at else None
        ),
        "expires_at": (
            job.expires_at.isoformat()
            if job.expires_at else None
        ),
    }


@router.patch("/jobs/{job_id}/moderation")
def moderate_job(
    job_id: UUID,
    payload: JobModerationUpdate,
    current_admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """Publish, close or archive a job as an administrator."""

    job = db.get(Job, job_id)

    if job is None:
        raise HTTPException(
            status_code=404,
            detail="Job not found.",
        )

    new_status = JobStatus(payload.status)

    if new_status == JobStatus.PUBLISHED:
        company = db.get(Company, job.company_id)

        if (
            company is None
            or company.verification_status != "verified"
        ):
            raise HTTPException(
                status_code=400,
                detail=(
                    "This job cannot be published because "
                    "the company is not verified."
                ),
            )

        if (
            job.expires_at is not None
            and job.expires_at <= datetime.now(timezone.utc)
        ):
            raise HTTPException(
                status_code=400,
                detail="An expired job cannot be published.",
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

    return {
        "message": f"Job successfully {payload.status}.",
        "job_id": str(job.id),
        "title": job.title,
        "status": job.status.value,
    }


# ============================================================
# ADMIN REPORTS DASHBOARD
# ============================================================

@router.get("/reports")
def get_all_reports(
    report_status: Literal[
        "pending",
        "under_review",
        "resolved",
        "dismissed",
    ] | None = Query(default=None, alias="status"),
    search: str | None = Query(default=None),
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=20, ge=1, le=100),
    current_admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """List and filter reported jobs."""

    statement = (
        select(ReportedJob)
        .join(Job, ReportedJob.job_id == Job.id)
        .options(
            joinedload(ReportedJob.job).joinedload(Job.company),
            joinedload(ReportedJob.reported_by_user),
            joinedload(ReportedJob.reviewed_by_user),
        )
    )

    if report_status:
        statement = statement.where(
            ReportedJob.status == ReportStatus(report_status)
        )

    if search:
        search_term = f"%{search.strip()}%"

        statement = statement.where(
            or_(
                Job.title.ilike(search_term),
                ReportedJob.reason.ilike(search_term),
                ReportedJob.description.ilike(search_term),
            )
        )

    total = db.scalar(
        select(func.count()).select_from(
            statement.with_only_columns(
                ReportedJob.id
            ).order_by(None).subquery()
        )
    ) or 0

    reports = db.scalars(
        statement
        .order_by(ReportedJob.created_at.desc())
        .offset(skip)
        .limit(limit)
    ).unique().all()

    return {
        "total": total,
        "skip": skip,
        "limit": limit,
        "reports": [
            {
                "id": str(report.id),
                "job_id": str(report.job_id),
                "job_title": report.job.title,
                "company_name": report.job.company.name,
                "reported_by": report.reported_by_user.email,
                "reason": report.reason,
                "description": report.description,
                "status": report.status.value,
                "reviewed_by": (
                    report.reviewed_by_user.email
                    if report.reviewed_by_user else None
                ),
                "reviewed_at": (
                    report.reviewed_at.isoformat()
                    if report.reviewed_at else None
                ),
                "created_at": report.created_at.isoformat(),
            }
            for report in reports
        ],
    }


@router.get("/reports/summary")
def get_reports_summary(
    current_admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """Return report statistics for the admin dashboard."""

    counts = {
        report_status.value: (
            db.scalar(
                select(func.count())
                .select_from(ReportedJob)
                .where(ReportedJob.status == report_status)
            ) or 0
        )
        for report_status in ReportStatus
    }

    return {
        "total": sum(counts.values()),
        "pending": counts["pending"],
        "under_review": counts["under_review"],
        "resolved": counts["resolved"],
        "dismissed": counts["dismissed"],
    }


@router.get("/reports/{report_id}")
def get_report_details(
    report_id: UUID,
    current_admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """View complete details of an individual report."""

    report = db.scalar(
        select(ReportedJob)
        .options(
            joinedload(ReportedJob.job).joinedload(Job.company),
            joinedload(ReportedJob.reported_by_user),
            joinedload(ReportedJob.reviewed_by_user),
        )
        .where(ReportedJob.id == report_id)
    )

    if report is None:
        raise HTTPException(
            status_code=404,
            detail="Report not found.",
        )

    return {
        "id": str(report.id),
        "reason": report.reason,
        "description": report.description,
        "status": report.status.value,
        "job": {
            "id": str(report.job.id),
            "title": report.job.title,
            "company_id": str(report.job.company_id),
            "company_name": report.job.company.name,
            "job_status": report.job.status.value,
            "location": report.job.location,
        },
        "reported_by": {
            "id": str(report.reported_by_user.id),
            "email": report.reported_by_user.email,
        },
        "reviewed_by": (
            {
                "id": str(report.reviewed_by_user.id),
                "email": report.reviewed_by_user.email,
            }
            if report.reviewed_by_user else None
        ),
        "reviewed_at": (
            report.reviewed_at.isoformat()
            if report.reviewed_at else None
        ),
        "created_at": report.created_at.isoformat(),
        "updated_at": report.updated_at.isoformat(),
    }


@router.patch("/reports/{report_id}/status")
def update_report_status(
    report_id: UUID,
    payload: ReportStatusUpdate,
    current_admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """Review, resolve or dismiss a reported job."""

    report = db.get(ReportedJob, report_id)

    if report is None:
        raise HTTPException(
            status_code=404,
            detail="Report not found.",
        )

    report.status = ReportStatus(payload.status)
    report.reviewed_by_user_id = current_admin.id
    report.reviewed_at = datetime.now(timezone.utc)

    try:
        db.commit()
        db.refresh(report)
    except Exception:
        db.rollback()
        raise

    return {
        "message": f"Report successfully marked as {payload.status}.",
        "report_id": str(report.id),
        "status": report.status.value,
        "reviewed_by_user_id": str(current_admin.id),
        "reviewed_at": report.reviewed_at.isoformat(),
    }
