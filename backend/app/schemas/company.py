
from datetime import datetime
from uuid import UUID

from pydantic import (
    BaseModel,
    ConfigDict,
    Field,
    HttpUrl,
    field_validator,
)


# =====================================
# Company Creation Schema
# =====================================

class CompanyCreate(BaseModel):
    name: str = Field(min_length=2, max_length=200)

    description: str | None = None

    website: HttpUrl | None = None

    logo_url: HttpUrl | None = None

    industry: str | None = Field(
        default=None,
        max_length=150,
    )

    company_size: str | None = Field(
        default=None,
        max_length=50,
    )

    headquarters: str | None = Field(
        default=None,
        max_length=200,
    )

    @field_validator("name")
    @classmethod
    def validate_name(cls, value: str) -> str:
        value = value.strip()

        if len(value) < 2:
            raise ValueError("Company name must contain at least 2 characters.")

        return value


# =====================================
# Company Update Schema
# =====================================

class CompanyUpdate(BaseModel):
    name: str | None = Field(
        default=None,
        min_length=2,
        max_length=200,
    )

    description: str | None = None

    website: HttpUrl | None = None

    logo_url: HttpUrl | None = None

    industry: str | None = Field(
        default=None,
        max_length=150,
    )

    company_size: str | None = Field(
        default=None,
        max_length=50,
    )

    headquarters: str | None = Field(
        default=None,
        max_length=200,
    )

    @field_validator("name")
    @classmethod
    def validate_name(cls, value: str | None) -> str | None:
        if value is None:
            return value

        value = value.strip()

        if len(value) < 2:
            raise ValueError("Company name must contain at least 2 characters.")

        return value


# =====================================
# Company Response Schema
# =====================================

class CompanyResponse(BaseModel):
    id: UUID
    name: str
    slug: str
    description: str | None
    website: str | None
    logo_url: str | None
    industry: str | None
    company_size: str | None
    headquarters: str | None
    created_by_user_id: UUID
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
