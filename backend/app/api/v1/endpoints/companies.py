
from uuid import UUID

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.dependencies.auth import get_current_user
from app.models.user import User

from app.schemas.company import (
    CompanyCreate,
    CompanyUpdate,
    CompanyResponse,
)

from app.services.company_service import (
    create_company,
    get_my_companies,
    get_company_by_id,
    update_company,
)


router = APIRouter()


@router.post(
    "/",
    response_model=CompanyResponse,
    status_code=status.HTTP_201_CREATED,
)
def register_company(
    company_data: CompanyCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return create_company(
        db,
        current_user,
        company_data,
    )


@router.get(
    "/my",
    response_model=list[CompanyResponse],
)
def read_my_companies(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return get_my_companies(
        db,
        current_user,
    )


@router.get(
    "/{company_id}",
    response_model=CompanyResponse,
)
def read_company(
    company_id: UUID,
    db: Session = Depends(get_db),
):
    return get_company_by_id(
        db,
        company_id,
    )


@router.put(
    "/{company_id}",
    response_model=CompanyResponse,
)
def edit_company(
    company_id: UUID,
    company_data: CompanyUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return update_company(
        db,
        current_user,
        company_id,
        company_data,
    )
