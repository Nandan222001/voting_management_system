from typing import Optional

from fastapi import APIRouter, Depends, Query, status
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session

from app.config.database import get_db
from app.middlewares.auth_middleware import get_current_user, require_admin
from app.models.nomination import NominationStatus
from app.models.user import User
from app.schemas.nomination import (
    NominationListResponse,
    NominationResponse,
    NominationUpdate,
)
from app.services.nomination_service import nomination_service
from app.utils.response import success_response

router = APIRouter(prefix="/nominations", tags=["Nominations"])


def _serialize(nomination) -> dict:
    return NominationResponse.model_validate(nomination).model_dump(mode="json")


@router.get(
    "/",
    response_model=NominationListResponse,
    summary="List nominations for admins",
)
def list_nominations(
    page: int = Query(default=1, ge=1),
    per_page: int = Query(default=20, ge=1, le=100),
    election_id: Optional[int] = Query(default=None),
    user_id: Optional[int] = Query(default=None),
    status_filter: Optional[NominationStatus] = Query(default=None, alias="status"),
    search: Optional[str] = Query(default=None),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
) -> JSONResponse:
    skip = (page - 1) * per_page
    nominations, total = nomination_service.list_nominations(
        db=db,
        current_user=current_user,
        skip=skip,
        limit=per_page,
        election_id=election_id,
        user_id=user_id,
        status_filter=status_filter,
        search=search,
    )
    
    data = NominationListResponse(
        total=total,
        page=page,
        per_page=per_page,
        items=[NominationResponse.model_validate(item) for item in nominations],
    )
    
    return success_response(
        data=data.model_dump(mode="json"),
        message="Nominations retrieved successfully."
    )


@router.get(
    "/my",
    response_model=NominationListResponse,
    summary="List nominations submitted by the current user",
)
def list_my_nominations(
    page: int = Query(default=1, ge=1),
    per_page: int = Query(default=20, ge=1, le=100),
    election_id: Optional[int] = Query(default=None),
    status_filter: Optional[NominationStatus] = Query(default=None, alias="status"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> NominationListResponse:
    skip = (page - 1) * per_page
    nominations, total = nomination_service.list_my_nominations(
        db=db,
        current_user=current_user,
        skip=skip,
        limit=per_page,
        election_id=election_id,
        status_filter=status_filter,
    )
    return NominationListResponse(
        total=total,
        page=page,
        per_page=per_page,
        items=[NominationResponse.model_validate(item) for item in nominations],
    )


@router.get(
    "/stats",
    summary="Get nomination statistics",
)
def get_nomination_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
) -> JSONResponse:
    stats = nomination_service.get_stats(db, current_user)
    return success_response(data=stats, message="Nomination statistics retrieved.")


@router.get(
    "/{nomination_id}",
    response_model=NominationResponse,
    summary="Get nomination details",
)
def get_nomination(
    nomination_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> NominationResponse:
    nomination = nomination_service.get_nomination(db, nomination_id, current_user)
    return NominationResponse.model_validate(nomination)


@router.put(
    "/{nomination_id}",
    response_model=NominationResponse,
    summary="Update a pending nomination",
)
def update_nomination(
    nomination_id: int,
    payload: NominationUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> NominationResponse:
    nomination = nomination_service.update_nomination(
        db=db,
        nomination_id=nomination_id,
        data=payload,
        current_user=current_user,
    )
    return NominationResponse.model_validate(nomination)


@router.post(
    "/{nomination_id}/approve",
    response_model=NominationResponse,
    summary="Approve a nomination",
)
def approve_nomination(
    nomination_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
) -> NominationResponse:
    nomination = nomination_service.set_status(
        db=db,
        nomination_id=nomination_id,
        next_status=NominationStatus.approved,
        current_user=current_user,
    )
    return NominationResponse.model_validate(nomination)


@router.post(
    "/{nomination_id}/reject",
    response_model=NominationResponse,
    summary="Reject a nomination",
)
def reject_nomination(
    nomination_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
) -> NominationResponse:
    nomination = nomination_service.set_status(
        db=db,
        nomination_id=nomination_id,
        next_status=NominationStatus.rejected,
        current_user=current_user,
    )
    return NominationResponse.model_validate(nomination)


@router.post(
    "/{nomination_id}/suspend",
    response_model=NominationResponse,
    summary="Suspend a nomination",
)
def suspend_nomination(
    nomination_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
) -> NominationResponse:
    nomination = nomination_service.set_status(
        db=db,
        nomination_id=nomination_id,
        next_status=NominationStatus.suspended,
        current_user=current_user,
    )
    return NominationResponse.model_validate(nomination)


@router.delete(
    "/{nomination_id}",
    status_code=status.HTTP_200_OK,
    summary="Delete a nomination",
)
def delete_nomination(
    nomination_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> JSONResponse:
    nomination_service.delete_nomination(db, nomination_id, current_user)
    return success_response(message=f"Nomination {nomination_id} deleted successfully.")
