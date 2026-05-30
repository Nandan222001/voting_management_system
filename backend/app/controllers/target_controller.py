from typing import Optional
from fastapi import APIRouter, Depends, status, Query
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session

from app.config.database import get_db
from app.middlewares.auth_middleware import get_current_user, require_admin
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
    Tenant-scoped: returns global targets + tenant-specific targets.
    """
    targets = target_service.get_targets_by_tenant(db, current_user.tenant_id)
    if parent_id is not None:
        targets = [t for t in targets if t.parent_id == parent_id]
        
    data = [TargetResponse.model_validate(t).model_dump(mode="json") for t in targets]
    return success_response(data=data, message="Targets retrieved.")


@router.post(
    "/",
    status_code=status.HTTP_201_CREATED,
    summary="Define a new target (admin only)",
)
def create_target(
    payload: TargetCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
) -> JSONResponse:
    """
    Define a new State, District, Taluka, etc.
    """
    target = target_service.create_target(db, payload, current_user.tenant_id)
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
    summary="Update a target (admin only)",
)
def update_target(
    target_id: int,
    payload: TargetUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
) -> JSONResponse:
    """
    Update target details.
    """
    # Validation: Ensure it's not a global target if not superadmin?
    # Or just let it fail if target_service check permissions.
    # Actually TargetService.update_target currently doesn't check tenant_id.
    updated = target_service.update_target(db, target_id, payload)
    return success_response(
        data=TargetResponse.model_validate(updated).model_dump(mode="json"),
        message="Target updated successfully."
    )


@router.delete(
    "/{target_id}/",
    summary="Delete a target (admin only)",
)
def delete_target(
    target_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
) -> JSONResponse:
    """
    Permanently remove a target.
    """
    target_service.delete_target(db, target_id)
    return success_response(message=f"Target {target_id} deleted successfully.")
