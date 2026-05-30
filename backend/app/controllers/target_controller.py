from typing import Optional
from fastapi import APIRouter, Depends, status, Query
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session

from app.config.database import get_db
from app.middlewares.auth_middleware import get_current_user, get_header_tenant_id, require_superadmin
from app.models.user import User
from app.schemas.target import (
    TargetCreate,
    TargetResponse,
    TargetUpdate,
)
from app.services.target_service import target_service
from app.utils.response import success_response

router = APIRouter(prefix="/targets", tags=["Targets"])


@router.get(
    "/",
    summary="List targets (filterable by parent)",
)
def get_targets(
    parent_id: Optional[int] = Query(None, description="Filter by parent target ID"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> JSONResponse:
    """
    Returns geographical/administrative targets.
    Can be filtered by parent_id to support dependent dropdowns.
    """
    targets = target_service.TargetRepository(db).get_all(parent_id=parent_id)
    data = [TargetResponse.model_validate(t).model_dump(mode="json") for t in targets]
    return success_response(data=data, message="Targets retrieved.")


@router.get(
    "/public",
    summary="List targets (Public, filterable by parent/type)",
)
def get_public_targets(
    parent_id: Optional[int] = Query(None),
    target_type: Optional[str] = Query(None),
    tenant_id: Optional[int] = Query(None, description="Mobile clients may omit this and use X-Tenant-ID header instead."),
    header_tenant_id: Optional[int] = Depends(get_header_tenant_id),
    db: Session = Depends(get_db),
) -> JSONResponse:
    """
    Publicly list targets. Useful for registration dropdowns.
    Tenant can be identified via the ``tenant_id`` query parameter (web) or
    the ``X-Tenant-ID`` header (mobile).
    """
    effective_tenant_id = tenant_id or header_tenant_id
    query = db.query(target_service.TargetRepository.model)
    if parent_id is not None:
        query = query.filter_by(parent_id=parent_id)
    if target_type:
        query = query.filter_by(type=target_type)
    if effective_tenant_id:
        query = query.filter_by(tenant_id=effective_tenant_id)

    targets = query.all()
    data = [TargetResponse.model_validate(t).model_dump(mode="json") for t in targets]
    return success_response(data=data, message="Public targets retrieved.")


@router.post(
    "/",
    status_code=status.HTTP_201_CREATED,
    summary="Define a new target (superadmin only)",
)
def create_target(
    payload: TargetCreate,
    tenant_id: Optional[int] = Query(None, description="Optional tenant scoping"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_superadmin),
) -> JSONResponse:
    """
    Define a new State, District, Taluka, etc. Requires superadmin privileges.
    """
    target = target_service.create_target(db, payload, tenant_id)
    return success_response(
        data=TargetResponse.model_validate(target).model_dump(mode="json"),
        message="Target created successfully.",
        status_code=status.HTTP_201_CREATED
    )


@router.get(
    "/{target_id}/",
    summary="Get a single target by ID",
)
def get_target(
    target_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> JSONResponse:
    """
    Fetch details for a specific target.
    """
    target = target_service.get_target_by_id(db, target_id)
    return success_response(
        data=TargetResponse.model_validate(target).model_dump(mode="json"),
        message="Target details retrieved."
    )


@router.put(
    "/{target_id}/",
    summary="Update a target (superadmin only)",
)
def update_target(
    target_id: int,
    payload: TargetUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_superadmin),
) -> JSONResponse:
    """
    Update target details. Requires superadmin privileges.
    """
    updated = target_service.update_target(db, target_id, payload)
    return success_response(
        data=TargetResponse.model_validate(updated).model_dump(mode="json"),
        message="Target updated successfully."
    )


@router.delete(
    "/{target_id}/",
    summary="Delete a target (superadmin only)",
)
def delete_target(
    target_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_superadmin),
) -> JSONResponse:
    """
    Permanently remove a target. Requires superadmin privileges.
    Cannot delete if sub-targets exist.
    """
    target_service.delete_target(db, target_id)
    return success_response(message=f"Target {target_id} deleted successfully.")
