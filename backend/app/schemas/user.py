from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, ConfigDict, EmailStr, Field

from app.models.user import UserRole, UserStatus
from app.schemas.target import TargetResponse


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
    date_of_birth: Optional[str] = None
    gender: Optional[str] = None
    parent_name: Optional[str] = None
    voter_id: Optional[str] = None
    designation: Optional[str] = Field(default=None, max_length=100, examples=["Secretary"])
    
    # KYC
    kyc_type: Optional[str] = None
    kyc_front_url: Optional[str] = None
    kyc_back_url: Optional[str] = None

    # Address
    house_number: Optional[str] = None
    street_address: Optional[str] = Field(default=None, max_length=300)
    village: Optional[str] = None
    landmark: Optional[str] = None
    city: Optional[str] = Field(default=None, max_length=100)
    taluka: Optional[str] = None
    district: Optional[str] = Field(default=None, max_length=100)
    state: Optional[str] = Field(default=None, max_length=100)
    country: Optional[str] = Field(default="India", max_length=100)
    pincode: Optional[str] = Field(default=None, max_length=20)

    # Current Address
    current_street_address: Optional[str] = None
    current_city: Optional[str] = None
    current_district: Optional[str] = None
    current_state: Optional[str] = None
    current_pincode: Optional[str] = None

    target_id: Optional[int] = Field(default=None, examples=[1])
    committee_id: Optional[int] = None
    membership_plan_id: Optional[int] = None

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
    date_of_birth: Optional[str] = None
    gender: Optional[str] = None
    parent_name: Optional[str] = None
    voter_id: Optional[str] = None
    designation: Optional[str] = Field(default=None, min_length=2, max_length=100)
    
    kyc_type: Optional[str] = None
    kyc_front_url: Optional[str] = None
    kyc_back_url: Optional[str] = None

    street_address: Optional[str] = Field(default=None, min_length=3, max_length=300)
    city: Optional[str] = Field(default=None, min_length=2, max_length=100)
    district: Optional[str] = Field(default=None, min_length=2, max_length=100)
    state: Optional[str] = Field(default=None, min_length=2, max_length=100)
    country: Optional[str] = Field(default=None, min_length=2, max_length=100)
    pincode: Optional[str] = Field(default=None, min_length=3, max_length=20)
    
    target_id: Optional[int] = None
    committee_id: Optional[int] = None
    membership_plan_id: Optional[int] = None
    
    role: Optional[UserRole] = None
    status: Optional[UserStatus] = None

    model_config = ConfigDict(from_attributes=True)


class UserSettingsUpdate(BaseModel):
    """Fields a signed-in user may update from their own settings page."""

    full_name: Optional[str] = Field(default=None, min_length=2, max_length=150)
    phone: Optional[str] = Field(default=None, max_length=20)
    date_of_birth: Optional[str] = None
    gender: Optional[str] = None
    parent_name: Optional[str] = None
    
    # Address
    house_number: Optional[str] = None
    street_address: Optional[str] = Field(default=None, max_length=300)
    village: Optional[str] = None
    landmark: Optional[str] = None
    city: Optional[str] = None
    taluka: Optional[str] = None
    district: Optional[str] = None
    state: Optional[str] = None
    pincode: Optional[str] = None

    # Current Address
    current_street_address: Optional[str] = None
    current_city: Optional[str] = None
    current_district: Optional[str] = None
    current_state: Optional[str] = None
    current_pincode: Optional[str] = None

    target_id: Optional[int] = None
    committee_id: Optional[int] = None
    membership_plan_id: Optional[int] = None

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
    tenant_id: Optional[int] = None
    target: Optional[TargetResponse] = None
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
