import enum
from datetime import datetime

from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    Enum,
    Integer,
    String,
    func,
)
from sqlalchemy.orm import relationship

from app.config.database import Base


class UserRole(str, enum.Enum):
    """Role assigned to a user account."""

    admin = "admin"
    voter = "voter"


class UserStatus(str, enum.Enum):
    """Lifecycle status of a user account."""

    active = "active"
    blocked = "blocked"
    pending = "pending"


class User(Base):
    """ORM model representing a registered user (admin or voter)."""

    __tablename__ = "users"

    # Primary key
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)

    # Personal information
    full_name = Column(String(150), nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    phone = Column(String(20), nullable=True)

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

    def __repr__(self) -> str:  # pragma: no cover
        return f"<User id={self.id} email={self.email!r} role={self.role}>"
