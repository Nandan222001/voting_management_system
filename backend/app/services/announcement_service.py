from datetime import datetime

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.announcement import Announcement, AnnouncementStatus
from app.models.user import User, UserRole
from app.repositories.announcement_repository import AnnouncementRepository
from app.schemas.announcement import AnnouncementCreate, AnnouncementUpdate


class AnnouncementService:
    def _admin_tenant_id(self, current_user: User, requested_tenant_id: int | None = None) -> int:
        if current_user.role == UserRole.superadmin:
            if requested_tenant_id is None:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="tenant_id is required for superadmin announcement operations.",
                )
            return requested_tenant_id
        if current_user.tenant_id is None:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Tenant context is required.")
        return current_user.tenant_id

    def create(self, db: Session, data: AnnouncementCreate, current_user: User) -> Announcement:
        tenant_id = self._admin_tenant_id(current_user, data.tenant_id)
        payload = data.model_dump(exclude={"tenant_id"})
        payload["tenant_id"] = tenant_id
        payload["created_by"] = current_user.id
        return AnnouncementRepository(db).create(payload)

    def update(self, db: Session, announcement_id: int, data: AnnouncementUpdate, current_user: User) -> Announcement:
        announcement = self.get_for_admin(db, announcement_id, current_user)
        payload = data.model_dump(exclude_unset=True)
        return AnnouncementRepository(db).update(announcement, payload)

    def delete(self, db: Session, announcement_id: int, current_user: User) -> None:
        announcement = self.get_for_admin(db, announcement_id, current_user)
        db.delete(announcement)
        db.commit()

    def get_for_admin(self, db: Session, announcement_id: int, current_user: User) -> Announcement:
        announcement = AnnouncementRepository(db).get_by_id(announcement_id)
        if announcement is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Announcement not found.")
        if current_user.role != UserRole.superadmin and announcement.tenant_id != current_user.tenant_id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied.")
        return announcement

    def get_public(self, db: Session, announcement_id: int, tenant_id: int) -> Announcement:
        announcement = AnnouncementRepository(db).get_by_id(announcement_id)
        if (
            announcement is None
            or announcement.tenant_id != tenant_id
            or announcement.status != AnnouncementStatus.published
            or announcement.publish_date > datetime.utcnow()
        ):
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Announcement not found.")
        return announcement

    def list_admin(
        self,
        db: Session,
        current_user: User,
        skip: int,
        limit: int,
        status_filter: AnnouncementStatus | None = None,
        search: str | None = None,
        tenant_id: int | None = None,
    ) -> tuple[list[Announcement], int]:
        scoped_tenant_id = None if current_user.role == UserRole.superadmin else current_user.tenant_id
        if current_user.role == UserRole.superadmin and tenant_id is not None:
            scoped_tenant_id = tenant_id
        repo = AnnouncementRepository(db)
        items = repo.list_filtered(skip=skip, limit=limit, tenant_id=scoped_tenant_id, status_filter=status_filter, search=search)
        total = repo.count_filtered(tenant_id=scoped_tenant_id, status_filter=status_filter, search=search)
        return items, total

    def list_public(self, db: Session, tenant_id: int, skip: int, limit: int) -> tuple[list[Announcement], int]:
        repo = AnnouncementRepository(db)
        items = repo.list_filtered(skip=skip, limit=limit, tenant_id=tenant_id, published_only=True)
        total = repo.count_filtered(tenant_id=tenant_id, published_only=True)
        return items, total

    def latest(self, db: Session, tenant_id: int) -> Announcement | None:
        return AnnouncementRepository(db).latest_published(tenant_id)

    def set_status(
        self,
        db: Session,
        announcement_id: int,
        next_status: AnnouncementStatus,
        current_user: User,
    ) -> Announcement:
        announcement = self.get_for_admin(db, announcement_id, current_user)
        return AnnouncementRepository(db).update(announcement, {"status": next_status})


announcement_service = AnnouncementService()
