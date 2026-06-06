"""
Candidate controller.

Provides the /api/v1/candidates router.
- Authenticated: list candidates for an election, get a single candidate, results.
- Admin-only: add, update, delete candidates.
"""

from fastapi import APIRouter, Depends, Query, status, UploadFile, File, Form, Header
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session

from app.config.database import get_db
from app.middlewares.auth_middleware import get_current_user, require_admin, get_header_tenant_id
from app.models.user import User
from app.schemas.candidate import (
    CandidateCreate,
    CandidateListResponse,
    CandidateResponse,
    CandidateUpdate,
    FollowStatusResponse,
)
from app.schemas.nomination import NominationCreate, NominationResponse
from app.services.candidate_service import candidate_service
from app.services.nomination_service import nomination_service
from app.utils.response import success_response

router = APIRouter(prefix="/candidates", tags=["Candidates"])


# ---------------------------------------------------------------------------
# Public / Voter Operations
# ---------------------------------------------------------------------------

@router.get(
    "/election/{election_id}",
    summary="List all candidates for a specific election",
)
def get_candidates_by_election(
    election_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> JSONResponse:
    """
    Returns a list of all candidates standing for election in the given
    election ID. Requires authentication.
    """
    candidates = candidate_service.get_by_election(db, election_id)
    data = [CandidateResponse.model_validate(c).model_dump(mode="json") for c in candidates]
    return success_response(
        data=data,
        message="Candidates retrieved for election."
    )


@router.get(
    "/{candidate_id}",
    summary="Get candidate details by ID",
)
def get_candidate(
    candidate_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> JSONResponse:
    """
    Fetch the profile of a single candidate.
    """
    candidate = candidate_service.get_by_id(db, candidate_id)
    return success_response(
        data=CandidateResponse.model_validate(candidate).model_dump(mode="json"),
        message="Candidate details retrieved."
    )


@router.post(
    "/nominate",
    status_code=status.HTTP_201_CREATED,
    summary="Apply for nomination (voters)",
)
async def nominate_candidate(
    payload: NominationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> JSONResponse:
    """
    Voter application for candidacy.
    Accepts a standard JSON payload. Files should be pre-uploaded via the /media endpoint.
    """
    nomination = nomination_service.submit_nomination(
        db=db,
        user=current_user,
        data=payload,
    )
    return success_response(
        data=NominationResponse.model_validate(nomination).model_dump(mode="json"),
        message="Nomination submitted successfully and is pending review.",
        status_code=status.HTTP_201_CREATED
    )


@router.get(
    "/{candidate_id}/follow-status",
    summary="Get follow status for current user",
)
def get_candidate_follow_status(
    candidate_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> JSONResponse:
    """
    Check if the current authenticated user follows this candidate.
    """
    is_following = candidate_service.get_follow_status(db, candidate_id, current_user.id)
    return success_response(
        data={"is_following": is_following},
        message="Follow status retrieved."
    )


@router.post(
    "/{candidate_id}/follow",
    summary="Toggle follow status for a candidate",
)
def follow_candidate(
    candidate_id: int,
    tenant_id: int = Depends(get_header_tenant_id),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> JSONResponse:
    """
    Follow or unfollow a candidate (toggle logic).
    Extracts tenant_id from X-Tenant-ID header (via dependency).
    """
    if tenant_id is None:
        tenant_id = current_user.tenant_id

    is_following = candidate_service.follow_candidate(
        db, 
        candidate_id, 
        current_user.id, 
        tenant_id
    )
    return success_response(
        data={"is_following": is_following},
        message="Follow status toggled."
    )


# ---------------------------------------------------------------------------
# Admin Operations (Candidate Management)
# ---------------------------------------------------------------------------

@router.get(
    "/",
    summary="List all candidates (admin-only)",
)
def list_candidates(
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
) -> JSONResponse:
    """
    Returns a paginated list of all candidates across all elections.
    """
    from app.repositories.candidate_repository import CandidateRepository
    repo = CandidateRepository(db)
    
    # Filter by tenant for non-superadmins
    filters = {}
    if current_user.role != "superadmin":
        filters["tenant_id"] = current_user.tenant_id

    total = repo.count(filters=filters)
    candidates = repo.list(page=page, page_size=page_size, filters=filters)
    
    data = [CandidateResponse.model_validate(c).model_dump(mode="json") for c in candidates]
    return success_response(
        data={
            "total": total,
            "page": page,
            "page_size": page_size,
            "items": data
        },
        message="Candidates retrieved."
    )


@router.post(
    "/",
    status_code=status.HTTP_201_CREATED,
    summary="Add a new candidate (admin-only)",
)
async def add_candidate(
    full_name: str = Form(...),
    symbol: str | None = Form(None),
    image: UploadFile | None = File(None),
    bio: str | None = Form(None),
    committee_id: int | None = Form(None),
    target_id: int | None = Form(None),
    election_id: int = Form(...),
    tenant_id: int | None = Form(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
) -> JSONResponse:
    """
    Registers a new candidate. Requires admin privileges.
    """
    payload = CandidateCreate(
        full_name=full_name,
        symbol=symbol,
        image_url=None,
        bio=bio,
        committee_id=committee_id,
        target_id=target_id,
        election_id=election_id,
    )

    # If tenant_id not provided by superadmin, use current user's tenant
    effective_tenant_id = tenant_id if current_user.role == "superadmin" else current_user.tenant_id

    candidate = await candidate_service.add_candidate(
        db,
        payload,
        image_file=image,
        tenant_id=effective_tenant_id,
    )
    return success_response(
        data=CandidateResponse.model_validate(candidate).model_dump(mode="json"),
        message="Candidate added successfully.",
        status_code=status.HTTP_201_CREATED
    )


@router.put(
    "/{candidate_id}",
    summary="Update candidate profile (admin-only)",
)
async def update_candidate(
    candidate_id: int,
    full_name: str | None = Form(None),
    symbol: str | None = Form(None),
    image: UploadFile | None = File(None),
    bio: str | None = Form(None),
    committee_id: int | None = Form(None),
    target_id: int | None = Form(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
) -> JSONResponse:
    """
    Modify an existing candidate. Requires admin privileges.
    """
    update_data = {}
    if full_name is not None:
        update_data['full_name'] = full_name
    if symbol is not None:
        update_data['symbol'] = symbol
    if bio is not None:
        update_data['bio'] = bio
    if committee_id is not None:
        update_data['committee_id'] = committee_id
    if target_id is not None:
        update_data['target_id'] = target_id

    body = CandidateUpdate(**update_data) if update_data else CandidateUpdate()
    candidate = await candidate_service.update_candidate(db, candidate_id, body, image_file=image)
    return success_response(
        data=CandidateResponse.model_validate(candidate).model_dump(mode="json"),
        message="Candidate updated successfully."
    )


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
    Permanently delete a candidate. Requires admin privileges.
    """
    candidate_service.delete_candidate(db, candidate_id)
    return success_response(message=f"Candidate {candidate_id} deleted successfully.")
