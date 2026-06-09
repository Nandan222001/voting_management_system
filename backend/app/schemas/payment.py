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
    razorpay_order_id: Optional[str] = None
    razorpay_payment_id: Optional[str] = None
    razorpay_signature: Optional[str] = None


class RazorpayOrderResponse(BaseModel):
    """Details needed by the frontend to open Razorpay Checkout."""

    payment_id: int
    razorpay_order_id: str
    order_id: str
    amount: int  # in paise
    currency: str
    key_id: str


class MembershipOrderCreate(BaseModel):
    """Payload for creating a membership-plan payment order."""

    membership_plan_id: int = Field(..., gt=0)


class RegistrationOrderCreate(BaseModel):
    """Payload for creating a payment order during registration (before user exists)."""

    membership_plan_id: int = Field(..., gt=0)
    tenant_id: int = Field(..., gt=0)


class RazorpayPaymentVerify(BaseModel):
    """Razorpay checkout payload verified by the backend."""

    razorpay_order_id: str = Field(..., min_length=1)
    razorpay_payment_id: str = Field(..., min_length=1)
    razorpay_signature: str = Field(..., min_length=1)


class PaymentFailure(BaseModel):
    """Payload for recording a payment failure."""

    membership_plan_id: int
    error_message: str
    razorpay_order_id: Optional[str] = None


class RefundRequest(BaseModel):
    """Payload for initiating a refund."""

    reason: Optional[str] = Field(None, max_length=255)
    amount: Optional[float] = Field(None, gt=0, description="Partial refund amount; omit for full refund")


class PaymentVerifyResponse(BaseModel):
    success: bool
    message: str


class PaymentStatusResponse(BaseModel):
    status: Optional[str] = None
    payment_completed: bool


class VotingEligibilityResponse(BaseModel):
    can_vote: bool
    membership_selected: bool
    payment_completed: bool
    message: str


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
    razorpay_signature: Optional[str] = None
    user_id: Optional[int] = None
    membership_plan_id: Optional[int] = None
    created_at: datetime
    updated_at: datetime

    # GST fields
    gst_rate: Optional[float] = None
    gst_amount: Optional[float] = None

    # Refund fields
    refund_id: Optional[str] = None
    refund_amount: Optional[float] = None
    refunded_at: Optional[datetime] = None
    refund_reason: Optional[str] = None

    # Rich data for UI
    user_name: Optional[str] = Field(default=None, alias="user_name")
    plan_name: Optional[str] = Field(default=None, alias="plan_name")

    @classmethod
    def model_validate(cls, obj, **kwargs):
        data = super().model_validate(obj, **kwargs)
        if hasattr(obj, 'user') and obj.user:
            data.user_name = obj.user.full_name
        if hasattr(obj, 'membership_plan') and obj.membership_plan:
            data.plan_name = obj.membership_plan.name
        return data


class RevenueSummary(BaseModel):
    """Aggregated revenue statistics for a tenant."""

    total_revenue: float = 0.0
    total_transactions: int = 0
    pending_amount: float = 0.0
    failed_transactions: int = 0
    success_rate: float = 0.0
    refunded_amount: float = 0.0
    refund_count: int = 0
    currency: str = "INR"


class PaymentAnalytics(BaseModel):
    """Enhanced analytics for payment dashboard."""

    success_rate: float = 0.0
    total_refunded: float = 0.0
    refund_count: int = 0
    revenue_by_plan: list = []
    avg_transaction_value: float = 0.0
    currency: str = "INR"


class PaymentListResponse(BaseModel):
    """Paginated list of payments."""

    total: int
    items: List[PaymentResponse]

    model_config = ConfigDict(from_attributes=True)


class MembershipPaymentStatusResponse(BaseModel):
    """Current user's membership-plan and payment readiness for voting."""

    membership_plan_id: Optional[int] = None
    has_membership_plan: bool
    payment_required: bool
    payment_completed: bool
    latest_payment_status: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)
