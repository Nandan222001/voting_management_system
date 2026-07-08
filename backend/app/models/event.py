from datetime import datetime
import enum
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


class EventCommunicationType(str, enum.Enum):
    online = "Online"
    offline = "Offline"


class Event(Base):
    """ORM model for events created by candidates."""

    __tablename__ = "events"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    tenant_id = Column(
        Integer,
        ForeignKey("tenants.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    created_by = Column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    event_type = Column(String(100), nullable=False)  # e.g., Meeting, Jalsa, Rally
    event_date = Column(String(50), nullable=False)
    event_time = Column(String(50), nullable=False)
    place = Column(String(255), nullable=False)
    communication_type = Column(
        Enum(EventCommunicationType, name="event_communication_type_enum"),
        nullable=False,
        default=EventCommunicationType.offline,
    )
    description = Column(Text, nullable=True)

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
    tenant = relationship("Tenant", lazy="select")
    creator = relationship("User", foreign_keys=[created_by], lazy="select")
    notifications = relationship(
        "EventNotification",
        back_populates="event",
        cascade="all, delete-orphan",
        lazy="select",
    )


class EventNotification(Base):
    """ORM model for event notifications."""

    __tablename__ = "event_notifications"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    event_id = Column(
        Integer,
        ForeignKey("events.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    user_id = Column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    is_read = Column(Integer, nullable=False, default=0)  # 0: Unread, 1: Read

    created_at = Column(
        DateTime,
        nullable=False,
        default=datetime.utcnow,
        server_default=func.now(),
    )

    # Relationships
    event = relationship("Event", back_populates="notifications", lazy="select")
    user = relationship("User", lazy="select")
