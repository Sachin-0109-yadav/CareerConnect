
from uuid import UUID

from fastapi import (
    APIRouter,
    Depends,
    Query,
    Response,
    status,
)
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.dependencies.auth import get_current_user
from app.models.user import User
from app.models.job import Job

from app.schemas.job import (
    JobCreate,
    JobUpdate,
    JobStatusUpdate,
    JobResponse,
    PublicJobDetailResponse,
)

from app.services.job_service import (
    create_job,
    get_company_jobs,
    get_job_for_edit,
    update_job,
    update_job_status,
    delete_job,
    search_public_jobs,
    get_public_job_details,
)


router = APIRouter()


# ============================================================
# CREATE COMPANY JOB
# ============================================================

@router.post(
    "/companies/{company_id}/jobs",
    response_model=JobResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_company_job(
    company_id: UUID,
    job_data: JobCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return create_job(
        db,
        company_id,
        current_user,
        job_data,
    )


# ============================================================
# GET COMPANY JOBS
# ============================================================

@router.get(
    "/companies/{company_id}/jobs",
    response_model=list[JobResponse],
)
def list_company_jobs(
    company_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return get_company_jobs(
        db,
        company_id,
        current_user,
    )


# ============================================================
# GET JOB FOR RECRUITER EDITING
# ============================================================

@router.get(
    "/jobs/{job_id}/manage",
)
def get_managed_job(
    job_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return get_job_for_edit(
        db,
        job_id,
        current_user,
    )


# ============================================================
# UPDATE JOB
# ============================================================

@router.put(
    "/jobs/{job_id}",
    response_model=JobResponse,
)
def edit_job(
    job_id: UUID,
    job_data: JobUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return update_job(
        db,
        job_id,
        current_user,
        job_data,
    )


# ============================================================
# UPDATE JOB STATUS
# ============================================================

@router.patch(
    "/jobs/{job_id}/status",
    response_model=JobResponse,
)
def change_job_status(
    job_id: UUID,
    status_data: JobStatusUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return update_job_status(
        db,
        job_id,
        current_user,
        status_data.status,
    )


# ============================================================
# DELETE JOB
# ============================================================

@router.delete(
    "/jobs/{job_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def remove_job(
    job_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    delete_job(
        db,
        job_id,
        current_user,
    )

    return Response(
        status_code=status.HTTP_204_NO_CONTENT
    )


# ============================================================
# PUBLIC JOB SEARCH
# ============================================================

@router.get("/jobs/search")
def public_job_search(
    keyword: str | None = Query(
        default=None,
        max_length=200,
    ),
    location: str | None = Query(
        default=None,
        max_length=200,
    ),
    job_type: str | None = None,
    work_mode: str | None = None,
    experience_level: str | None = None,
    category_id: UUID | None = None,
    min_salary: int | None = Query(
        default=None,
        ge=0,
    ),
    max_salary: int | None = Query(
        default=None,
        ge=0,
    ),
    page: int = Query(
        default=1,
        ge=1,
    ),
    page_size: int = Query(
        default=10,
        ge=1,
        le=100,
    ),
    sort_by: str = Query(
        default="latest",
        pattern="^(latest|oldest|salary_high|salary_low)$",
    ),
    db: Session = Depends(get_db),
):
    return search_public_jobs(
        db=db,
        keyword=keyword,
        location=location,
        job_type=job_type,
        work_mode=work_mode,
        experience_level=experience_level,
        category_id=category_id,
        min_salary=min_salary,
        max_salary=max_salary,
        page=page,
        page_size=page_size,
        sort_by=sort_by,
    )


# ============================================================
# PUBLIC JOB DETAILS
# ============================================================

@router.get(
    "/jobs/{job_id}",
    response_model=PublicJobDetailResponse,
)
def public_job_details(
    job_id: UUID,
    db: Session = Depends(get_db),
):
    return get_public_job_details(
        db=db,
        job_id=job_id,
    )
