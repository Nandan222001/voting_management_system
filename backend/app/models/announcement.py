import enum
from datetime import datetime

from sqlalchemy import Boolean, Column, DateTime, Enum, ForeignKey, Integer, JSON, String, Text, func
from sqlalchemy.orm import relationship

from app.config.database import Base


class AnnouncementStatus(str, enum.Enum):
    draft = "draft"
    published = "published"


class Announcement(Base):
    __tablename__ = "announcements"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    tenant_id = Column(Integer, ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)
    created_by = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)

    title = Column(String(200), nullable=False)
    short_description = Column(String(500), nullable=False)
    content = Column(Text, nullable=False)
    image_urls = Column(JSON, nullable=False, default=list)
    attachment_urls = Column(JSON, nullable=False, default=list)
    publish_date = Column(DateTime, nullable=False, index=True)
    status = Column(
        Enum(AnnouncementStatus, name="announcement_status_enum"),
        nullable=False,
        default=AnnouncementStatus.draft,
        index=True,
    )
    is_featured = Column(Boolean, nullable=False, default=False, index=True)

    created_at = Column(DateTime, nullable=False, default=datetime.utcnow, server_default=func.now())
    updated_at = Column(
        DateTime,
        nullable=False,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        server_default=func.now(),
    )

    tenant = relationship("Tenant", back_populates="announcements", lazy="select")
    creator = relationship("User", lazy="select")

    def __repr__(self) -> str:  # pragma: no cover
        return f"<Announcement id={self.id} title={self.title!r} status={self.status}>"
