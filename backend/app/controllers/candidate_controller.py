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


@router.post(
    "/nominate",
    status_code=status.HTTP_201_CREATED,
    summary="Apply for nomination (voters)",
)
async def nominate_candidate(
    full_name: str = Form(...),
    email: str | None = Form(None),
    phone: str | None = Form(None),
    date_of_birth: str | None = Form(None),
    gender: str | None = Form(None),
    parent_name: str | None = Form(None),
    kyc_type: str | None = Form(None),
    voter_id_number: str | None = Form(None),
    state: str | None = Form(None),
    district: str | None = Form(None),
    taluka: str | None = Form(None),
    village: str | None = Form(None),
    pincode: str | None = Form(None),
    bio: str | None = Form(None),
    position_name: str | None = Form(None),
    committee_id: int | None = Form(None),
    target_id: int | None = Form(None),
    election_id: int = Form(...),
    image: UploadFile | None = File(None),
    signature: UploadFile | None = File(None),
    image_url: str | None = Form(None),
    signature_url: str | None = Form(None),
    is_willing: bool = Form(True),
    held_previously: bool = Form(False),
    prev_position: str | None = Form(None),
    prev_duration: str | None = Form(None),
    is_disciplined: bool = Form(False),
    discipline_details: str | None = Form(None),
    has_complaints: bool = Form(False),
    agreed_constitution: bool = Form(False),
    accepted_results: bool = Form(False),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> JSONResponse:
    """
    Voter application for candidacy.
    """
    from app.utils.uploads import save_uploaded_image

    final_image_url = image_url
    if image:
        final_image_url = await save_uploaded_image(image, subdir="candidates", filename_prefix="cand")

    final_sig_url = signature_url
    if signature:
        final_sig_url = await save_uploaded_image(signature, subdir="signatures", filename_prefix="sig")

    payload = NominationCreate(
        full_name=full_name,
        email=email,
        phone=phone,
        date_of_birth=date_of_birth,
        gender=gender,
        parent_name=parent_name,
        kyc_type=kyc_type,
        voter_id_number=voter_id_number,
        state=state,
        district=district,
        taluka=taluka,
        village=village,
        pincode=pincode,
        bio=bio,
        position_name=position_name,
        committee_id=committee_id,
        target_id=target_id,
        election_id=election_id,
        image_url=final_image_url,
        signature_url=final_sig_url,
        is_willing=is_willing,
        held_previously=held_previously,
        prev_position=prev_position,
        prev_duration=prev_duration,
        is_disciplined=is_disciplined,
        discipline_details=discipline_details,
        has_complaints=has_complaints,
        agreed_constitution=agreed_constitution,
        accepted_results=accepted_results,
    )
    nomination = nomination_service.submit_nomination(
        db=db,
        data=payload,
        user=current_user,
    )
    data = NominationResponse.model_validate(nomination).model_dump(mode="json")
    return success_response(
        data=data,
        message="Nomination submitted successfully and is pending review.",
        status_code=status.HTTP_201_CREATED,
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
    return success_response(data={"is_following": is_following})


@router.post(
    "/{candidate_id}/follow",
    summary="Toggle follow status for a candidate",
)
def follow_candidate(
    candidate_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> JSONResponse:
    """
    Follow or unfollow a candidate (toggle logic).
    """
    is_following = candidate_service.follow_candidate(db, candidate_id, current_user.id)
    return success_response(
        data={"is_following": is_following},
        message="Follow status updated successfully."
    )


# ---------------------------------------------------------------------------
# Admin Operations (Candidate Management)
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
    """
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
) -> CandidateResponse:
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
    return CandidateResponse.model_validate(candidate)


@router.put(
    "/{candidate_id}",
    response_model=CandidateResponse,
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
) -> CandidateResponse:
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
    Permanently delete a candidate. Requires admin privileges.
    """
    candidate_service.delete_candidate(db, candidate_id)
    return success_response(message=f"Candidate {candidate_id} deleted successfully.")
