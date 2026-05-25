from typing import List, Optional, Tuple
from sqlalchemy import func
from sqlalchemy.orm import Session

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
        Fetch a paginated list of payments for a tenant.
        """
        query = self.db.query(Payment).filter(Payment.tenant_id == tenant_id)
        
        if status:
            query = query.filter(Payment.status == status)
            
        total = query.count()
        items = query.order_by(Payment.created_at.desc()).offset(skip).limit(limit).all()
        
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
