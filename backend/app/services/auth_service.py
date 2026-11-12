from datetime import datetime, timezone

from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.security import (
    hash_password,
    verify_password,
    create_access_token,
)
from app.models.user import User
from app.models.enums import UserRole
from app.schemas.auth import (
    UserRegister,
    UserLogin,
    UserPublic,
    Token,
    AuthResponse,
)


# -----------------------------
# User Registration
# -----------------------------

def register_user(
    db: Session,
    user_data: UserRegister,
) -> AuthResponse:
    """Register a new candidate or recruiter."""

    normalized_email = str(user_data.email).strip().lower()

    # Check whether email already exists.
    existing_user = db.scalar(
        select(User).where(
            func.lower(User.email) == normalized_email
        )
    )

    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email already exists.",
        )

    # Create new user.
    new_user = User(
        email=normalized_email,
        hashed_password=hash_password(user_data.password),
        role=UserRole(user_data.role),
        is_active=True,
        is_verified=False,
    )

    try:
        db.add(new_user)
        db.commit()
        db.refresh(new_user)

    except IntegrityError:
        db.rollback()

        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email already exists.",
        )

    # Generate access token.
    access_token = create_access_token(
        subject=str(new_user.id)
    )

    return AuthResponse(
        user=UserPublic.model_validate(new_user),
        token=Token(
            access_token=access_token,
            token_type="bearer",
        ),
    )


# -----------------------------
# User Login
# -----------------------------

def login_user(
    db: Session,
    login_data: UserLogin,
) -> AuthResponse:
    """Authenticate a user and generate an access token."""

    normalized_email = str(login_data.email).strip().lower()

    user = db.scalar(
        select(User).where(
            func.lower(User.email) == normalized_email
        )
    )

    # Use a generic error for invalid email or password.
    if user is None or not verify_password(
        login_data.password,
        user.hashed_password,
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Reject inactive accounts.
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your account is inactive.",
        )

    # Update last login timestamp.
    user.last_login_at = datetime.now(timezone.utc)

    db.commit()
    db.refresh(user)

    # Generate JWT access token.
    access_token = create_access_token(
        subject=str(user.id)
    )

    return AuthResponse(
        user=UserPublic.model_validate(user),
        token=Token(
            access_token=access_token,
            token_type="bearer",
        ),
    )
