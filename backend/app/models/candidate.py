from datetime import datetime

from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    ForeignKey,
    Integer,
    String,
    Text,
    func,
)
from sqlalchemy.orm import relationship

from app.config.database import Base


class Candidate(Base):
    """ORM model for a candidate standing in an election."""

    __tablename__ = "candidates"

    # Primary key
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)

    # Foreign key – candidate belongs to exactly one election
    election_id = Column(
        Integer,
        ForeignKey("elections.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    # Multi-tenancy – CASCADE delete candidates when tenant is removed
    tenant_id = Column(
        Integer,
        ForeignKey("tenants.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    # Candidate position / committee
    committee_id = Column(
        Integer,
        ForeignKey("candidate_committees.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )

    # Scoping – link to structured geographical target
    target_id = Column(
        Integer,
        ForeignKey("targets.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )

    # Candidate details
    full_name = Column(String(150), nullable=False)
    position_name = Column(String(100), nullable=True)  # Free-text position
    email = Column(String(150), nullable=True)
    phone = Column(String(20), nullable=True)
    date_of_birth = Column(String(50), nullable=True)
    gender = Column(String(20), nullable=True)
    parent_name = Column(String(150), nullable=True)
    
    # ID & Address
    kyc_type = Column(String(50), nullable=True)
    voter_id_number = Column(String(50), nullable=True)
    state = Column(String(100), nullable=True)
    district = Column(String(100), nullable=True)
    taluka = Column(String(100), nullable=True)
    village = Column(String(100), nullable=True)
    pincode = Column(String(20), nullable=True)
    
    # Profile & Symbols
    symbol = Column(String(100), nullable=True)
    image_url = Column(String(500), nullable=True)
    bio = Column(Text, nullable=True)
    
    # Eligibility & Declarations
    is_willing = Column(Boolean, default=True)
    held_previously = Column(Boolean, default=False)
    prev_position = Column(String(150), nullable=True)
    prev_duration = Column(String(100), nullable=True)
    is_disciplined = Column(Boolean, default=False)
    discipline_details = Column(Text, nullable=True)
    has_complaints = Column(Boolean, default=False)
    agreed_constitution = Column(Boolean, default=False)
    accepted_results = Column(Boolean, default=False)
    signature_url = Column(String(500), nullable=True)

    # Denormalised vote tally – updated atomically whenever a vote is cast
    vote_count = Column(Integer, nullable=False, default=0)

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
    election = relationship("Election", back_populates="candidates", lazy="select")
    committee = relationship("CandidateCommittee", back_populates="candidates", lazy="select")
    target = relationship("Target", back_populates="candidates", lazy="select")
    votes = relationship(
        "Vote",
        back_populates="candidate",
        cascade="all, delete-orphan",
        lazy="select",
    )

    def __repr__(self) -> str:  # pragma: no cover
        return (
            f"<Candidate id={self.id} name={self.full_name!r} "
            f"election_id={self.election_id}>"
        )
