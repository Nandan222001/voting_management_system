"""
User management controller.

Provides the /api/v1/users router. All endpoints require admin privileges.
Supports paginated listing, single-user retrieval, profile updates, deletion,
approval, blocking, and a statistics overview.

Multi-tenancy: every operation is automatically scoped to the current admin's
``tenant_id``.  Superadmin users (``tenant_id=None``) see all users across
every tenant.
"""

from typing import Optional

from fastapi import APIRouter, Depends, Query, status
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session

from app.config.database import get_db
from app.middlewares.auth_middleware import require_admin
from app.models.user import User, UserRole, UserStatus
from app.schemas.user import UserResponse, UserUpdate
from app.services.user_service import user_service
from app.utils.response import paginated_response, success_response

router = APIRouter(
    prefix="/users",
    tags=["Users"],
)


# ---------------------------------------------------------------------------
# GET /
# ---------------------------------------------------------------------------

@router.get(
    "/",
    summary="List all users (paginated, filterable)",
)
def list_users(
    page: int = Query(default=1, ge=1, description="Page number (1-indexed)"),
    per_page: int = Query(default=20, ge=1, le=100, description="Items per page"),
    role: Optional[UserRole] = Query(default=None, description="Filter by role"),
    status: Optional[UserStatus] = Query(default=None, description="Filter by status"),
    designation: Optional[str] = Query(default=None, description="Filter by member designation"),
    district: Optional[str] = Query(default=None, description="Filter by member district"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
) -> JSONResponse:
    """
    Return a paginated list of users scoped to the caller's tenant.

    Query parameters:
    - **page**: 1-indexed page number.
    - **per_page**: Number of users per page (max 100).
    - **role**: Optional ``admin`` or ``voter`` filter.
    - **status**: Optional ``active``, ``pending``, or ``blocked`` filter.
    - **designation**: Optional member designation filter.
    - **district**: Optional member district filter.

    Superadmin callers (``tenant_id=None``) see users from all tenants.
    """
    skip = (page - 1) * per_page
    users, total = user_service.get_all_users(
        db,
        skip=skip,
        limit=per_page,
        role=role,
        status_filter=status,
        tenant_id=current_user.tenant_id,
        designation=designation,
        district=district,
    )
    data = [UserResponse.model_validate(u).model_dump(mode="json") for u in users]
    return paginated_response(data=data, total=total, page=page, per_page=per_page)


# ---------------------------------------------------------------------------
# GET /stats/overview  — must be declared BEFORE /{user_id}
# ---------------------------------------------------------------------------

@router.get(
    "/stats/overview",
    summary="User statistics overview",
)
def user_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
) -> JSONResponse:
    """
    Return aggregate user statistics scoped to the caller's tenant.
    Superadmin callers receive platform-wide totals.
    """
    stats = user_service.get_dashboard_stats(db, tenant_id=current_user.tenant_id)
    return success_response(data=stats, message="User statistics retrieved.")


# ---------------------------------------------------------------------------
# GET /{user_id}
# ---------------------------------------------------------------------------

@router.get(
    "/{user_id}",
    summary="Get a single user by ID",
)
def get_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
) -> JSONResponse:
    """
    Fetch a user by their primary key, scoped to the caller's tenant.
    Raises 404 if not found or not in the caller's tenant.
    """
    user = user_service.get_user_by_id(db, user_id, tenant_id=current_user.tenant_id)
    return success_response(
        data=UserResponse.model_validate(user).model_dump(mode="json"),
        message="User details retrieved."
    )


# ---------------------------------------------------------------------------
# PUT /{user_id}
# ---------------------------------------------------------------------------

@router.put(
    "/{user_id}",
    summary="Update a user",
)
def update_user(
    user_id: int,
    payload: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
) -> JSONResponse:
    """
    Apply a partial update to the user identified by ``user_id``.
    Only supplied fields are changed.
    """
    updated = user_service.update_user(db, user_id, payload)
    return success_response(
        data=UserResponse.model_validate(updated).model_dump(mode="json"),
        message="User updated successfully."
    )


# ---------------------------------------------------------------------------
# DELETE /{user_id}
# ---------------------------------------------------------------------------

@router.delete(
    "/{user_id}",
    status_code=status.HTTP_200_OK,
    summary="Delete a user",
)
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
) -> JSONResponse:
    """
    Permanently remove the user identified by ``user_id``.
    Scoped to the caller's tenant.  Raises 404 if not found or not in tenant.
    """
    user_service.delete_user(db, user_id, tenant_id=current_user.tenant_id)
    return success_response(message=f"User {user_id} deleted successfully.")


# ---------------------------------------------------------------------------
# POST /{user_id}/approve
# ---------------------------------------------------------------------------

@router.post(
    "/{user_id}/approve",
    response_model=UserResponse,
    summary="Approve a pending user",
)
def approve_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
) -> UserResponse:
    """
    Set a pending user's status to ``active``, allowing them to log in.
    Scoped to the caller's tenant.  Raises 400 if not in ``pending`` status.
    """
    updated = user_service.approve_user(db, user_id, tenant_id=current_user.tenant_id)
    return UserResponse.model_validate(updated)


# ---------------------------------------------------------------------------
# POST /{user_id}/block
# ---------------------------------------------------------------------------

@router.post(
    "/{user_id}/block",
    response_model=UserResponse,
    summary="Block a user",
)
def block_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
) -> UserResponse:
    """
    Set a user's status to ``blocked``, preventing further logins.
    Scoped to the caller's tenant.  Raises 400 if already blocked.
    """
    updated = user_service.block_user(db, user_id, tenant_id=current_user.tenant_id)
    return UserResponse.model_validate(updated)


# ---------------------------------------------------------------------------
# POST /{user_id}/unblock
# ---------------------------------------------------------------------------

@router.post(
    "/{user_id}/unblock",
    response_model=UserResponse,
    summary="Unblock a user",
)
def unblock_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
) -> UserResponse:
    """
    Set a user's status to ``active``, allowing logins again.
    Scoped to the caller's tenant.  Raises 400 if not blocked.
    """
    updated = user_service.unblock_user(db, user_id, tenant_id=current_user.tenant_id)
    return UserResponse.model_validate(updated)
