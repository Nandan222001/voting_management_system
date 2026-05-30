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


class TargetType(str, enum.Enum):
    """Types of geographical or administrative targets."""

    country = "country"
    state = "state"
    district = "district"
    block = "block"
    booth = "booth"
    taluka = "taluka"
    city = "city"
    village = "village"
    other = "other"


class Target(Base):
    """
    ORM model representing a geographical or administrative area 
    (e.g. a State, District, or Ward).
    """

    __tablename__ = "targets"

    # Primary key
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)

    # Multi-tenancy – targets can be platform-wide or per-tenant
    tenant_id = Column(
        Integer,
        ForeignKey("tenants.id", ondelete="CASCADE"),
        nullable=True,
        index=True,
    )

    # Target details
    name = Column(String(150), nullable=False, unique=True)
    type = Column(
        Enum(TargetType, name="target_type_enum"),
        nullable=False,
        default=TargetType.district,
    )

    # Optional hierarchy (e.g. a District belongs to a State)
    parent_id = Column(
        Integer,
        ForeignKey("targets.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )

    # President (Unique per committee)
    president_id = Column(
        Integer,
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
        unique=True,
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
    tenant = relationship("Tenant", back_populates="targets", lazy="select")
    parent = relationship("Target", remote_side=[id], backref="children", lazy="select")
    president = relationship("User", foreign_keys=[president_id], backref="led_committees", lazy="select")
    
    elections = relationship(
        "Election",
        back_populates="target",
        lazy="select",
    )
    candidates = relationship(
        "Candidate",
        back_populates="target",
        lazy="select",
    )
    users = relationship(
        "User",
        back_populates="target",
        foreign_keys="[User.target_id]",
        lazy="select",
    )

    def __repr__(self) -> str:  # pragma: no cover
        return f"<Target id={self.id} name={self.name!r} type={self.type}>"
