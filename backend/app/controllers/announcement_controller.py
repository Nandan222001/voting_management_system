from typing import Optional

from fastapi import APIRouter, Depends, Query, status
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session

from app.config.database import get_db
from app.middlewares.auth_middleware import get_header_tenant_id, require_admin
from app.models.announcement import AnnouncementStatus
from app.models.user import User
from app.schemas.announcement import AnnouncementCreate, AnnouncementListResponse, AnnouncementResponse, AnnouncementUpdate
from app.services.announcement_service import announcement_service
from app.utils.response import success_response

router = APIRouter(prefix="/announcements", tags=["Announcements"])


def _tenant_or_400(tenant_id: Optional[int]) -> int:
    if tenant_id is None:
        from fastapi import HTTPException

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Tenant ID is required. Please provide X-Tenant-ID header or a valid token.",
        )
    return tenant_id


@router.get("/", summary="List announcements for admins")
def list_announcements(
    page: int = Query(default=1, ge=1),
    per_page: int = Query(default=20, ge=1, le=100),
    status_filter: Optional[AnnouncementStatus] = Query(default=None, alias="status"),
    search: Optional[str] = Query(default=None),
    tenant_id: Optional[int] = Query(default=None),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
) -> JSONResponse:
    items, total = announcement_service.list_admin(
        db=db,
        current_user=current_user,
        skip=(page - 1) * per_page,
        limit=per_page,
        status_filter=status_filter,
        search=search,
        tenant_id=tenant_id,
    )
    data = AnnouncementListResponse(
        total=total,
        page=page,
        per_page=per_page,
        items=[AnnouncementResponse.model_validate(item) for item in items],
    )
    return success_response(data=data.model_dump(mode="json"), message="Announcements retrieved successfully.")


@router.post("/", summary="Create announcement")
def create_announcement(
    payload: AnnouncementCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
) -> JSONResponse:
    announcement = announcement_service.create(db, payload, current_user)
    return success_response(
        data=AnnouncementResponse.model_validate(announcement).model_dump(mode="json"),
        message="Announcement created successfully.",
        status_code=status.HTTP_201_CREATED,
    )


@router.get("/public", summary="List published announcements")
def list_public_announcements(
    page: int = Query(default=1, ge=1),
    per_page: int = Query(default=20, ge=1, le=100),
    tenant_id: int = Depends(get_header_tenant_id),
    db: Session = Depends(get_db),
) -> JSONResponse:
    scoped_tenant_id = _tenant_or_400(tenant_id)
    items, total = announcement_service.list_public(db, scoped_tenant_id, (page - 1) * per_page, per_page)
    data = AnnouncementListResponse(
        total=total,
        page=page,
        per_page=per_page,
        items=[AnnouncementResponse.model_validate(item) for item in items],
    )
    return success_response(data=data.model_dump(mode="json"), message="Published announcements retrieved successfully.")


@router.get("/latest", summary="Get latest published announcement")
def latest_announcement(
    tenant_id: int = Depends(get_header_tenant_id),
    db: Session = Depends(get_db),
) -> JSONResponse:
    scoped_tenant_id = _tenant_or_400(tenant_id)
    announcement = announcement_service.latest(db, scoped_tenant_id)
    data = AnnouncementResponse.model_validate(announcement).model_dump(mode="json") if announcement else None
    return success_response(data=data, message="Latest announcement retrieved successfully.")


@router.get("/public/{announcement_id}", summary="Get published announcement details")
def get_public_announcement(
    announcement_id: int,
    tenant_id: int = Depends(get_header_tenant_id),
    db: Session = Depends(get_db),
) -> JSONResponse:
    announcement = announcement_service.get_public(db, announcement_id, _tenant_or_400(tenant_id))
    return success_response(data=AnnouncementResponse.model_validate(announcement).model_dump(mode="json"))


@router.get("/{announcement_id}", summary="Get announcement details for admins")
def get_announcement(
    announcement_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
) -> JSONResponse:
    announcement = announcement_service.get_for_admin(db, announcement_id, current_user)
    return success_response(data=AnnouncementResponse.model_validate(announcement).model_dump(mode="json"))


@router.put("/{announcement_id}", summary="Update announcement")
def update_announcement(
    announcement_id: int,
    payload: AnnouncementUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
) -> JSONResponse:
    announcement = announcement_service.update(db, announcement_id, payload, current_user)
    return success_response(data=AnnouncementResponse.model_validate(announcement).model_dump(mode="json"), message="Announcement updated successfully.")


@router.post("/{announcement_id}/publish", summary="Publish announcement")
def publish_announcement(
    announcement_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
) -> JSONResponse:
    announcement = announcement_service.set_status(db, announcement_id, AnnouncementStatus.published, current_user)
    return success_response(data=AnnouncementResponse.model_validate(announcement).model_dump(mode="json"), message="Announcement published successfully.")


@router.post("/{announcement_id}/unpublish", summary="Unpublish announcement")
def unpublish_announcement(
    announcement_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
) -> JSONResponse:
    announcement = announcement_service.set_status(db, announcement_id, AnnouncementStatus.draft, current_user)
    return success_response(data=AnnouncementResponse.model_validate(announcement).model_dump(mode="json"), message="Announcement unpublished successfully.")


@router.delete("/{announcement_id}", summary="Delete announcement")
def delete_announcement(
    announcement_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
) -> JSONResponse:
    announcement_service.delete(db, announcement_id, current_user)
    return success_response(message=f"Announcement {announcement_id} deleted successfully.")
