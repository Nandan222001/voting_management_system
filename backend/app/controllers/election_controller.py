"""
Election controller.

Provides the /api/v1/elections router with endpoints for listing, creating,
retrieving, updating, deleting, activating, closing elections, and statistics.
Public listing and retrieval are available without authentication.
Create, update, delete, activate, close, and stats require admin privileges.

Multi-tenancy: every write operation and admin-only read is scoped to the
current user's ``tenant_id``.  Superadmin users (``tenant_id=None``) may
optionally filter by an explicit ``tenant_id`` query parameter.
"""

from typing import Optional

from fastapi import APIRouter, Depends, Query, status
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session

from app.config.database import get_db
from app.middlewares.auth_middleware import get_current_user, require_admin
from app.models.election import ElectionStatus
from app.models.user import User, UserRole
from app.schemas.election import ElectionCreate, ElectionResponse, ElectionUpdate
from app.services.election_service import election_service
from app.utils.response import paginated_response, success_response

router = APIRouter(prefix="/api/v1/elections", tags=["Elections"])


# ---------------------------------------------------------------------------
# GET /stats/overview — declared before /{election_id} to avoid path conflict
# ---------------------------------------------------------------------------

@router.get(
    "/stats/overview",
    summary="Election statistics overview (admin only)",
)
def election_stats(
    tenant_id: Optional[int] = Query(
        default=None,
        description="(Superadmin only) Filter stats to a specific tenant.",
    ),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
) -> JSONResponse:
    """
    Return aggregate election statistics: totals by status.
    Requires admin privileges.

    Admins see only their own tenant's data.  Superadmin may pass an optional
    ``tenant_id`` query parameter to scope results.
    """
    # Non-superadmin admins are always scoped to their own tenant.
    effective_tenant_id = (
        tenant_id if current_user.role == UserRole.superadmin
        else current_user.tenant_id
    )
    stats = election_service.get_stats(db, tenant_id=effective_tenant_id)
    return success_response(data=stats, message="Election statistics retrieved.")


# ---------------------------------------------------------------------------
# GET /
# ---------------------------------------------------------------------------

@router.get(
    "/",
    summary="List elections (public, filterable by status)",
)
def list_elections(
    page: int = Query(default=1, ge=1, description="Page number (1-indexed)"),
    per_page: int = Query(default=20, ge=1, le=100, description="Items per page"),
    status: Optional[ElectionStatus] = Query(
        default=None, description="Filter by election status"
    ),
    tenant_id: Optional[int] = Query(
        default=None,
        description="Filter elections by tenant (superadmin) or auto-scoped.",
    ),
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user),
) -> JSONResponse:
    """
    Return a paginated list of elections.

    - **page**: 1-indexed page number.
    - **per_page**: Number of elections per page (max 100).
    - **status**: Optional status filter (``draft``, ``active``, ``closed``,
      ``cancelled``).
    - **tenant_id**: Superadmin may supply this to scope to a specific tenant;
      all other authenticated users are automatically scoped to their own tenant.

    Authenticated users see only their tenant's elections.
    """
    # Determine effective tenant scope.
    if current_user is not None:
        if current_user.role == UserRole.superadmin:
            effective_tenant_id = tenant_id  # superadmin may or may not filter
        else:
            effective_tenant_id = current_user.tenant_id
    else:
        effective_tenant_id = tenant_id  # unauthenticated: use explicit param

    skip = (page - 1) * per_page
    elections, total = election_service.get_all(
        db,
        skip=skip,
        limit=per_page,
        status_filter=status,
        tenant_id=effective_tenant_id,
    )
    data = []
    for election in elections:
        item = ElectionResponse.model_validate(election).model_dump(mode="json")
        data.append(item)
    return paginated_response(data=data, total=total, page=page, per_page=per_page)


# ---------------------------------------------------------------------------
# POST /
# ---------------------------------------------------------------------------

@router.post(
    "/",
    status_code=status.HTTP_201_CREATED,
    response_model=ElectionResponse,
    summary="Create a new election (admin only)",
)
def create_election(
    payload: ElectionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
) -> ElectionResponse:
    """
    Create a new election. Requires admin privileges.
    The election starts in ``draft`` status and is scoped to the caller's tenant.
    """
    election = election_service.create_election(
        db,
        payload,
        current_user.id,
        tenant_id=current_user.tenant_id,
    )
    return ElectionResponse.model_validate(election)


# ---------------------------------------------------------------------------
# GET /{election_id}
# ---------------------------------------------------------------------------

@router.get(
    "/{election_id}",
    response_model=ElectionResponse,
    summary="Get a single election by ID (public)",
)
def get_election(
    election_id: int,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user),
) -> ElectionResponse:
    """
    Fetch a single election by primary key.
    Authenticated users are automatically scoped to their own tenant.
    Raises 404 if not found or not accessible.
    """
    effective_tenant_id: Optional[int] = None
    if current_user is not None and current_user.role != UserRole.superadmin:
        effective_tenant_id = current_user.tenant_id

    election = election_service.get_by_id(db, election_id, tenant_id=effective_tenant_id)
    return ElectionResponse.model_validate(election)


# ---------------------------------------------------------------------------
# PUT /{election_id}
# ---------------------------------------------------------------------------

@router.put(
    "/{election_id}",
    response_model=ElectionResponse,
    summary="Update an election (admin only)",
)
def update_election(
    election_id: int,
    payload: ElectionUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
) -> ElectionResponse:
    """
    Apply a partial update to an election. Requires admin privileges.
    Scoped to the caller's tenant.  Raises 400 if closed or cancelled.
    """
    updated = election_service.update_election(
        db,
        election_id,
        payload,
        tenant_id=current_user.tenant_id,
    )
    return ElectionResponse.model_validate(updated)


# ---------------------------------------------------------------------------
# DELETE /{election_id}
# ---------------------------------------------------------------------------

@router.delete(
    "/{election_id}",
    status_code=status.HTTP_200_OK,
    summary="Delete an election (admin only)",
)
def delete_election(
    election_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
) -> JSONResponse:
    """
    Permanently delete an election. Requires admin privileges.
    Only draft elections may be deleted.  Scoped to the caller's tenant.
    """
    election_service.delete_election(
        db,
        election_id,
        tenant_id=current_user.tenant_id,
    )
    return success_response(message=f"Election {election_id} deleted successfully.")


# ---------------------------------------------------------------------------
# POST /{election_id}/activate
# ---------------------------------------------------------------------------

@router.post(
    "/{election_id}/activate",
    response_model=ElectionResponse,
    summary="Activate a draft election (admin only)",
)
def activate_election(
    election_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
) -> ElectionResponse:
    """
    Transition a draft election to ``active``, opening it for voting.
    Requires admin privileges.  Scoped to the caller's tenant.
    """
    updated = election_service.activate_election(
        db,
        election_id,
        tenant_id=current_user.tenant_id,
    )
    return ElectionResponse.model_validate(updated)


# ---------------------------------------------------------------------------
# POST /{election_id}/close
# ---------------------------------------------------------------------------

@router.post(
    "/{election_id}/close",
    response_model=ElectionResponse,
    summary="Close an active election (admin only)",
)
def close_election(
    election_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
) -> ElectionResponse:
    """
    Transition an active election to ``closed``, stopping further voting.
    Requires admin privileges.  Scoped to the caller's tenant.
    """
    updated = election_service.close_election(
        db,
        election_id,
        tenant_id=current_user.tenant_id,
    )
    return ElectionResponse.model_validate(updated)
