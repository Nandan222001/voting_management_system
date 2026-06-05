from datetime import datetime, timedelta
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
        captured_count = self.db.query(Payment).filter(
            Payment.tenant_id == tenant_id,
            Payment.status == PaymentStatus.captured
        ).count()

        # Refund stats
        refunded_amount = self.db.query(func.sum(Payment.refund_amount)).filter(
            Payment.tenant_id == tenant_id,
            Payment.status == PaymentStatus.refunded,
        ).scalar() or 0.0
        refund_count = self.db.query(Payment).filter(
            Payment.tenant_id == tenant_id,
            Payment.status == PaymentStatus.refunded,
        ).count()

        success_rate = round((captured_count / total_count * 100), 2) if total_count > 0 else 0.0

        return {
            "total_revenue": total_revenue,
            "total_transactions": total_count,
            "pending_amount": pending_amount,
            "failed_transactions": failed_count,
            "success_rate": success_rate,
            "refunded_amount": refunded_amount,
            "refund_count": refund_count,
            "currency": "INR",
        }

    def get_by_razorpay_payment_id(
        self,
        tenant_id: int,
        razorpay_payment_id: str,
    ) -> Optional[Payment]:
        """
        Look up a payment by razorpay_payment_id within a tenant.
        """
        return (
            self.db.query(Payment)
            .filter(
                Payment.tenant_id == tenant_id,
                Payment.razorpay_payment_id == razorpay_payment_id,
            )
            .first()
        )

    def get_by_razorpay_payment_id_any_tenant(
        self,
        razorpay_payment_id: str,
    ) -> Optional[Payment]:
        """
        Look up a payment by razorpay_payment_id across all tenants (for webhook use).
        """
        return (
            self.db.query(Payment)
            .filter(Payment.razorpay_payment_id == razorpay_payment_id)
            .first()
        )

    def get_by_razorpay_order_id_any_tenant(
        self,
        razorpay_order_id: str,
    ) -> Optional[Payment]:
        """
        Look up a payment by razorpay_order_id across all tenants (for webhook use).
        """
        return (
            self.db.query(Payment)
            .filter(Payment.razorpay_order_id == razorpay_order_id)
            .first()
        )

    def cleanup_expired_pending(
        self,
        tenant_id: int,
        older_than_hours: int = 24,
    ) -> int:
        """
        Mark stale pending payments as failed.

        - Pending payments with no user_id older than ``older_than_hours`` are failed.
        - Pending payments with a user_id older than 48 h are failed.
        Returns the count of records updated.
        """
        now = datetime.utcnow()
        cutoff_no_user = now - timedelta(hours=older_than_hours)
        cutoff_with_user = now - timedelta(hours=48)

        count = 0

        # Anonymous pending payments
        anonymous_expired = (
            self.db.query(Payment)
            .filter(
                Payment.tenant_id == tenant_id,
                Payment.status == PaymentStatus.pending,
                Payment.user_id.is_(None),
                Payment.created_at < cutoff_no_user,
            )
            .all()
        )
        for p in anonymous_expired:
            p.status = PaymentStatus.failed
            count += 1

        # User-linked pending payments
        user_expired = (
            self.db.query(Payment)
            .filter(
                Payment.tenant_id == tenant_id,
                Payment.status == PaymentStatus.pending,
                Payment.user_id.isnot(None),
                Payment.created_at < cutoff_with_user,
            )
            .all()
        )
        for p in user_expired:
            p.status = PaymentStatus.failed
            count += 1

        if count:
            self.db.commit()

        return count

    def get_analytics(self, tenant_id: int) -> dict:
        """
        Return enhanced analytics for a tenant.
        """
        from app.models.plan import Plan

        total_count = self.db.query(Payment).filter(
            Payment.tenant_id == tenant_id
        ).count()
        captured_count = self.db.query(Payment).filter(
            Payment.tenant_id == tenant_id,
            Payment.status == PaymentStatus.captured,
        ).count()
        success_rate = round((captured_count / total_count * 100), 2) if total_count > 0 else 0.0

        total_refunded = self.db.query(func.sum(Payment.refund_amount)).filter(
            Payment.tenant_id == tenant_id,
            Payment.status == PaymentStatus.refunded,
        ).scalar() or 0.0
        refund_count = self.db.query(Payment).filter(
            Payment.tenant_id == tenant_id,
            Payment.status == PaymentStatus.refunded,
        ).count()

        # Revenue by plan
        rows = (
            self.db.query(Plan.name, func.sum(Payment.amount).label("total"))
            .join(Payment, Payment.membership_plan_id == Plan.id)
            .filter(
                Payment.tenant_id == tenant_id,
                Payment.status == PaymentStatus.captured,
            )
            .group_by(Plan.name)
            .all()
        )
        revenue_by_plan = [{"plan_name": r[0], "total": float(r[1])} for r in rows]

        # Average transaction value (captured only)
        avg_row = self.db.query(func.avg(Payment.amount)).filter(
            Payment.tenant_id == tenant_id,
            Payment.status == PaymentStatus.captured,
        ).scalar()
        avg_transaction_value = round(float(avg_row), 2) if avg_row else 0.0

        return {
            "success_rate": success_rate,
            "total_refunded": total_refunded,
            "refund_count": refund_count,
            "revenue_by_plan": revenue_by_plan,
            "avg_transaction_value": avg_transaction_value,
            "currency": "INR",
        }

    def get_by_user_paginated(
        self,
        tenant_id: int,
        user_id: int,
        skip: int = 0,
        limit: int = 20,
    ) -> Tuple[List[Payment], int]:
        """
        Return paginated payments for a specific user within a tenant.
        """
        query = self.db.query(Payment).filter(
            Payment.tenant_id == tenant_id,
            Payment.user_id == user_id,
        )
        total = query.count()
        items = (
            query
            .options(joinedload(Payment.membership_plan))
            .order_by(Payment.created_at.desc())
            .offset(skip)
            .limit(limit)
            .all()
        )
        return items, total

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
