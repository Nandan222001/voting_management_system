"""
Vote controller.

Provides the /api/v1/votes router.
- POST /cast          — authenticated voters only.
- GET  /my-vote/{id}  — authenticated voters only.
- GET  /results/{id}  — authenticated members only.
- GET  /live/{id}     — authenticated members only.

Multi-tenancy: cast_vote verifies that the election and candidate belong to
the same tenant as the voter.  Results and live-stats endpoints accept an
optional ``tenant_id`` query parameter; authenticated non-superadmin users are
auto-scoped to their own tenant.
"""

from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session

from app.config.database import get_db
from app.middlewares.auth_middleware import get_current_user
from app.models.election import Election
from app.models.user import User, UserRole
from app.schemas.payment import VotingEligibilityResponse
from app.schemas.vote import VoteBatchCreate, VoteCreate, VoteResponse
from app.services.payment_service import payment_service
from app.services.vote_service import vote_service
from app.utils.helpers import get_client_ip
from app.utils.response import success_response

router = APIRouter(prefix="/votes", tags=["Votes"])
voting_router = APIRouter(prefix="/voting", tags=["Voting"])


def _assert_member_can_access_election(
    db: Session,
    current_user: User,
    election_id: int,
) -> None:
    if current_user.role == UserRole.superadmin:
        return
    election = db.query(Election).filter(Election.id == election_id).first()
    if election is None or election.tenant_id != current_user.tenant_id:
        raise HTTPException(
            status_code=404,
            detail=f"Election with id={election_id} not found.",
        )
    if (
        current_user.role == UserRole.voter
        and election.target_district
        and election.target_district != current_user.district
    ):
        raise HTTPException(
            status_code=404,
            detail=f"Election with id={election_id} not found.",
        )


# ---------------------------------------------------------------------------
# POST /cast
# ---------------------------------------------------------------------------

@router.post(
    "/cast",
    summary="Cast a vote (authenticated voter)",
)
def cast_vote(
    payload: VoteCreate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> JSONResponse:
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
    return success_response(
        data=VoteResponse.model_validate(vote).model_dump(mode="json"),
        message="Vote cast successfully.",
        status_code=status.HTTP_201_CREATED
    )


@voting_router.get(
    "/check-eligibility",
    summary="Check current user's voting eligibility",
)
def check_voting_eligibility(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> JSONResponse:
    """
    Check membership selection and verified payment before voting.
    """
    data = payment_service.check_voting_eligibility(db, current_user)
    return success_response(
        data=data,
        message="Voting eligibility status retrieved."
    )


@voting_router.post(
    "/submit",
    summary="Submit a vote after membership/payment validation",
)
def submit_vote(
    payload: VoteCreate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> JSONResponse:
    """
    Submit a vote only after the backend verifies membership and payment eligibility.
    """
    eligibility = payment_service.check_voting_eligibility(db, current_user)
    if not eligibility["can_vote"]:
        status_code = (
            status.HTTP_402_PAYMENT_REQUIRED
            if eligibility["membership_selected"]
            else status.HTTP_400_BAD_REQUEST
        )
        return JSONResponse(
            status_code=status_code,
            content={
                "success": False,
                "message": "Membership payment required before voting."
                if eligibility["membership_selected"]
                else "Membership Plan required before voting.",
            },
        )

    ip = get_client_ip(request)
    vote = vote_service.cast_vote(
        db,
        user_id=current_user.id,
        election_id=payload.election_id,
        candidate_id=payload.candidate_id,
        ip_address=ip,
        tenant_id=current_user.tenant_id,
    )
    return success_response(
        data={"vote": VoteResponse.model_validate(vote).model_dump(mode="json")},
        message="Vote submitted successfully."
    )


@voting_router.post(
    "/submit-batch",
    summary="Submit multiple votes (batch) for MULTIPLE_MEMBER elections",
)
def submit_batch_vote(
    payload: VoteBatchCreate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> JSONResponse:
    """
    Submit votes for multiple candidates in a MULTIPLE_MEMBER election.

    Validation:
    - Election must exist, be active, and belong to the voter's tenant.
    - Candidate count must not exceed ``votes_allowed_per_voter``.
    - No duplicate candidate IDs permitted.
    - Each candidate must belong to the election.
    - Voter must not have exceeded their allowed vote count.
    """
    from app.models.election import Election, VotingType
    from app.repositories.election_repository import ElectionRepository

    election_repo = ElectionRepository(db)
    election: Election = election_repo.get_by_id(payload.election_id)

    if election is None:
        return JSONResponse(
            status_code=404,
            content={"success": False, "message": f"Election with id={payload.election_id} not found."},
        )
    if current_user.role != UserRole.superadmin and election.tenant_id != current_user.tenant_id:
        return JSONResponse(
            status_code=404,
            content={"success": False, "message": f"Election with id={payload.election_id} not found."},
        )
    if election.status != ElectionStatus.active:
        return JSONResponse(
            status_code=400,
            content={"success": False, "message": f"Voting is not open. Status: '{election.status.value}'."},
        )
    if election.voting_type != VotingType.MULTIPLE_MEMBER:
        return JSONResponse(
            status_code=400,
            content={"success": False, "message": "Batch voting is only allowed for MULTIPLE_MEMBER elections."},
        )

    # 2. Validate candidate count
    if len(payload.candidate_ids) > election.votes_allowed_per_voter:
        return JSONResponse(
            status_code=400,
            content={
                "success": False,
                "message": f"You can vote for at most {election.votes_allowed_per_voter} candidates.",
            },
        )

    # 3. Check for duplicates
    if len(payload.candidate_ids) != len(set(payload.candidate_ids)):
        return JSONResponse(
            status_code=400,
            content={"success": False, "message": "Duplicate candidate IDs are not allowed."},
        )

    # 4. Check eligibility (membership + payment)
    eligibility = payment_service.check_voting_eligibility(db, current_user)
    if not eligibility["can_vote"]:
        status_code = (
            status.HTTP_402_PAYMENT_REQUIRED
            if eligibility["membership_selected"]
            else status.HTTP_400_BAD_REQUEST
        )
        return JSONResponse(
            status_code=status_code,
            content={
                "success": False,
                "message": "Membership payment required before voting."
                if eligibility["membership_selected"]
                else "Membership Plan required before voting.",
            },
        )

    # 5. Check district scoping for voter
    from app.models.user import User
    member = db.query(User).filter(User.id == current_user.id).first()
    if election.target_district and member and member.district != election.target_district:
        return JSONResponse(
            status_code=403,
            content={"success": False, "message": "This election is not available for your district."},
        )

    # 6. Check user's existing vote count
    from app.repositories.vote_repository import VoteRepository
    vote_repo = VoteRepository(db)
    current_vote_count = vote_repo.get_user_vote_count_in_election(
        current_user.id, payload.election_id
    )
    remaining_slots = election.votes_allowed_per_voter - current_vote_count
    if len(payload.candidate_ids) > remaining_slots:
        return JSONResponse(
            status_code=409,
            content={
                "success": False,
                "message": f"You can only cast {remaining_slots} more vote(s) in this election.",
            },
        )

    # 7. Validate each candidate belongs to the election
    from app.repositories.candidate_repository import CandidateRepository
    candidate_repo = CandidateRepository(db)
    votes = []
    ip = get_client_ip(request)

    for candidate_id in payload.candidate_ids:
        candidate = candidate_repo.get_by_id(candidate_id)
        if candidate is None or candidate.election_id != payload.election_id:
            return JSONResponse(
                status_code=404,
                content={
                    "success": False,
                    "message": f"Candidate with id={candidate_id} not found in this election.",
                },
            )

        vote = vote_service.cast_vote(
            db,
            user_id=current_user.id,
            election_id=payload.election_id,
            candidate_id=candidate_id,
            ip_address=ip,
            tenant_id=current_user.tenant_id,
        )
        votes.append(vote)

    return success_response(
        data={
            "votes": [VoteResponse.model_validate(v).model_dump(mode="json") for v in votes],
            "count": len(votes),
        },
        message=f"{len(votes)} vote(s) submitted successfully."
    )


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
    summary="Get aggregated results for an election (authenticated)",
)
def get_results(
    election_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> JSONResponse:
    """
    Return aggregated vote results for the specified election,
    ranked by vote count descending, including percentage shares.

    Authenticated non-superadmin users are automatically scoped to their tenant.
    """
    effective_tenant_id: Optional[int] = None
    if current_user.role != UserRole.superadmin:
        effective_tenant_id = current_user.tenant_id
    _assert_member_can_access_election(db, current_user, election_id)

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
    summary="Get live voting statistics for an election (authenticated)",
)
def get_live_stats(
    election_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> JSONResponse:
    """
    Return real-time voting statistics for the specified election.
    Includes per-candidate vote counts, percentages, and the leading candidate.

    Authenticated non-superadmin users are automatically scoped to their tenant.
    """
    effective_tenant_id: Optional[int] = None
    if current_user.role != UserRole.superadmin:
        effective_tenant_id = current_user.tenant_id
    _assert_member_can_access_election(db, current_user, election_id)

    stats = vote_service.get_live_stats(
        db, election_id, tenant_id=effective_tenant_id
    )
    return success_response(data=stats, message="Live stats retrieved.")
