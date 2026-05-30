from datetime import datetime

from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    ForeignKey,
    Integer,
    String,
    Float,
    Text,
    func,
)
from sqlalchemy.orm import relationship

from app.config.database import Base


class Plan(Base):
    """ORM model representing a dynamic subscription plan for voters within a tenant organisation."""

    __tablename__ = "plans"

    # Primary key
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)

    # Scoping
    tenant_id = Column(
        Integer,
        ForeignKey("tenants.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    # Plan details
    name = Column(String(100), nullable=False)
    price = Column(Float, nullable=False, default=0.0)
    currency = Column(String(3), nullable=False, default="INR")
    period = Column(String(20), nullable=False, default="month")  # month, year, one-time
    description = Column(Text, nullable=True)
    features = Column(Text, nullable=True)  # Store as comma-separated or JSON string
    
    is_active = Column(Boolean, nullable=False, default=True)
    is_highlighted = Column(Boolean, nullable=False, default=False)

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

    def __repr__(self) -> str:  # pragma: no cover
        return f"<Plan id={self.id} name={self.name!r} price={self.price}>"
