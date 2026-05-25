from fastapi import APIRouter, Depends, Query, status
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session

from app.config.database import get_db
from app.middlewares.auth_middleware import get_current_user, require_admin
from app.models.user import User
from app.schemas.payment import (
    PaymentListResponse,
    PaymentResponse,
    RevenueSummary,
)
from app.schemas.tenant import TenantPaymentSettings
from app.services.payment_service import payment_service
from app.utils.response import success_response

router = APIRouter(prefix="/payments", tags=["Revenue & Payments"])


@router.get(
    "/revenue",
    summary="Get revenue overview and transactions (Admin only)",
)
def get_revenue_overview(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
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


@router.put(
    "/settings",
    summary="Update payment gateway settings (Admin only)",
)
def update_payment_settings(
    payload: TenantPaymentSettings,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
) -> JSONResponse:
    """
    Update Razorpay Key ID and Key Secret for the organization.
    """
    payment_service.update_payment_settings(db, current_user.tenant_id, payload)
    return success_response(message="Payment gateway settings updated successfully.")
