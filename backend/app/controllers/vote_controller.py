"""
Vote controller.

Provides the /api/v1/votes router.
- POST /cast          — authenticated voters only.
- GET  /my-vote/{id}  — authenticated voters only.
- GET  /results/{id}  — public (tenant-scoped for authenticated users).
- GET  /live/{id}     — public (tenant-scoped for authenticated users).

Multi-tenancy: cast_vote verifies that the election and candidate belong to
the same tenant as the voter.  Results and live-stats endpoints accept an
optional ``tenant_id`` query parameter; authenticated non-superadmin users are
auto-scoped to their own tenant.
"""

from typing import Optional

from fastapi import APIRouter, Depends, Query, Request
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session

from app.config.database import get_db
from app.middlewares.auth_middleware import get_current_user, get_optional_current_user
from app.models.user import User, UserRole
from app.schemas.vote import VoteCreate, VoteResponse
from app.services.vote_service import vote_service
from app.utils.helpers import get_client_ip
from app.utils.response import success_response

router = APIRouter(prefix="/api/v1/votes", tags=["Votes"])


# ---------------------------------------------------------------------------
# POST /cast
# ---------------------------------------------------------------------------

@router.post(
    "/cast",
    response_model=VoteResponse,
    summary="Cast a vote (authenticated voter)",
)
def cast_vote(
    payload: VoteCreate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> VoteResponse:
    """
    Cast a ballot in an active election.

    Rules:
    - The election must be in ``active`` status.
    - The candidate must belong to the specified election.
    - Each voter may cast at most one vote per election.

    The client IP address is captured for audit purposes.
    """
    ip = get_client_ip(request)
    vote = vote_service.cast_vote(
        db,
        user_id=current_user.id,
        election_id=payload.election_id,
        candidate_id=payload.candidate_id,
        ip_address=ip,
        tenant_id=current_user.tenant_id,
    )
    return VoteResponse.model_validate(vote)


# ---------------------------------------------------------------------------
# GET /my-vote/{election_id}
# ---------------------------------------------------------------------------

@router.get(
    "/my-vote/{election_id}",
    summary="Check whether the current user has voted in an election",
)
def get_my_vote(
    election_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> JSONResponse:
    """
    Return the authenticated user's vote record for the given election,
    or ``null`` if they have not yet voted.
    """
    vote = vote_service.get_user_vote(db, current_user.id, election_id)
    if vote is None:
        return success_response(
            data={"has_voted": False, "vote": None},
            message="User has not voted in this election.",
        )
    return success_response(
        data={
            "has_voted": True,
            "vote": VoteResponse.model_validate(vote).model_dump(mode="json"),
        },
        message="Vote record retrieved.",
    )


# ---------------------------------------------------------------------------
# GET /results/{election_id}
# ---------------------------------------------------------------------------

@router.get(
    "/results/{election_id}",
    summary="Get aggregated results for an election (public)",
)
def get_results(
    election_id: int,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user),
) -> JSONResponse:
    """
    Return aggregated vote results for the specified election,
    ranked by vote count descending, including percentage shares.

    Authenticated non-superadmin users are automatically scoped to their tenant.
    """
    effective_tenant_id: Optional[int] = None
    if current_user is not None and current_user.role != UserRole.superadmin:
        effective_tenant_id = current_user.tenant_id

    results = vote_service.get_election_results(
        db, election_id, tenant_id=effective_tenant_id
    )
    return success_response(
        data=results.model_dump(mode="json"),
        message="Election results retrieved.",
    )


# ---------------------------------------------------------------------------
# GET /live/{election_id}
# ---------------------------------------------------------------------------

@router.get(
    "/live/{election_id}",
    summary="Get live voting statistics for an election (public)",
)
def get_live_stats(
    election_id: int,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user),
) -> JSONResponse:
    """
    Return real-time voting statistics for the specified election.
    Includes per-candidate vote counts, percentages, and the leading candidate.

    Authenticated non-superadmin users are automatically scoped to their tenant.
    """
    effective_tenant_id: Optional[int] = None
    if current_user is not None and current_user.role != UserRole.superadmin:
        effective_tenant_id = current_user.tenant_id

    stats = vote_service.get_live_stats(
        db, election_id, tenant_id=effective_tenant_id
    )
    return success_response(data=stats, message="Live stats retrieved.")
