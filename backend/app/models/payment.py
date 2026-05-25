import enum
from datetime import datetime

from sqlalchemy import (
    Column,
    DateTime,
    Enum,
    ForeignKey,
    Integer,
    String,
    Float,
    Text,
    func,
)
from sqlalchemy.orm import relationship

from app.config.database import Base


class PaymentStatus(str, enum.Enum):
    """Lifecycle status of a payment transaction."""

    pending = "pending"
    authorized = "authorized"
    captured = "captured"
    failed = "failed"
    refunded = "refunded"


class Payment(Base):
    """ORM model representing a payment transaction within a tenant organisation."""

    __tablename__ = "payments"

    # Primary key
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)

    # Scoping
    tenant_id = Column(
        Integer,
        ForeignKey("tenants.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    # Transaction details
    amount = Column(Float, nullable=False)
    currency = Column(String(3), nullable=False, default="INR")
    status = Column(
        Enum(PaymentStatus, name="payment_status_enum"),
        nullable=False,
        default=PaymentStatus.pending,
    )
    description = Column(String(255), nullable=True)

    # Razorpay Specifics
    razorpay_order_id = Column(String(100), nullable=True, index=True)
    razorpay_payment_id = Column(String(100), nullable=True, index=True)
    razorpay_signature = Column(String(255), nullable=True)

    # Payer Info (Optional - could link to User if internal)
    user_id = Column(
        Integer,
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )

    # Timestamps
    created_at = Column(
        DateTime,
        nullable=False,
        default=datetime.utcnow,
        server_default=func.now(),
    )
    updated_at = Column(
        DateTime,
        nullable=False,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        server_default=func.now(),
    )

    # Relationships
    tenant = relationship("Tenant", lazy="select")
    user = relationship("User", lazy="select")

    def __repr__(self) -> str:  # pragma: no cover
        return f"<Payment id={self.id} amount={self.amount} status={self.status}>"
