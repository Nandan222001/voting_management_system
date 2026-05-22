from datetime import datetime

from sqlalchemy import (
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

    # Candidate details
    full_name = Column(String(150), nullable=False)
    party = Column(String(150), nullable=True)
    symbol = Column(String(100), nullable=True)
    image_url = Column(String(500), nullable=True)
    bio = Column(Text, nullable=True)

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
