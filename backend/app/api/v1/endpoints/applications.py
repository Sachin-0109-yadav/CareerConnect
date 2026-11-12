
from uuid import UUID

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.dependencies.auth import get_current_user
from app.models.user import User
from app.schemas.application import (
    ApplicationStatusUpdate,
    CandidateApplicationResponse,
    JobApplicationCreate,
    JobApplicationResponse,
    RecruiterApplicationResponse,
)
from app.services.application_service import (
    apply_for_job,
    get_candidate_applications,
    get_job_applicants,
    update_application_status,
)

router = APIRouter()


@router.post(
    "/jobs/{job_id}/apply",
    response_model=JobApplicationResponse,
    status_code=status.HTTP_201_CREATED,
)
def apply_to_job(
    job_id: UUID,
    payload: JobApplicationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return apply_for_job(
        db=db,
        job_id=job_id,
        user=current_user,
        resume_id=payload.resume_id,
        cover_letter=payload.cover_letter,
    )


@router.get(
    "/my",
    response_model=list[CandidateApplicationResponse],
)
def my_applications(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return get_candidate_applications(db, current_user)


@router.get(
    "/jobs/{job_id}/applicants",
    response_model=list[RecruiterApplicationResponse],
)
def job_applicants(
    job_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return get_job_applicants(db, job_id, current_user)


@router.patch(
    "/{application_id}/status",
    response_model=JobApplicationResponse,
)
def change_application_status(
    application_id: UUID,
    payload: ApplicationStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return update_application_status(
        db=db,
        application_id=application_id,
        user=current_user,
        new_status=payload.status,
        note=payload.note,
    )
