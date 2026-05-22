import enum
from datetime import datetime

from sqlalchemy import (
    Column,
    DateTime,
    Enum,
    ForeignKey,
    Integer,
    String,
    Text,
    func,
)
from sqlalchemy.orm import relationship

from app.config.database import Base


class ElectionStatus(str, enum.Enum):
    """Lifecycle status of an election."""

    draft = "draft"
    active = "active"
    closed = "closed"
    cancelled = "cancelled"


class Election(Base):
    """ORM model representing a single election event."""

    __tablename__ = "elections"

    # Primary key
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)

    # Details
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)

    # Schedule
    start_date = Column(DateTime, nullable=False)
    end_date = Column(DateTime, nullable=False)

    # Lifecycle
    status = Column(
        Enum(ElectionStatus, name="election_status_enum"),
        nullable=False,
        default=ElectionStatus.draft,
    )

    # Ownership – SET NULL when the admin account is deleted
    created_by = Column(
        Integer,
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )

    # Multi-tenancy – CASCADE delete elections when tenant is removed
    tenant_id = Column(
        Integer,
        ForeignKey("tenants.id", ondelete="CASCADE"),
        nullable=False,
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
    creator = relationship("User", back_populates="elections_created", lazy="select")
    tenant = relationship("Tenant", back_populates="elections", lazy="select")
    candidates = relationship(
        "Candidate",
        back_populates="election",
        cascade="all, delete-orphan",
        lazy="select",
    )
    votes = relationship(
        "Vote",
        back_populates="election",
        cascade="all, delete-orphan",
        lazy="select",
    )

    def __repr__(self) -> str:  # pragma: no cover
        return f"<Election id={self.id} title={self.title!r} status={self.status}>"
