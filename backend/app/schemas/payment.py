from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, ConfigDict, Field

from app.models.payment import PaymentStatus


# ---------------------------------------------------------------------------
# Base
# ---------------------------------------------------------------------------

class PaymentBase(BaseModel):
    """Fields shared across payment schemas."""

    amount: float = Field(..., gt=0)
    currency: str = Field(default="INR", min_length=3, max_length=3)
    description: Optional[str] = Field(default=None, max_length=255)
    
    model_config = ConfigDict(from_attributes=True)


# ---------------------------------------------------------------------------
# Create / Update
# ---------------------------------------------------------------------------

class PaymentCreate(PaymentBase):
    """Payload for creating a new payment record."""
    
    user_id: Optional[int] = None
    razorpay_order_id: Optional[str] = None


class PaymentUpdate(BaseModel):
    """Payload for updating an existing payment (e.g. after capture)."""

    status: Optional[PaymentStatus] = None
    razorpay_payment_id: Optional[str] = None
    razorpay_signature: Optional[str] = None


# ---------------------------------------------------------------------------
# Response
# ---------------------------------------------------------------------------

class PaymentResponse(PaymentBase):
    """Full representation of a payment transaction."""

    id: int
    tenant_id: int
    status: PaymentStatus
    razorpay_order_id: Optional[str] = None
    razorpay_payment_id: Optional[str] = None
    user_id: Optional[int] = None
    created_at: datetime
    updated_at: datetime


class RevenueSummary(BaseModel):
    """Aggregated revenue statistics for a tenant."""

    total_revenue: float = 0.0
    total_transactions: int = 0
    pending_amount: float = 0.0
    failed_transactions: int = 0
    currency: str = "INR"


class PaymentListResponse(BaseModel):
    """Paginated list of payments."""

    total: int
    items: List[PaymentResponse]

    model_config = ConfigDict(from_attributes=True)
