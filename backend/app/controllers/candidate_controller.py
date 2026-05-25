"""
Candidate controller.

Provides the /api/v1/candidates router.
- Authenticated: list candidates for an election, get a single candidate, results.
- Admin-only: add, update, delete candidates.
"""

from fastapi import APIRouter, Depends, Query, status, UploadFile, File, Form
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session

from app.config.database import get_db
from app.middlewares.auth_middleware import get_current_user, require_admin
from app.models.user import User
from app.schemas.candidate import (
    CandidateCreate,
    CandidateListResponse,
    CandidateResponse,
    CandidateUpdate,
)
from app.services.candidate_service import candidate_service
from app.utils.response import success_response

router = APIRouter(prefix="/candidates", tags=["Candidates"])


# ---------------------------------------------------------------------------
# Public / Voter Operations
# ---------------------------------------------------------------------------

@router.get(
    "/election/{election_id}",
    response_model=list[CandidateResponse],
    summary="List all candidates for a specific election",
)
def get_candidates_by_election(
    election_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[CandidateResponse]:
    """
    Returns a list of all candidates standing for election in the given
    election ID. Requires authentication.
    """
    candidates = candidate_service.get_by_election(db, election_id)
    return [CandidateResponse.model_validate(c) for c in candidates]


@router.get(
    "/{candidate_id}",
    response_model=CandidateResponse,
    summary="Get candidate details by ID",
)
def get_candidate(
    candidate_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> CandidateResponse:
    """
    Fetch the profile of a single candidate.
    """
    candidate = candidate_service.get_by_id(db, candidate_id)
    return CandidateResponse.model_validate(candidate)


# ---------------------------------------------------------------------------
# Admin Operations
# ---------------------------------------------------------------------------

@router.get(
    "/",
    response_model=CandidateListResponse,
    summary="List all candidates (admin-only)",
)
def list_candidates(
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
) -> CandidateListResponse:
    """
    Returns a paginated list of all candidates across all elections.
    Requires admin privileges.
    """
    # Note: Currently uses the base repository list; could be filtered
    # by tenant in a future enhancement.
    from app.repositories.candidate_repository import CandidateRepository
    repo = CandidateRepository(db)
    
    # Filter by tenant for non-superadmins
    filters = {}
    if current_user.role != "superadmin":
        filters["tenant_id"] = current_user.tenant_id

    total = repo.count(filters=filters)
    candidates = repo.list(page=page, page_size=page_size, filters=filters)
    
    return CandidateListResponse(
        total=total,
        page=page,
        page_size=page_size,
        items=[CandidateResponse.model_validate(c) for c in candidates]
    )


@router.post(
    "/",
    response_model=CandidateResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Add a new candidate to an election (admin-only)",
)
def add_candidate(
    full_name: str = Form(...),
    party: str | None = Form(None),
    symbol: str | None = Form(None),
    image: UploadFile | None = File(None),
    bio: str | None = Form(None),
    committee_id: int | None = Form(None),
    target_id: int | None = Form(None),
    election_id: int = Form(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
) -> CandidateResponse:
    """
    Registers a new candidate.
    Requires admin privileges.
    Raises 400 if the parent election is not in draft status.
    """
    # Build CandidateCreate-like object
    payload = CandidateCreate(
        full_name=full_name,
        party=party,
        symbol=symbol,
        image_url=None,
        bio=bio,
        committee_id=committee_id,
        target_id=target_id,
        election_id=election_id,
    )

    candidate = candidate_service.add_candidate(
        db,
        payload,
        image_file=image,
        tenant_id=current_user.tenant_id if current_user.role != "superadmin" else None,
    )
    return CandidateResponse.model_validate(candidate)


@router.put(
    "/{candidate_id}",
    response_model=CandidateResponse,
    summary="Update candidate profile (admin-only)",
)
def update_candidate(
    candidate_id: int,
    full_name: str | None = Form(None),
    party: str | None = Form(None),
    symbol: str | None = Form(None),
    image: UploadFile | None = File(None),
    bio: str | None = Form(None),
    committee_id: int | None = Form(None),
    target_id: int | None = Form(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
) -> CandidateResponse:
    """
    Modify an existing candidate's information.
    Requires admin privileges.
    Raises 400 if the parent election is not in draft status.
    """
    # Build CandidateUpdate from supplied form fields
    update_data = {}
    if full_name is not None:
        update_data['full_name'] = full_name
    if party is not None:
        update_data['party'] = party
    if symbol is not None:
        update_data['symbol'] = symbol
    if bio is not None:
        update_data['bio'] = bio
    if committee_id is not None:
        update_data['committee_id'] = committee_id
    if target_id is not None:
        update_data['target_id'] = target_id

    body = CandidateUpdate(**update_data) if update_data else CandidateUpdate()
    candidate = candidate_service.update_candidate(db, candidate_id, body, image_file=image)
    return CandidateResponse.model_validate(candidate)


@router.delete(
    "/{candidate_id}",
    summary="Remove a candidate (admin-only)",
)
def delete_candidate(
    candidate_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
) -> JSONResponse:
    """
    Permanently delete a candidate record.
    Requires admin privileges.
    Raises 400 if the parent election is not in draft status.
    """
    candidate_service.delete_candidate(db, candidate_id)
    return success_response(message=f"Candidate {candidate_id} deleted successfully.")
