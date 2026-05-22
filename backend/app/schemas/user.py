from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, ConfigDict, EmailStr, Field

from app.models.user import UserRole, UserStatus


# ---------------------------------------------------------------------------
# Base (shared fields)
# ---------------------------------------------------------------------------

class UserBase(BaseModel):
    """Fields common to create, update, and response schemas."""

    full_name: str = Field(..., min_length=2, max_length=150, examples=["Jane Doe"])
    email: EmailStr = Field(..., examples=["jane@example.com"])
    phone: Optional[str] = Field(
        default=None,
        max_length=20,
        examples=["+1-800-555-0199"],
    )

    model_config = ConfigDict(from_attributes=True)


# ---------------------------------------------------------------------------
# Create / Update
# ---------------------------------------------------------------------------

class UserCreate(UserBase):
    """Payload accepted when an admin creates a user directly."""

    password: str = Field(..., min_length=8, max_length=128, examples=["Str0ng!Pass"])
    role: UserRole = Field(default=UserRole.voter)


class UserUpdate(BaseModel):
    """All fields are optional – only supplied values are patched."""

    full_name: Optional[str] = Field(default=None, min_length=2, max_length=150)
    phone: Optional[str] = Field(default=None, max_length=20)
    role: Optional[UserRole] = None
    status: Optional[UserStatus] = None

    model_config = ConfigDict(from_attributes=True)


class ChangePasswordRequest(BaseModel):
    """Payload for the change-password endpoint."""

    current_password: str = Field(..., min_length=1, examples=["OldPass123!"])
    new_password: str = Field(..., min_length=8, max_length=128, examples=["N3wStr0ng!"])

    model_config = ConfigDict(from_attributes=True)


# ---------------------------------------------------------------------------
# Response
# ---------------------------------------------------------------------------

class UserResponse(UserBase):
    """Full user record returned by the API."""

    id: int
    role: UserRole
    status: UserStatus
    is_verified: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class UserListResponse(BaseModel):
    """Paginated list of users."""

    total: int
    page: int
    page_size: int
    items: List[UserResponse]

    model_config = ConfigDict(from_attributes=True)
