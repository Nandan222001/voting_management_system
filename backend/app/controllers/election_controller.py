"""
Election controller.

Provides the /api/v1/elections router with endpoints for listing, creating,
retrieving, updating, deleting, activating, closing elections, and statistics.
Listing and retrieval are tenant-scoped for authenticated users.
Create, update, delete, activate, close, and stats require admin privileges.

Multi-tenancy: every write operation and admin-only read is scoped to the
current user's ``tenant_id``.  Superadmin users (``tenant_id=None``) may
optionally filter by an explicit ``tenant_id`` query parameter.
"""

from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session

from app.config.database import get_db
from app.middlewares.auth_middleware import (
    get_current_user,
    get_header_tenant_id,
    require_admin,
)
from app.models.election import ElectionStatus
from app.models.user import User, UserRole
from app.schemas.election import ElectionCreate, ElectionResponse, ElectionUpdate
from app.services.election_service import election_service
from app.utils.response import paginated_response, success_response

router = APIRouter(prefix="/elections", tags=["Elections"])


# ---------------------------------------------------------------------------
# GET /public — List elections for registration/pre-auth
# ---------------------------------------------------------------------------

@router.get(
    "/public",
    summary="List elections (Public, scoped by tenant)",
)
def get_public_elections(
    tenant_id: Optional[int] = Query(None, description="Filter by tenant ID (web)"),
    header_tenant_id: Optional[int] = Depends(get_header_tenant_id),
    db: Session = Depends(get_db),
) -> JSONResponse:
    """
    Returns a list of active and upcoming elections.

    If ``tenant_id`` or ``X-Tenant-ID`` is provided, results are scoped to that
    tenant. If omitted, the system defaults to the only tenant if exactly one
    exists, otherwise it returns active elections from all tenants (global view).
    """
    effective_tenant_id = tenant_id or header_tenant_id

    # Fallback: if no tenant_id provided, try to default to the only tenant if
    # there is only one active tenant in the system.
    if not effective_tenant_id:
        from app.models.tenant import Tenant, TenantStatus
        tenants = db.query(Tenant).filter(Tenant.status == TenantStatus.active).limit(2).all()
        if len(tenants) == 1:
            effective_tenant_id = tenants[0].id

    elections, total = election_service.get_all(
        db,
        skip=0,
        limit=100,
        status_filter=ElectionStatus.active,
        tenant_id=effective_tenant_id,
    )

    data = [ElectionResponse.model_validate(e).model_dump(mode="json") for e in elections]
    return success_response(
        data=data,
        message="Public elections retrieved." if effective_tenant_id else "Global public elections retrieved."
    )

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
    summary="List elections (authenticated, filterable by status and title)",
)
def list_elections(
    page: int = Query(default=1, ge=1, description="Page number (1-indexed)"),
    per_page: int = Query(default=20, ge=1, le=100, description="Items per page"),
    status: Optional[str] = Query(
        default=None, description="Filter by election status (e.g., active, draft, closed, or 'all')"
    ),
    search: Optional[str] = Query(
        default=None, description="Search by node title (case-insensitive)"
    ),
    tenant_id: Optional[int] = Query(
        default=None,
        description="Filter elections by tenant (superadmin) or auto-scoped.",
    ),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> JSONResponse:
    """
    Return a paginated list of elections.

    - **page**: 1-indexed page number.
    - **per_page**: Number of elections per page (max 100).
    - **status**: Optional status filter (``draft``, ``active``, ``closed``,
      ``cancelled``, or ``all``).
    - **search**: Optional search term for the election title.
    - **tenant_id**: Superadmin may supply this to scope to a specific tenant;
      all other authenticated users are automatically scoped to their own tenant.

    Members see only their tenant's elections, filtered by their district scope.
    """
    # Determine effective tenant scope.
    if current_user.role == UserRole.superadmin:
        effective_tenant_id = tenant_id  # superadmin may or may not filter
    else:
        effective_tenant_id = current_user.tenant_id
    
    member_district = (
        current_user.district
        if current_user.role == UserRole.voter
        else None
    )

    # Resolve "all" status to None for the service layer
    status_filter = None if not status or status.lower() == "all" else status.lower()

    skip = (page - 1) * per_page
    elections, total = election_service.get_all(
        db,
        skip=skip,
        limit=per_page,
        status_filter=status_filter,
        search_filter=search,
        tenant_id=effective_tenant_id,
        member_district=member_district,
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
    tenant_id: Optional[int] = Query(
        default=None,
        description="Required for superadmin users. Tenant admins are always scoped to their own tenant.",
    ),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
) -> ElectionResponse:
    """
    Create a new election. Requires admin privileges.

    The election starts in ``draft`` status and is scoped to the caller's tenant.
    """
    effective_tenant_id = (
        election_service.resolve_superadmin_tenant_id(db, tenant_id)
        if current_user.role == UserRole.superadmin
        else current_user.tenant_id
    )

    election = election_service.create_election(
        db,
        payload,
        current_user.id,
        tenant_id=effective_tenant_id,
    )
    return ElectionResponse.model_validate(election)



# ---------------------------------------------------------------------------
# GET /{election_id}
# ---------------------------------------------------------------------------

@router.get(
    "/{election_id}",
    summary="Get a single election by ID (authenticated)",
)
def get_election(
    election_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> JSONResponse:
    """
    Fetch a single election by primary key.
    Authenticated users are automatically scoped to their own tenant.
    Raises 404 if not found or not accessible.
    """
    effective_tenant_id: Optional[int] = None
    if current_user.role != UserRole.superadmin:
        effective_tenant_id = current_user.tenant_id

    election = election_service.get_by_id(db, election_id, tenant_id=effective_tenant_id)
    if (
        current_user.role == UserRole.voter
        and election.target_district
        and election.target_district != current_user.district
    ):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Election with id={election_id} not found.",
        )
    return success_response(
        data=ElectionResponse.model_validate(election).model_dump(mode="json"),
        message="Election details retrieved."
    )


# ---------------------------------------------------------------------------
# PUT /{election_id}
# ---------------------------------------------------------------------------

@router.put(
    "/{election_id}",
    summary="Update an election (admin only)",
)
def update_election(
    election_id: int,
    payload: ElectionUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
) -> JSONResponse:
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
    return success_response(
        data=ElectionResponse.model_validate(updated).model_dump(mode="json"),
        message="Election updated successfully."
    )


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
# PATCH /{election_id}/activate
# ---------------------------------------------------------------------------

@router.patch(
    "/{election_id}/activate",
    summary="Activate a draft election (admin only)",
)
def activate_election(
    election_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
) -> JSONResponse:
    """
    Transition a draft election to ``active``, opening it for voting.
    Requires admin privileges.  Scoped to the caller's tenant.
    """
    updated = election_service.activate_election(
        db,
        election_id,
        tenant_id=current_user.tenant_id,
    )
    return success_response(
        data=ElectionResponse.model_validate(updated).model_dump(mode="json"),
        message="Election activated successfully."
    )


# ---------------------------------------------------------------------------
# PATCH /{election_id}/close
# ---------------------------------------------------------------------------

@router.patch(
    "/{election_id}/close",
    summary="Close an active election (admin only)",
)
def close_election(
    election_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
) -> JSONResponse:
    """
    Transition an active election to ``closed``, stopping further voting.
    Requires admin privileges.  Scoped to the caller's tenant.
    """
    updated = election_service.close_election(
        db,
        election_id,
        tenant_id=current_user.tenant_id,
    )
    return success_response(
        data=ElectionResponse.model_validate(updated).model_dump(mode="json"),
        message="Election closed successfully."
    )
