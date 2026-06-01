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
    Text,
    UniqueConstraint,
    func,
)
from sqlalchemy.orm import relationship

from app.config.database import Base


class NominationStatus(str, enum.Enum):
    """Review status for a voter-submitted nomination."""

    pending = "pending"
    approved = "approved"
    rejected = "rejected"
    suspended = "suspended"


class Nomination(Base):
    """ORM model for nomination applications submitted from the mobile app."""

    __tablename__ = "nominations"
    __table_args__ = (
        UniqueConstraint(
            "election_id",
            "user_id",
            name="uq_nominations_election_user",
        ),
    )

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)

    election_id = Column(
        Integer,
        ForeignKey("elections.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    user_id = Column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    tenant_id = Column(
        Integer,
        ForeignKey("tenants.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    committee_id = Column(
        Integer,
        ForeignKey("candidate_committees.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    target_id = Column(
        Integer,
        ForeignKey("targets.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )

    full_name = Column(String(150), nullable=False)
    position_name = Column(String(100), nullable=True)
    email = Column(String(150), nullable=True)
    phone = Column(String(20), nullable=True)
    date_of_birth = Column(String(50), nullable=True)
    gender = Column(String(20), nullable=True)
    parent_name = Column(String(150), nullable=True)

    kyc_type = Column(String(50), nullable=True)
    voter_id_number = Column(String(50), nullable=True)
    state = Column(String(100), nullable=True)
    district = Column(String(100), nullable=True)
    taluka = Column(String(100), nullable=True)
    village = Column(String(100), nullable=True)
    pincode = Column(String(20), nullable=True)

    image_url = Column(String(500), nullable=True)
    bio = Column(Text, nullable=True)

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

    status = Column(
        Enum(NominationStatus, name="nomination_status_enum"),
        nullable=False,
        default=NominationStatus.pending,
    )

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

    election = relationship("Election", back_populates="nominations", lazy="select")
    user = relationship("User", back_populates="nominations", lazy="select")
    tenant = relationship("Tenant", back_populates="nominations", lazy="select")
    committee = relationship("CandidateCommittee", lazy="select")
    target = relationship("Target", lazy="select")

    def __repr__(self) -> str:  # pragma: no cover
        return (
            f"<Nomination id={self.id} election_id={self.election_id} "
            f"user_id={self.user_id} status={self.status}>"
        )
