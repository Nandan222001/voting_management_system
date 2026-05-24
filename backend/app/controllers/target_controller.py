from fastapi import APIRouter, Depends, status
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
    summary="List all targets for the current tenant",
)
def get_targets(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> JSONResponse:
    """
    Returns all geographical/administrative targets (States, Districts, etc.)
    defined by the current tenant.
    """
    targets = target_service.get_targets_by_tenant(db, current_user.tenant_id)
    data = [TargetResponse.model_validate(t).model_dump(mode="json") for t in targets]
    return success_response(data=data, message="Targets retrieved.")


@router.post(
    "/",
    status_code=status.HTTP_201_CREATED,
    response_model=TargetResponse,
    summary="Define a new target (admin only)",
)
def create_target(
    payload: TargetCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
) -> TargetResponse:
    """
    Define a new State, District, or other area. Requires admin privileges.
    """
    target = target_service.create_target(db, payload, current_user.tenant_id)
    return TargetResponse.model_validate(target)


@router.get(
    "/{target_id}",
    response_model=TargetResponse,
    summary="Get a single target by ID",
)
def get_target(
    target_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> TargetResponse:
    """
    Fetch details for a specific target. Ensures multi-tenant isolation.
    """
    target = target_service.get_target_by_id(db, target_id)
    if target.tenant_id != current_user.tenant_id:
        from fastapi import HTTPException
        raise HTTPException(status_code=403, detail="Access denied")
    return TargetResponse.model_validate(target)


@router.put(
    "/{target_id}",
    response_model=TargetResponse,
    summary="Update a target (admin only)",
)
def update_target(
    target_id: int,
    payload: TargetUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
) -> TargetResponse:
    """
    Update target details. Requires admin privileges.
    """
    updated = target_service.update_target(db, target_id, payload, current_user.tenant_id)
    return TargetResponse.model_validate(updated)


@router.delete(
    "/{target_id}",
    summary="Delete a target (admin only)",
)
def delete_target(
    target_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
) -> JSONResponse:
    """
    Permanently remove a target. Requires admin privileges.
    Cannot delete if sub-targets exist.
    """
    target_service.delete_target(db, target_id, current_user.tenant_id)
    return success_response(message=f"Target {target_id} deleted successfully.")
