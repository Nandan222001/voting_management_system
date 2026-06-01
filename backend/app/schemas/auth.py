from typing import Optional

from pydantic import BaseModel, EmailStr, Field, ConfigDict
from app.schemas.plan import PlanResponse


# ---------------------------------------------------------------------------
# Request schemas
# ---------------------------------------------------------------------------

class RegisterRequest(BaseModel):
    """Payload for new-user self-registration."""

    full_name: str = Field(..., min_length=2, max_length=150)
    email: EmailStr
    phone: str = Field(..., max_length=20)
    date_of_birth: Optional[str] = None
    gender: Optional[str] = None
    parent_name: Optional[str] = None
    password: str = Field(..., min_length=8, max_length=128)
    
    # KYC
    kyc_type: Optional[str] = None
    kyc_front_url: Optional[str] = None
    kyc_back_url: Optional[str] = None

    # Address (Permanent)
    house_number: Optional[str] = None
    street_address: Optional[str] = None
    village: Optional[str] = None
    landmark: Optional[str] = None
    pincode: Optional[str] = None
    city: Optional[str] = None
    taluka: Optional[str] = None
    district: Optional[str] = None
    state: Optional[str] = None
    country: str = "India"

    # Current Address
    current_street_address: Optional[str] = None
    current_city: Optional[str] = None
    current_district: Optional[str] = None
    current_state: Optional[str] = None
    current_pincode: Optional[str] = None

    # Mapping
    tenant_id: Optional[int] = None
    target_id: Optional[int] = None
    committee_id: Optional[int] = None
    membership_plan_id: Optional[int] = None
    designation: str = "voter"
    voter_id: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class LoginRequest(BaseModel):
    """Credentials submitted to the login endpoint."""

    email: EmailStr = Field(..., examples=["jane@example.com"])
    password: str = Field(..., min_length=1, examples=["Str0ng!Pass"])

    model_config = ConfigDict(from_attributes=True)


class OTPVerifyRequest(BaseModel):
    """One-time password submitted during email verification or 2-FA."""

    email: EmailStr = Field(..., examples=["jane@example.com"])
    otp_code: str = Field(..., min_length=4, max_length=10, examples=["123456"])

    model_config = ConfigDict(from_attributes=True)


class ForgotPasswordRequest(BaseModel):
    """Payload to request a password reset OTP."""

    email: EmailStr = Field(..., examples=["jane@example.com"])


class ResetPasswordRequest(BaseModel):
    """Payload to reset password using an OTP."""

    email: EmailStr = Field(..., examples=["jane@example.com"])
    otp_code: str = Field(..., min_length=4, max_length=10, examples=["123456"])
    new_password: str = Field(..., min_length=8, max_length=128, examples=["NewStr0ng!Pass"])


# ---------------------------------------------------------------------------
# Response schemas
# ---------------------------------------------------------------------------

class AuthUserInfo(BaseModel):
    """User information embedded in the token response for profile sync."""

    id: int
    full_name: str
    email: EmailStr
    phone: Optional[str] = None
    role: str
    status: str = "active"
    is_verified: bool
    tenant_id: Optional[int] = None
    
    # Profile Details
    date_of_birth: Optional[str] = None
    gender: Optional[str] = None
    parent_name: Optional[str] = None
    voter_id: Optional[str] = None
    designation: Optional[str] = None
    
    # KYC Details
    kyc_type: Optional[str] = None
    kyc_front_url: Optional[str] = None
    kyc_back_url: Optional[str] = None

    # Address Information (Permanent)
    house_number: Optional[str] = None
    street_address: Optional[str] = None
    village: Optional[str] = None
    landmark: Optional[str] = None
    pincode: Optional[str] = None
    city: Optional[str] = None
    taluka: Optional[str] = None
    district: Optional[str] = None
    state: Optional[str] = None
    country: Optional[str] = "India"

    # Current Address
    current_street_address: Optional[str] = None
    current_city: Optional[str] = None
    current_district: Optional[str] = None
    current_state: Optional[str] = None
    current_pincode: Optional[str] = None

    # Mapping
    target_id: Optional[int] = None
    committee_id: Optional[int] = None
    membership_plan_id: Optional[int] = None
    membership_plan: Optional[PlanResponse] = None

    model_config = ConfigDict(from_attributes=True)


class TokenResponse(BaseModel):
    """Returned by login / token-refresh endpoints."""

    access_token: str
    token_type: str = "bearer"
    user: AuthUserInfo

    model_config = ConfigDict(from_attributes=True)


class MessageResponse(BaseModel):
    """Generic acknowledgement / informational message."""

    message: str

    model_config = ConfigDict(from_attributes=True)
