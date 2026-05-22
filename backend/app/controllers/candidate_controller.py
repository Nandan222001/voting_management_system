"""
Candidate controller.

Provides the /api/v1/candidates router.
- Public: list candidates for an election, get a single candidate, results.
- Admin-only: add, update, delete candidates.
"""

from fastapi import APIRouter, Depends, status
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session

from app.config.database import get_db
from app.middlewares.auth_middleware import require_admin
from app.models.user import User
from app.schemas.candidate import CandidateCreate, CandidateResponse, CandidateUpdate
from app.services.candidate_service import candidate_service
from app.utils.response import success_response

router = APIRouter(prefix="/api/v1/candidates", tags=["Candidates"])


# ---------------------------------------------------------------------------
# GET /election/{election_id}
# ---------------------------------------------------------------------------

@router.get(
    "/election/{election_id}",
    summary="List candidates for an election (public)",
)
def get_candidates_for_election(
    election_id: int,
    db: Session = Depends(get_db),
) -> JSONResponse:
    """
    Return all candidates registered for the specified election.
    Raises 404 if the election does not exist.
    """
    candidates = candidate_service.get_by_election(db, election_id)
    data = [CandidateResponse.model_validate(c).model_dump(mode="json") for c in candidates]
    return success_response(data=data, message="Candidates retrieved.")


# ---------------------------------------------------------------------------
# POST /
# ---------------------------------------------------------------------------

@router.post(
    "/",
    status_code=status.HTTP_201_CREATED,
    response_model=CandidateResponse,
    summary="Add a candidate to an election (admin only)",
)
def add_candidate(
    payload: CandidateCreate,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
) -> CandidateResponse:
    """
    Register a new candidate for an election. Requires admin privileges.
    Raises 404 if the election does not exist.
    Raises 400 if the election is closed or cancelled.
    """
    candidate = candidate_service.add_candidate(db, payload)
    return CandidateResponse.model_validate(candidate)


# ---------------------------------------------------------------------------
# GET /results/{election_id}  — declared before /{candidate_id}
# ---------------------------------------------------------------------------

@router.get(
    "/results/{election_id}",
    summary="Get election results ranked by vote count (public)",
)
def get_election_results(
    election_id: int,
    db: Session = Depends(get_db),
) -> JSONResponse:
    """
    Return candidates for the election ordered by descending vote count.
    Raises 404 if the election does not exist.
    """
    candidates = candidate_service.get_election_results(db, election_id)
    data = [CandidateResponse.model_validate(c).model_dump(mode="json") for c in candidates]
    return success_response(data=data, message="Election results retrieved.")


# ---------------------------------------------------------------------------
# GET /{candidate_id}
# ---------------------------------------------------------------------------

@router.get(
    "/{candidate_id}",
    response_model=CandidateResponse,
    summary="Get a single candidate by ID (public)",
)
def get_candidate(
    candidate_id: int,
    db: Session = Depends(get_db),
) -> CandidateResponse:
    """
    Fetch a single candidate by primary key.
    Raises 404 if not found.
    """
    candidate = candidate_service.get_by_id(db, candidate_id)
    return CandidateResponse.model_validate(candidate)


# ---------------------------------------------------------------------------
# PUT /{candidate_id}
# ---------------------------------------------------------------------------

@router.put(
    "/{candidate_id}",
    response_model=CandidateResponse,
    summary="Update a candidate (admin only)",
)
def update_candidate(
    candidate_id: int,
    payload: CandidateUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
) -> CandidateResponse:
    """
    Apply a partial update to a candidate's record. Requires admin privileges.
    Raises 400 if the parent election is closed or cancelled.
    """
    updated = candidate_service.update_candidate(db, candidate_id, payload)
    return CandidateResponse.model_validate(updated)


# ---------------------------------------------------------------------------
# DELETE /{candidate_id}
# ---------------------------------------------------------------------------

@router.delete(
    "/{candidate_id}",
    status_code=status.HTTP_200_OK,
    summary="Delete a candidate (admin only)",
)
def delete_candidate(
    candidate_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
) -> JSONResponse:
    """
    Permanently delete a candidate. Requires admin privileges.
    Raises 400 if the parent election is not in draft status.
    """
    candidate_service.delete_candidate(db, candidate_id)
    return success_response(message=f"Candidate {candidate_id} deleted successfully.")
