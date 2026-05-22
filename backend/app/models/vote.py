from datetime import datetime

from sqlalchemy import (
    Column,
    DateTime,
    ForeignKey,
    Integer,
    String,
    UniqueConstraint,
    func,
)
from sqlalchemy.orm import relationship

from app.config.database import Base


class Vote(Base):
    """
    ORM model representing a single ballot cast by a voter in an election.

    The ``UniqueConstraint`` on ``(user_id, election_id)`` enforces the rule
    that each voter may cast at most one vote per election at the database level.
    """

    __tablename__ = "votes"

    # Enforce one-vote-per-election at the DB level
    __table_args__ = (
        UniqueConstraint("user_id", "election_id", name="uq_vote_user_election"),
    )

    # Primary key
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)

    # Foreign keys
    user_id = Column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    election_id = Column(
        Integer,
        ForeignKey("elections.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    candidate_id = Column(
        Integer,
        ForeignKey("candidates.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    # Audit fields
    voted_at = Column(
        DateTime,
        nullable=False,
        default=datetime.utcnow,
        server_default=func.now(),
    )
    ip_address = Column(String(45), nullable=True)  # IPv6 max length = 45

    # Relationships
    user = relationship("User", back_populates="votes", lazy="select")
    election = relationship("Election", back_populates="votes", lazy="select")
    candidate = relationship("Candidate", back_populates="votes", lazy="select")

    def __repr__(self) -> str:  # pragma: no cover
        return (
            f"<Vote id={self.id} user_id={self.user_id} "
            f"election_id={self.election_id} candidate_id={self.candidate_id}>"
        )
