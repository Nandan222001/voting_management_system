from datetime import datetime
from typing import Optional

from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.models.announcement import Announcement, AnnouncementStatus
from app.repositories.base import BaseRepository


class AnnouncementRepository(BaseRepository[Announcement]):
    model = Announcement

    def __init__(self, db: Session) -> None:
        super().__init__(db)

    def list_filtered(
        self,
        skip: int = 0,
        limit: int = 20,
        tenant_id: Optional[int] = None,
        status_filter: Optional[AnnouncementStatus] = None,
        published_only: bool = False,
        featured: Optional[bool] = None,
        search: Optional[str] = None,
    ) -> list[Announcement]:
        query = self._apply_filters(
            self.db.query(Announcement),
            tenant_id=tenant_id,
            status_filter=status_filter,
            published_only=published_only,
            featured=featured,
            search=search,
        )
        return (
            query.order_by(Announcement.is_featured.desc(), Announcement.publish_date.desc(), Announcement.id.desc())
            .offset(skip)
            .limit(limit)
            .all()
        )

    def count_filtered(
        self,
        tenant_id: Optional[int] = None,
        status_filter: Optional[AnnouncementStatus] = None,
        published_only: bool = False,
        featured: Optional[bool] = None,
        search: Optional[str] = None,
    ) -> int:
        query = self._apply_filters(
            self.db.query(Announcement),
            tenant_id=tenant_id,
            status_filter=status_filter,
            published_only=published_only,
            featured=featured,
            search=search,
        )
        return query.count()

    def latest_published(self, tenant_id: int) -> Optional[Announcement]:
        return (
            self.db.query(Announcement)
            .filter(
                Announcement.tenant_id == tenant_id,
                Announcement.status == AnnouncementStatus.published,
                Announcement.publish_date <= datetime.utcnow(),
            )
            .order_by(Announcement.is_featured.desc(), Announcement.publish_date.desc(), Announcement.id.desc())
            .first()
        )

    def _apply_filters(
        self,
        query,
        tenant_id: Optional[int] = None,
        status_filter: Optional[AnnouncementStatus] = None,
        published_only: bool = False,
        featured: Optional[bool] = None,
        search: Optional[str] = None,
    ):
        if tenant_id is not None:
            query = query.filter(Announcement.tenant_id == tenant_id)
        if published_only:
            query = query.filter(
                Announcement.status == AnnouncementStatus.published,
                Announcement.publish_date <= datetime.utcnow(),
            )
        elif status_filter is not None:
            query = query.filter(Announcement.status == status_filter)
        if featured is not None:
            query = query.filter(Announcement.is_featured == featured)
        if search:
            term = f"%{search}%"
            query = query.filter(
                or_(
                    Announcement.title.ilike(term),
                    Announcement.short_description.ilike(term),
                )
            )
        return query
