
from datetime import datetime, timezone
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, joinedload

from app.models.application_status_history import ApplicationStatusHistory
from app.models.candidate_profile import CandidateProfile
from app.models.company import Company
from app.models.company_member import CompanyMember
from app.models.enums import (
    ApplicationStatus,
    JobStatus,
    UserRole,
)
from app.models.job import Job
from app.models.job_application import JobApplication
from app.models.resume import Resume
from app.models.user import User


def _require_candidate_profile(db: Session, user: User):
    profile = db.scalar(
        select(CandidateProfile).where(
            CandidateProfile.user_id == user.id
        )
    )

    if profile is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Complete your candidate profile before applying.",
        )

    return profile


def apply_for_job(
    db: Session,
    job_id: UUID,
    user: User,
    resume_id: UUID | None = None,
    cover_letter: str | None = None,
):
    if user.role != UserRole.CANDIDATE:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only candidates can apply for jobs.",
        )

    profile = _require_candidate_profile(db, user)

    job = db.get(Job, job_id)

    if job is None or job.status != JobStatus.PUBLISHED:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Published job not found.",
        )

    if job.expires_at is not None:
        now = datetime.now(timezone.utc)
        expiry = job.expires_at

        if expiry.tzinfo is None:
            expiry = expiry.replace(tzinfo=timezone.utc)

        if expiry <= now:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="This job application period has ended.",
            )

    existing = db.scalar(
        select(JobApplication).where(
            JobApplication.candidate_profile_id == profile.id,
            JobApplication.job_id == job.id,
        )
    )

    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="You have already applied for this job.",
        )

    if resume_id is not None:
        resume = db.scalar(
            select(Resume).where(
                Resume.id == resume_id,
                Resume.candidate_profile_id == profile.id,
            )
        )

        if resume is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Resume not found in your profile.",
            )

    application = JobApplication(
        candidate_profile_id=profile.id,
        job_id=job.id,
        resume_id=resume_id,
        cover_letter=cover_letter,
        status=ApplicationStatus.APPLIED,
    )

    db.add(application)
    db.flush()

    history = ApplicationStatusHistory(
        application_id=application.id,
        previous_status=None,
        new_status=ApplicationStatus.APPLIED,
        changed_by_user_id=user.id,
        note="Application submitted",
    )

    db.add(history)

    try:
        db.commit()
        db.refresh(application)
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="You have already applied for this job.",
        )

    return application


def get_candidate_applications(db: Session, user: User):
    if user.role != UserRole.CANDIDATE:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only candidates can view their applications.",
        )

    profile = _require_candidate_profile(db, user)

    applications = db.scalars(
        select(JobApplication)
        .options(
            joinedload(JobApplication.job).joinedload(Job.company)
        )
        .where(
            JobApplication.candidate_profile_id == profile.id
        )
        .order_by(JobApplication.applied_at.desc())
    ).unique().all()

    return [
        {
            "id": application.id,
            "candidate_profile_id": application.candidate_profile_id,
            "job_id": application.job_id,
            "resume_id": application.resume_id,
            "cover_letter": application.cover_letter,
            "status": application.status,
            "applied_at": application.applied_at,
            "job_title": application.job.title,
            "company_name": application.job.company.name,
            "job_location": application.job.location,
        }
        for application in applications
    ]


def _get_recruiter_job_access(
    db: Session,
    job: Job,
    user: User,
):
    if user.role != UserRole.RECRUITER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only recruiters can access applicants.",
        )

    membership = db.scalar(
        select(CompanyMember).where(
            CompanyMember.company_id == job.company_id,
            CompanyMember.user_id == user.id,
            CompanyMember.is_active.is_(True),
        )
    )

    if membership is None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not an active member of this company.",
        )

    if (
        membership.role not in ("owner", "admin")
        and job.posted_by_user_id != user.id
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only manage applicants for jobs you posted.",
        )


def get_job_applicants(
    db: Session,
    job_id: UUID,
    user: User,
):
    job = db.get(Job, job_id)

    if job is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job not found.",
        )

    _get_recruiter_job_access(db, job, user)

    applications = db.scalars(
        select(JobApplication)
        .options(
            joinedload(JobApplication.candidate_profile).joinedload(
                CandidateProfile.user
            ),
            joinedload(JobApplication.resume),
            joinedload(JobApplication.status_history),
        )
        .where(JobApplication.job_id == job_id)
        .order_by(JobApplication.applied_at.desc())
    ).unique().all()

    return [
        {
            "id": application.id,
            "candidate_profile_id": application.candidate_profile_id,
            "job_id": application.job_id,
            "resume_id": application.resume_id,
            "cover_letter": application.cover_letter,
            "status": application.status,
            "applied_at": application.applied_at,
            "candidate_name": application.candidate_profile.full_name,
            "candidate_email": application.candidate_profile.user.email,
            "candidate_location": application.candidate_profile.location,
            "resume_filename": (
                application.resume.original_filename
                if application.resume
                else None
            ),
            "status_history": application.status_history,
        }
        for application in applications
    ]


def update_application_status(
    db: Session,
    application_id: UUID,
    user: User,
    new_status: ApplicationStatus,
    note: str | None = None,
):
    if new_status == ApplicationStatus.WITHDRAWN:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Recruiters cannot set an application to withdrawn.",
        )

    application = db.scalar(
        select(JobApplication)
        .options(joinedload(JobApplication.job))
        .where(JobApplication.id == application_id)
    )

    if application is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Application not found.",
        )

    _get_recruiter_job_access(db, application.job, user)

    previous_status = application.status

    if previous_status == new_status:
        return application

    application.status = new_status

    history = ApplicationStatusHistory(
        application_id=application.id,
        previous_status=previous_status,
        new_status=new_status,
        changed_by_user_id=user.id,
        note=note,
    )

    db.add(history)
    db.commit()
    db.refresh(application)

    return application
