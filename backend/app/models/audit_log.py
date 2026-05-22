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


class AuditLog(Base):
    """
    ORM model for immutable audit trail entries.

    Every significant action in the system (login, vote, status change, etc.)
    should create an ``AuditLog`` row so that administrators can reconstruct
    exactly what happened and when.
    """

    __tablename__ = "audit_logs"

    # Primary key
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)

    # The actor – nullable because system-generated events may have no user
    user_id = Column(
        Integer,
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )

    # What happened (e.g. "user.login", "vote.cast", "election.status_changed")
    action = Column(String(100), nullable=False, index=True)

    # Which type of resource was affected (e.g. "election", "user", "vote")
    entity_type = Column(String(100), nullable=True, index=True)

    # The PK of the affected resource
    entity_id = Column(Integer, nullable=True)

    # Free-form JSON / text payload with extra context
    details = Column(Text, nullable=True)

    # Network metadata
    ip_address = Column(String(45), nullable=True)

    # Timestamp (no updated_at – audit rows are never mutated)
    created_at = Column(
        DateTime,
        nullable=False,
        default=datetime.utcnow,
        server_default=func.now(),
        index=True,
    )

    # Relationships
    user = relationship("User", back_populates="audit_logs", lazy="select")

    def __repr__(self) -> str:  # pragma: no cover
        return (
            f"<AuditLog id={self.id} action={self.action!r} "
            f"user_id={self.user_id} entity_type={self.entity_type!r}>"
        )
