from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.dependencies.auth import get_current_user
from app.models.user import User
from app.schemas.auth import (
    UserRegister,
    UserLogin,
    UserPublic,
    AuthResponse,
)
from app.services.auth_service import (
    register_user,
    login_user,
)


router = APIRouter()


# -----------------------------
# User Registration
# -----------------------------

@router.post(
    "/register",
    response_model=AuthResponse,
    status_code=201,
)
def register(
    user_data: UserRegister,
    db: Session = Depends(get_db),
):
    return register_user(db, user_data)


# -----------------------------
# User Login
# -----------------------------

@router.post(
    "/login",
    response_model=AuthResponse,
)
def login(
    login_data: UserLogin,
    db: Session = Depends(get_db),
):
    return login_user(db, login_data)


# -----------------------------
# Current Logged-in User
# -----------------------------

@router.get(
    "/me",
    response_model=UserPublic,
)
def get_me(
    current_user: User = Depends(get_current_user),
):
    return current_user