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


class VotingType(str, enum.Enum):
    """Defines how votes are counted for an election."""

    SINGLE_CANDIDATE = "SINGLE_CANDIDATE"
    MULTIPLE_MEMBER = "MULTIPLE_MEMBER"


# Association table for multi-target elections
# (e.g. one election covering multiple Districts or Blocks)
from sqlalchemy import Table

election_targets = Table(
    "election_targets",
    Base.metadata,
    Column("election_id", Integer, ForeignKey("elections.id", ondelete="CASCADE"), primary_key=True),
    Column("target_id", Integer, ForeignKey("targets.id", ondelete="CASCADE"), primary_key=True),
)


class Election(Base):
    """ORM model representing a single election event."""

    __tablename__ = "elections"

    # Primary key
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)

    # Details
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)

    # Schedule
    nomination_start_date = Column(DateTime, nullable=True)
    nomination_end_date = Column(DateTime, nullable=True)
    start_date = Column(DateTime, nullable=False)
    end_date = Column(DateTime, nullable=False)
    
    # Scoping
    committee_level = Column(String(50), nullable=True) # country, state, district, block, booth
    target_district = Column(String(100), nullable=True, index=True)

    # Voting configuration
    voting_type = Column(
        Enum(VotingType, name="voting_type_enum"),
        nullable=False,
        default=VotingType.SINGLE_CANDIDATE,
        server_default="SINGLE_CANDIDATE",
    )
    votes_allowed_per_voter = Column(
        Integer,
        nullable=False,
        default=1,
        server_default="1",
    )

    # Scoping – legacy single link (kept for compatibility)
    target_id = Column(
        Integer,
        ForeignKey("targets.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )

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
    target = relationship("Target", back_populates="elections", lazy="select")
    
    # Multi-jurisdiction relationship
    targets = relationship("Target", secondary=election_targets, lazy="select")

    candidates = relationship(
        "Candidate",
        back_populates="election",
        cascade="all, delete-orphan",
        lazy="select",
    )
    nominations = relationship(
        "Nomination",
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
