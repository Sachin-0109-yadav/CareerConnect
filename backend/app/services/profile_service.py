
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.candidate_profile import CandidateProfile
from app.models.recruiter_profile import RecruiterProfile
from app.models.user import User

from app.schemas.profile import (
    CandidateProfileUpdate,
    RecruiterProfileUpdate,
)


# =====================================
# Candidate Profile Services
# =====================================

def get_candidate_profile(
    db: Session,
    user: User,
) -> CandidateProfile:

    profile = db.query(CandidateProfile).filter(
        CandidateProfile.user_id == user.id
    ).first()

    if profile is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Candidate profile not found.",
        )

    return profile


def update_candidate_profile(
    db: Session,
    user: User,
    profile_data: CandidateProfileUpdate,
) -> CandidateProfile:

    profile = db.query(CandidateProfile).filter(
        CandidateProfile.user_id == user.id
    ).first()

    if profile is None:
        profile = CandidateProfile(user_id=user.id)
        db.add(profile)

    update_data = profile_data.model_dump(exclude_unset=True)

    for field, value in update_data.items():
        setattr(profile, field, value)

    db.commit()
    db.refresh(profile)

    return profile


# =====================================
# Recruiter Profile Services
# =====================================

def get_recruiter_profile(
    db: Session,
    user: User,
) -> RecruiterProfile:

    profile = db.query(RecruiterProfile).filter(
        RecruiterProfile.user_id == user.id
    ).first()

    if profile is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Recruiter profile not found.",
        )

    return profile


def update_recruiter_profile(
    db: Session,
    user: User,
    profile_data: RecruiterProfileUpdate,
) -> RecruiterProfile:

    profile = db.query(RecruiterProfile).filter(
        RecruiterProfile.user_id == user.id
    ).first()

    if profile is None:
        profile = RecruiterProfile(user_id=user.id)
        db.add(profile)

    update_data = profile_data.model_dump(exclude_unset=True)

    for field, value in update_data.items():
        setattr(profile, field, value)

    db.commit()
    db.refresh(profile)

    return profile
