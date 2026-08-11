from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class TenantCreate(BaseModel):
    """Payload for creating a new tenant and its first admin user."""

    # Tenant fields
    name: str = Field(..., min_length=1, max_length=255)
    slug: Optional[str] = Field(
        None,
        max_length=100,
        description="URL-safe identifier; auto-generated from name if omitted.",
    )
    contact_email: Optional[EmailStr] = None
    contact_phone: Optional[str] = Field(None, max_length=20)
    status: str = Field(default="draft")
    plan: str = Field(default="starter")
    logo_url: Optional[str] = Field(None, max_length=500)

    # First admin user fields
    admin_full_name: str = Field(..., min_length=1, max_length=150)
    admin_email: EmailStr
    admin_password: str = Field(..., min_length=8)


class TenantUpdate(BaseModel):
    """Payload for updating mutable tenant properties."""

    name: Optional[str] = Field(None, min_length=1, max_length=255)
    domain: Optional[str] = Field(None, max_length=255)
    logo_url: Optional[str] = Field(None, max_length=500)
    contact_email: Optional[EmailStr] = None
    contact_phone: Optional[str] = Field(None, max_length=20)
    plan: Optional[str] = Field(None, description="Subscription plan tier.")
    status: Optional[str] = Field(None, description="Lifecycle status: draft, active, suspended, cancelled.")
    
    # Optional Razorpay updates via main update schema
    razorpay_key_id: Optional[str] = None
    razorpay_key_secret: Optional[str] = None


class TenantPaymentSettings(BaseModel):
    """Surgical update schema for payment credentials."""

    razorpay_key_id: str = Field(..., min_length=1)
    razorpay_key_secret: str = Field(..., min_length=1)


class TenantResponse(BaseModel):
    """Serialised tenant returned to API consumers."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    slug: str
    domain: Optional[str] = None
    logo_url: Optional[str] = None
    primary_color: str
    status: str
    plan: str
    max_elections: int
    max_voters: int
    contact_email: Optional[str] = None
    contact_phone: Optional[str] = None
    
    # Razorpay settings (Included in response for admin management)
    razorpay_key_id: Optional[str] = None
    razorpay_key_secret: Optional[str] = None

    created_by: Optional[int] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    # Computed / annotated counts — populated by the service layer
    user_count: int = 0
    election_count: int = 0


class TenantListResponse(BaseModel):
    """Paginated list of tenants."""

    tenants: List[TenantResponse]
    total: int


class TenantStatusUpdate(BaseModel):
    """Payload for changing the lifecycle status of a tenant."""

    status: str
    reason: Optional[str] = None


class TenantPublicResponse(BaseModel):
    """Minimal tenant info for public selection (e.g. registration)."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    uuid: Optional[str] = None
    logo_url: Optional[str] = None
