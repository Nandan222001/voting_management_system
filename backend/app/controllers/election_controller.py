"""
Election controller.

Provides the /api/v1/elections router with endpoints for listing, creating,
retrieving, updating, deleting, activating, closing elections, and statistics.
Public listing and retrieval are available without authentication.
Create, update, delete, activate, close, and stats require admin privileges.
"""

from typing import Optional

from fastapi import APIRouter, Depends, Query, status
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session

from app.config.database import get_db
from app.middlewares.auth_middleware import get_current_user, require_admin
from app.models.election import ElectionStatus
from app.models.user import User
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
    dependencies=[Depends(require_admin)],
)
def election_stats(
    db: Session = Depends(get_db),
) -> JSONResponse:
    """
    Return aggregate election statistics: totals by status.
    Requires admin privileges.
    """
    stats = election_service.get_stats(db)
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
    db: Session = Depends(get_db),
) -> JSONResponse:
    """
    Return a paginated list of elections.

    - **page**: 1-indexed page number.
    - **per_page**: Number of elections per page (max 100).
    - **status**: Optional status filter (``draft``, ``active``, ``closed``,
      ``cancelled``).

    This endpoint is publicly accessible — no authentication required.
    """
    skip = (page - 1) * per_page
    elections, total = election_service.get_all(
        db, skip=skip, limit=per_page, status_filter=status
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
    The election starts in ``draft`` status.
    """
    election = election_service.create_election(db, payload, current_user.id)
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
) -> ElectionResponse:
    """
    Fetch a single election by primary key. Publicly accessible.
    Raises 404 if not found.
    """
    election = election_service.get_by_id(db, election_id)
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
    _: User = Depends(require_admin),
) -> ElectionResponse:
    """
    Apply a partial update to an election. Requires admin privileges.
    Raises 400 if the election is closed or cancelled.
    """
    updated = election_service.update_election(db, election_id, payload)
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
    _: User = Depends(require_admin),
) -> JSONResponse:
    """
    Permanently delete an election. Requires admin privileges.
    Only draft elections may be deleted.
    """
    election_service.delete_election(db, election_id)
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
    _: User = Depends(require_admin),
) -> ElectionResponse:
    """
    Transition a draft election to ``active``, opening it for voting.
    Requires admin privileges.
    """
    updated = election_service.activate_election(db, election_id)
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
    _: User = Depends(require_admin),
) -> ElectionResponse:
    """
    Transition an active election to ``closed``, stopping further voting.
    Requires admin privileges.
    """
    updated = election_service.close_election(db, election_id)
    return ElectionResponse.model_validate(updated)
