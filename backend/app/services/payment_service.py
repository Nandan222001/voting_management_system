from typing import Optional, Tuple
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.payment import Payment, PaymentStatus
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
