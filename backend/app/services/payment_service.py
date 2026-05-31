from typing import Optional, Tuple
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.payment import Payment, PaymentStatus
from app.models.user import User
from app.repositories.payment_repository import PaymentRepository
from app.repositories.tenant_repository import TenantRepository
from app.schemas.payment import PaymentCreate, PaymentUpdate, RevenueSummary
from app.schemas.tenant import TenantPaymentSettings


class PaymentService:
    """
    Handles business logic for revenue management and payment integration.
    """

    def get_tenant_revenue(
        self, db: Session, tenant_id: int, page: int = 1, page_size: int = 20
    ) -> Tuple[list[Payment], int, RevenueSummary]:
        """
        Build a complete revenue overview for a tenant.
        """
        repo = PaymentRepository(db)
        skip = (page - 1) * page_size
        
        items, total = repo.get_by_tenant(tenant_id, skip=skip, limit=page_size)
        summary_data = repo.get_revenue_summary(tenant_id)
        
        return items, total, RevenueSummary(**summary_data)

    def update_payment_settings(
        self, db: Session, tenant_id: int, settings: TenantPaymentSettings
    ) -> bool:
        """
        Update Razorpay credentials for a tenant.
        """
        tenant_repo = TenantRepository(db)
        tenant = tenant_repo.get_by_id(tenant_id)
        if not tenant:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Tenant not found",
            )
            
        tenant_repo.update(tenant, settings)
        return True

    def get_payment_settings(self, db: Session, tenant_id: int) -> dict:
        """
        Retrieve Razorpay credentials for a tenant.
        """
        tenant_repo = TenantRepository(db)
        tenant = tenant_repo.get_by_id(tenant_id)
        if not tenant:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Tenant not found",
            )
            
        return {
            "razorpay_key_id": tenant.razorpay_key_id,
            "razorpay_key_secret": tenant.razorpay_key_secret,
        }

    def create_payment_record(
        self, db: Session, tenant_id: int, data: PaymentCreate
    ) -> Payment:
        """
        Initialize a new payment record (e.g. before redirecting to Razorpay).
        """
        repo = PaymentRepository(db)
        payment_data = data.model_dump()
        payment_data["tenant_id"] = tenant_id
        payment_data["status"] = PaymentStatus.pending
        
        return repo.create(payment_data)

    def get_my_membership_status(self, db: Session, current_user: User) -> dict:
        """
        Return whether the current user's selected membership plan is paid.
        """
        if current_user.membership_plan_id is None:
            return {
                "membership_plan_id": None,
                "has_membership_plan": False,
                "payment_required": True,
                "payment_completed": False,
                "latest_payment_status": None,
            }

        if current_user.tenant_id is None:
            return {
                "membership_plan_id": current_user.membership_plan_id,
                "has_membership_plan": True,
                "payment_required": True,
                "payment_completed": False,
                "latest_payment_status": None,
            }

        repo = PaymentRepository(db)
        latest_payment = repo.get_latest_by_user(current_user.tenant_id, current_user.id)
        payment_completed = repo.has_captured_payment_for_user(
            current_user.tenant_id,
            current_user.id,
        )

        return {
            "membership_plan_id": current_user.membership_plan_id,
            "has_membership_plan": True,
            "payment_required": True,
            "payment_completed": payment_completed,
            "latest_payment_status": latest_payment.status.value if latest_payment else None,
        }

    def capture_payment(
        self, db: Session, payment_id: int, data: PaymentUpdate
    ) -> Payment:
        """
        Update payment status after successful capture or failure.
        """
        repo = PaymentRepository(db)
        payment = repo.get_by_id(payment_id)
        if not payment:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Payment record not found",
            )
            
        return repo.update(payment, data)


# ---------------------------------------------------------------------------
# Module-level singleton
# ---------------------------------------------------------------------------
payment_service = PaymentService()
