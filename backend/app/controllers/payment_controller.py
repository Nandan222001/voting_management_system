from fastapi import APIRouter, Depends, Query, status
from fastapi.responses import JSONResponse, StreamingResponse
from sqlalchemy.orm import Session
import io
import csv

from app.config.database import get_db
from app.middlewares.auth_middleware import get_current_user, require_admin, require_tenant_admin_only
from app.models.user import User
from app.schemas.payment import (
    MembershipOrderCreate,
    PaymentCreate,
    PaymentFailure,
    PaymentListResponse,
    PaymentResponse,
    PaymentStatusResponse,
    PaymentUpdate,
    PaymentVerifyResponse,
    MembershipPaymentStatusResponse,
    RevenueSummary,
    RazorpayOrderResponse,
    RazorpayPaymentVerify,
)
from app.schemas.tenant import TenantPaymentSettings
from app.services.payment_service import payment_service
from app.utils.response import success_response

router = APIRouter(prefix="/payments", tags=["Revenue & Payments"])


@router.get(
    "/status",
    response_model=PaymentStatusResponse,
    summary="Get current user's membership payment status",
)
def get_payment_status(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> PaymentStatusResponse:
    """
    Return the latest payment status for the user's selected membership plan.
    """
    return PaymentStatusResponse(**payment_service.get_current_payment_status(db, current_user))


@router.post(
    "/create-order",
    response_model=RazorpayOrderResponse,
    summary="Create a membership payment Razorpay order",
)
def create_membership_payment_order(
    payload: MembershipOrderCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> RazorpayOrderResponse:
    """
    Create a pending payment record and Razorpay order for the user's selected membership plan.
    """
    order_data = payment_service.create_membership_payment_order(
        db,
        current_user=current_user,
        membership_plan_id=payload.membership_plan_id,
    )
    return RazorpayOrderResponse(**order_data)


@router.post(
    "/verify",
    response_model=PaymentVerifyResponse,
    summary="Verify a Razorpay membership payment",
)
def verify_membership_payment(
    payload: RazorpayPaymentVerify,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> PaymentVerifyResponse:
    """
    Verify Razorpay signature and mark the matching payment as captured.
    """
    result = payment_service.verify_membership_payment(db, current_user, payload)
    return PaymentVerifyResponse(**result)


@router.get(
    "/my-membership-status",
    summary="Get current user's membership payment status",
)
def get_my_membership_status(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> JSONResponse:
    """
    Return whether the current user has selected a membership plan and
    completed payment for it.
    """
    status_data = payment_service.get_my_membership_status(db, current_user)
    return success_response(
        data=status_data,
        message="Membership payment status retrieved successfully.",
    )


@router.post(
    "/failure",
    summary="Record a payment failure from mobile application",
)
def record_payment_failure(
    payload: PaymentFailure,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> JSONResponse:
    """
    Update a pending payment record to 'failed' status with reason.
    """
    payment_service.record_payment_failure(db, current_user, payload)
    return success_response(message="Payment failure recorded.")


@router.get(
    "/create",
    summary="Initialize a new Razorpay order",
)
def create_payment(
    payload: PaymentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Create a pending payment record and generate Razorpay Order ID.
    Uses organization-specific credentials.
    """
    order_data = payment_service.create_razorpay_order(
        db, 
        tenant_id=current_user.tenant_id, 
        user_id=current_user.id,
        amount=payload.amount,
        description=payload.description
    )
    return RazorpayOrderResponse(**order_data)


@router.post(
    "/verify-record",
    response_model=PaymentResponse,
    summary="Verify and capture a payment signature",
)
def verify_payment_record(
    payment_id: int,
    payload: PaymentUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> PaymentResponse:
    """
    Verifies the Razorpay signature and updates the record to 'captured'.
    Ensures secure and valid transaction finalization.
    """
    updated = payment_service.update_payment_status(
        db, 
        payment_id=payment_id, 
        tenant_id=current_user.tenant_id, 
        data=payload
    )
    return PaymentResponse.model_validate(updated)


@router.get(
    "/revenue",
    summary="Get revenue overview and transactions (Admin only)",
)
def get_revenue_overview(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_tenant_admin_only),
) -> JSONResponse:
    """
    Returns a summary of total revenue, counts, and a paginated list
    of all transactions for the current tenant.
    """
    items, total, summary = payment_service.get_tenant_revenue(
        db, 
        tenant_id=current_user.tenant_id, 
        page=page, 
        page_size=page_size
    )
    
    return success_response(
        data={
            "summary": summary.model_dump(),
            "transactions": {
                "total": total,
                "items": [PaymentResponse.model_validate(i).model_dump(mode="json") for i in items]
            }
        },
        message="Revenue data retrieved successfully."
    )


@router.get(
    "/statement",
    summary="Download payment statement (CSV) (Admin only)",
)
def download_payment_statement(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_tenant_admin_only),
):
    """
    Export all payment transactions for the current tenant as a CSV file.
    """
    # Fetch all records for the tenant
    items, _, _ = payment_service.get_tenant_revenue(
        db, 
        tenant_id=current_user.tenant_id, 
        page=1, 
        page_size=1000 # Large enough for most tenants
    )
    
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "Transaction ID", "User Name", "Plan", "Amount", "Currency", 
        "Status", "Razorpay Order ID", "Razorpay Payment ID", "Date"
    ])
    
    for p in items:
        resp = PaymentResponse.model_validate(p)
        writer.writerow([
            resp.id,
            resp.user_name or "N/A",
            resp.plan_name or "N/A",
            resp.amount,
            resp.currency,
            resp.status.value,
            resp.razorpay_order_id or "N/A",
            resp.razorpay_payment_id or "N/A",
            resp.created_at.strftime("%Y-%m-%d %H:%M:%S")
        ])
    
    output.seek(0)
    return StreamingResponse(
        io.BytesIO(output.getvalue().encode()),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=payment_statement_{current_user.tenant_id}.csv"}
    )


@router.put(
    "/settings",
    summary="Update payment gateway settings (Admin only)",
)
def update_payment_settings(
    payload: TenantPaymentSettings,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_tenant_admin_only),
) -> JSONResponse:
    """
    Update Razorpay Key ID and Key Secret for the organization.
    """
    payment_service.update_payment_settings(db, current_user.tenant_id, payload)
    return success_response(message="Payment gateway settings updated successfully.")


@router.get(
    "/settings",
    summary="Get payment gateway settings (Admin only)",
)
def get_payment_settings(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_tenant_admin_only),
) -> JSONResponse:
    """
    Retrieve Razorpay Key ID and Key Secret for the organization.
    """
    settings = payment_service.get_payment_settings(db, current_user.tenant_id)
    return success_response(
        data=settings,
        message="Payment gateway settings retrieved successfully."
    )
