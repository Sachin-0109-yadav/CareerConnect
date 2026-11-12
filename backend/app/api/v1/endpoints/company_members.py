
from uuid import UUID

from fastapi import APIRouter, Depends, Response, status
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.dependencies.auth import get_current_user
from app.models.user import User

from app.schemas.company_member import (
    CompanyMemberCreate,
    CompanyMemberRoleUpdate,
    CompanyMemberResponse,
)

from app.services.company_member_service import (
    add_company_member,
    list_company_members,
    update_company_member_role,
    deactivate_company_member,
)


router = APIRouter()


@router.post(
    "/{company_id}/members",
    response_model=CompanyMemberResponse,
    status_code=status.HTTP_201_CREATED,
)
def add_member(
    company_id: UUID,
    member_data: CompanyMemberCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return add_company_member(
        db,
        company_id,
        current_user,
        member_data,
    )


@router.get(
    "/{company_id}/members",
    response_model=list[CompanyMemberResponse],
)
def get_members(
    company_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return list_company_members(
        db,
        company_id,
        current_user,
    )


@router.patch(
    "/{company_id}/members/{member_id}",
    response_model=CompanyMemberResponse,
)
def change_member_role(
    company_id: UUID,
    member_id: UUID,
    role_data: CompanyMemberRoleUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return update_company_member_role(
        db,
        company_id,
        member_id,
        current_user,
        role_data,
    )


@router.delete(
    "/{company_id}/members/{member_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def remove_member(
    company_id: UUID,
    member_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    deactivate_company_member(
        db,
        company_id,
        member_id,
        current_user,
    )

    return Response(status_code=status.HTTP_204_NO_CONTENT)
