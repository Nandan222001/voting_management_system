import enum
from datetime import datetime

from sqlalchemy import (
    Boolean,
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


class UserRole(str, enum.Enum):
    """Role assigned to a user account."""

    superadmin = "superadmin"
    admin = "admin"
    voter = "voter"


class UserStatus(str, enum.Enum):
    """Lifecycle status of a user account."""

    active = "active"
    blocked = "blocked"
    pending = "pending"


class User(Base):
    """ORM model representing a registered user (admin or internal member)."""

    __tablename__ = "users"

    # Primary key
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)

    # Personal information
    full_name = Column(String(150), nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    phone = Column(String(20), nullable=True)
    image_url = Column(String(500), nullable=True)
    date_of_birth = Column(String(20), nullable=True)
    gender = Column(String(20), nullable=True)
    parent_name = Column(String(150), nullable=True)
    voter_id = Column(String(50), unique=True, index=True, nullable=True)
    designation = Column(String(100), nullable=True)

    # KYC Details
    kyc_type = Column(String(50), nullable=True)
    kyc_front_url = Column(String(500), nullable=True)
    kyc_back_url = Column(String(500), nullable=True)

    # Address Information (Permanent)
    house_number = Column(String(100), nullable=True)
    street_address = Column(String(300), nullable=True)
    village = Column(String(100), nullable=True)
    landmark = Column(String(200), nullable=True)
    pincode = Column(String(20), nullable=True)
    city = Column(String(100), nullable=True)
    taluka = Column(String(100), nullable=True)
    district = Column(String(100), nullable=True, index=True)
    state = Column(String(100), nullable=True)
    country = Column(String(100), nullable=True, default="India")

    # Current Address (if different)
    current_street_address = Column(String(300), nullable=True)
    current_city = Column(String(100), nullable=True)
    current_district = Column(String(100), nullable=True)
    current_state = Column(String(100), nullable=True)
    current_pincode = Column(String(20), nullable=True)

    # Scoping – link to structured geographical target
    target_id = Column(
        Integer,
        ForeignKey("targets.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )

    # Organization / Committee Mapping
    committee_id = Column(
        Integer,
        ForeignKey("candidate_committees.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )

    # Membership Plan
    membership_plan_id = Column(
        Integer,
        ForeignKey("plans.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )

    # Authentication
    hashed_password = Column(String(255), nullable=False)

    # Role & status
    role = Column(
        Enum(UserRole, name="user_role_enum"),
        nullable=False,
        default=UserRole.voter,
    )
    status = Column(
        Enum(UserStatus, name="user_status_enum"),
        nullable=False,
        default=UserStatus.pending,
    )

    # OTP / email verification
    otp_code = Column(String(10), nullable=True)
    otp_expires_at = Column(DateTime, nullable=True)
    is_verified = Column(Boolean, nullable=False, default=False)

    # Multi-tenancy – nullable because superadmin has no tenant
    tenant_id = Column(
        Integer,
        ForeignKey("tenants.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )

    # Timestamps (auto-managed by the DB)
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
    votes = relationship("Vote", back_populates="user", lazy="select")
    audit_logs = relationship("AuditLog", back_populates="user", lazy="select")
    elections_created = relationship(
        "Election", back_populates="creator", lazy="select"
    )
    nominations = relationship(
        "Nomination",
        back_populates="user",
        cascade="all, delete-orphan",
        lazy="select",
    )
    tenant = relationship(
        "Tenant",
        back_populates="users",
        foreign_keys=[tenant_id],
        lazy="select",
    )
    target = relationship(
        "Target",
        back_populates="users",
        foreign_keys=[target_id],
        lazy="select",
    )
    membership_plan = relationship(
        "Plan",
        foreign_keys=[membership_plan_id],
        lazy="joined",
    )

    def __repr__(self) -> str:  # pragma: no cover
        return f"<User id={self.id} email={self.email!r} role={self.role}>"
