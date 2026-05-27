from typing import Optional

from pydantic import BaseModel, EmailStr, Field, ConfigDict


# ---------------------------------------------------------------------------
# Request schemas
# ---------------------------------------------------------------------------

class RegisterRequest(BaseModel):
    """Payload for new-user self-registration."""

    full_name: str = Field(
        ...,
        min_length=2,
        max_length=150,
        examples=["Jane Doe"],
    )
    email: EmailStr = Field(..., examples=["jane@example.com"])
    phone: str = Field(
        ...,
        max_length=20,
        pattern=r"^\+?[0-9\s\-()]{7,20}$",
        examples=["+1-800-555-0199"],
    )
    date_of_birth: Optional[str] = Field(None, examples=["10/14/1982"])
    voter_id: Optional[str] = Field(None, examples=["VTR-990-221-X8"])
    designation: str = Field(..., min_length=2, max_length=100, examples=["Vice President"])
    street_address: str = Field(..., min_length=3, max_length=300, examples=["12 Park Street"])
    city: str = Field(..., min_length=2, max_length=100, examples=["Mumbai"])
    district: str = Field(..., min_length=2, max_length=100, examples=["Maharashtra"])
    state: str = Field(..., min_length=2, max_length=100, examples=["Maharashtra"])
    country: str = Field(..., min_length=2, max_length=100, examples=["India"])
    pincode: str = Field(..., min_length=3, max_length=20, examples=["400001"])
    password: str = Field(
        ...,
        min_length=8,
        max_length=128,
        examples=["Str0ng!Pass"],
    )
    tenant_id: Optional[int] = Field(
        default=None,
        description="ID of the tenant organisation this user is registering under.",
        examples=[1],
    )

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


# ---------------------------------------------------------------------------
# Response schemas
# ---------------------------------------------------------------------------

class AuthUserInfo(BaseModel):
    """Minimal user information embedded in the token response."""

    id: int
    full_name: str
    email: EmailStr
    role: str
    is_verified: bool
    tenant_id: Optional[int] = None
    designation: Optional[str] = None
    district: Optional[str] = None

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
