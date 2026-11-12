
from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.models.enums import CompanyMemberRole


class CompanyMemberCreate(BaseModel):
    email: str = Field(min_length=5, max_length=255)


class CompanyMemberRoleUpdate(BaseModel):
    role: CompanyMemberRole


class CompanyMemberResponse(BaseModel):
    id: UUID
    company_id: UUID
    user_id: UUID
    role: CompanyMemberRole
    is_active: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
