from typing import List, Optional, Tuple
from sqlalchemy import func
from sqlalchemy.orm import Session, joinedload

from app.models.payment import Payment, PaymentStatus
from app.repositories.base import BaseRepository


class PaymentRepository(BaseRepository[Payment]):
    """Concrete repository for the ``Payment`` model."""

    model = Payment

    def __init__(self, db: Session) -> None:
        super().__init__(db)

    def get_by_tenant(
        self, 
        tenant_id: int, 
        skip: int = 0, 
        limit: int = 100,
        status: Optional[PaymentStatus] = None
    ) -> Tuple[List[Payment], int]:
        """
        Fetch a paginated list of payments for a tenant with user and plan details.
        """
        # Load relationships to avoid N+1 during Pydantic validation
        from app.models.user import User
        from app.models.plan import Plan

        query = self.db.query(Payment).filter(Payment.tenant_id == tenant_id)
        
        if status:
            query = query.filter(Payment.status == status)
            
        total = query.count()
        
        items = (
            query
            .options(joinedload(Payment.user), joinedload(Payment.membership_plan))
            .order_by(Payment.created_at.desc())
            .offset(skip)
            .limit(limit)
            .all()
        )
        
        return items, total

    def get_revenue_summary(self, tenant_id: int) -> dict:
        """
        Aggregate revenue statistics for a tenant.
        """
        # Total Captured Revenue
        total_revenue = self.db.query(func.sum(Payment.amount)).filter(
            Payment.tenant_id == tenant_id,
            Payment.status == PaymentStatus.captured
        ).scalar() or 0.0

        # Pending Amount
        pending_amount = self.db.query(func.sum(Payment.amount)).filter(
            Payment.tenant_id == tenant_id,
            Payment.status == PaymentStatus.pending
        ).scalar() or 0.0

        # Transaction counts
        total_count = self.db.query(Payment).filter(Payment.tenant_id == tenant_id).count()
        failed_count = self.db.query(Payment).filter(
            Payment.tenant_id == tenant_id,
            Payment.status == PaymentStatus.failed
        ).count()

        return {
            "total_revenue": total_revenue,
            "total_transactions": total_count,
            "pending_amount": pending_amount,
            "failed_transactions": failed_count,
            "currency": "INR"
        }

    def get_latest_by_user(
        self,
        tenant_id: int,
        user_id: int,
        plan_id: Optional[int] = None,
    ) -> Optional[Payment]:
        """
        Return the most recent payment made by a user within a tenant.
        """
        query = self.db.query(Payment).filter(
            Payment.tenant_id == tenant_id,
            Payment.user_id == user_id,
        )
        if plan_id is not None:
            query = query.filter(Payment.membership_plan_id == plan_id)
        return (
            query
            .order_by(Payment.created_at.desc())
            .first()
        )

    def has_captured_payment_for_user(self, tenant_id: int, user_id: int, plan_id: int) -> bool:
        """
        Check whether a user has at least one completed/captured payment 
        for a specific membership plan.
        """
        return (
            self.db.query(Payment.id)
            .filter(
                Payment.tenant_id == tenant_id,
                Payment.user_id == user_id,
                Payment.membership_plan_id == plan_id,
                Payment.status == PaymentStatus.captured,
                Payment.razorpay_payment_id.isnot(None),
                Payment.razorpay_signature.isnot(None),
            )
            .first()
            is not None
        )

    def get_by_order_for_registration(
        self,
        tenant_id: int,
        razorpay_order_id: str,
    ) -> Optional[Payment]:
        """
        Return a tenant-scoped payment by Razorpay order id that doesn't have a user_id yet.
        """
        return (
            self.db.query(Payment)
            .filter(
                Payment.tenant_id == tenant_id,
                Payment.razorpay_order_id == razorpay_order_id,
                Payment.user_id.is_(None)
            )
            .first()
        )

    def get_by_order_for_user(
        self,
        tenant_id: int,
        user_id: int,
        razorpay_order_id: str,
    ) -> Optional[Payment]:
        """
        Return a tenant/user-scoped payment by Razorpay order id.
        """
        return (
            self.db.query(Payment)
            .filter(
                Payment.tenant_id == tenant_id,
                Payment.user_id == user_id,
                Payment.razorpay_order_id == razorpay_order_id,
            )
            .first()
        )
