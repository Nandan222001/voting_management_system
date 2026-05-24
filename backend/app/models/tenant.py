import enum
from datetime import datetime

from sqlalchemy import (
    Column,
    DateTime,
    Enum,
    ForeignKey,
    Integer,
    String,
    func,
)
from sqlalchemy.orm import relationship

from app.config.database import Base


class TenantStatus(str, enum.Enum):
    """Lifecycle status of a tenant account."""

    trial = "trial"
    active = "active"
    suspended = "suspended"
    cancelled = "cancelled"


class TenantPlan(str, enum.Enum):
    """Subscription plan tier for a tenant."""

    starter = "starter"
    professional = "professional"
    enterprise = "enterprise"


class Tenant(Base):
    """ORM model representing a tenant organisation in the multi-tenant platform."""

    __tablename__ = "tenants"

    # Primary key
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)

    # Identity
    name = Column(String(255), nullable=False)
    slug = Column(String(100), unique=True, nullable=False, index=True)
    domain = Column(String(255), nullable=True)

    # Branding
    logo_url = Column(String(500), nullable=True)
    primary_color = Column(String(7), nullable=False, default="#4f46e5")

    # Lifecycle
    status = Column(
        Enum(TenantStatus, name="tenant_status_enum"),
        nullable=False,
        default=TenantStatus.trial,
    )
    plan = Column(
        Enum(TenantPlan, name="tenant_plan_enum"),
        nullable=False,
        default=TenantPlan.starter,
    )

    # Limits
    max_elections = Column(Integer, nullable=False, default=5)
    max_voters = Column(Integer, nullable=False, default=1000)

    # Contact
    contact_email = Column(String(255), nullable=True)

    # Ownership – SET NULL when creator account is deleted
    created_by = Column(
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
    users = relationship(
        "User",
        back_populates="tenant",
        foreign_keys="[User.tenant_id]",
        lazy="select",
    )
    elections = relationship(
        "Election",
        back_populates="tenant",
        lazy="select",
    )
    candidate_committees = relationship(
        "CandidateCommittee",
        back_populates="tenant",
        lazy="select",
    )
    targets = relationship(
        "Target",
        back_populates="tenant",
        cascade="all, delete-orphan",
        lazy="select",
    )

    def __repr__(self) -> str:  # pragma: no cover
        return f"<Tenant id={self.id} slug={self.slug!r} plan={self.plan}>"
