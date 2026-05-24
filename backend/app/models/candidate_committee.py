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


class CandidateCommittee(Base):
    """ORM model representing a committee a candidate can belong to (e.g. President, Secretary)."""

    __tablename__ = "candidate_committees"

    # Primary key
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)

    # Multi-tenancy – committees are defined per tenant
    tenant_id = Column(
        Integer,
        ForeignKey("tenants.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    # Committee details
    name = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)

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
    tenant = relationship("Tenant", back_populates="candidate_committees", lazy="select")
    candidates = relationship(
        "Candidate",
        back_populates="committee",
        cascade="all, delete-orphan",
        lazy="select",
    )

    def __repr__(self) -> str:  # pragma: no cover
        return f"<CandidateCommittee id={self.id} name={self.name!r} tenant_id={self.tenant_id}>"
