
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.dependencies.auth import get_current_user
from app.models.user import User
from app.models.enums import UserRole

from app.schemas.profile import (
    CandidateProfileUpdate,
    CandidateProfileResponse,
    RecruiterProfileUpdate,
    RecruiterProfileResponse,
)

from app.services.profile_service import (
    get_candidate_profile,
    update_candidate_profile,
    get_recruiter_profile,
    update_recruiter_profile,
)


router = APIRouter()


# =====================================
# Candidate Profile Endpoints
# =====================================

def require_candidate(user: User):
    if user.role != UserRole.CANDIDATE:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only candidates can access this endpoint.",
        )


@router.get(
    "/candidate/me",
    response_model=CandidateProfileResponse,
)
def read_candidate_profile(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    require_candidate(current_user)

    return get_candidate_profile(db, current_user)


@router.put(
    "/candidate/me",
    response_model=CandidateProfileResponse,
)
def save_candidate_profile(
    profile_data: CandidateProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    require_candidate(current_user)

    return update_candidate_profile(
        db,
        current_user,
        profile_data,
    )


# =====================================
# Recruiter Profile Endpoints
# =====================================

def require_recruiter(user: User):
    if user.role != UserRole.RECRUITER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only recruiters can access this endpoint.",
        )


@router.get(
    "/recruiter/me",
    response_model=RecruiterProfileResponse,
)
def read_recruiter_profile(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    require_recruiter(current_user)

    return get_recruiter_profile(db, current_user)


@router.put(
    "/recruiter/me",
    response_model=RecruiterProfileResponse,
)
def save_recruiter_profile(
    profile_data: RecruiterProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    require_recruiter(current_user)

    return update_recruiter_profile(
        db,
        current_user,
        profile_data,
    )
