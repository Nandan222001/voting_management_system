from fastapi import APIRouter, Depends, status
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session

from app.config.database import get_db
from app.middlewares.auth_middleware import get_current_user, require_admin
from app.models.user import User
from app.schemas.candidate_committee import (
    CandidateCommitteeCreate,
    CandidateCommitteeResponse,
    CandidateCommitteeUpdate,
)
from app.services.candidate_committee_service import candidate_committee_service
from app.utils.response import success_response

router = APIRouter(prefix="/candidate-committees", tags=["Candidate Committees"])


@router.get(
    "/",
    summary="List all candidate committees for the current tenant",
)
def get_committees(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> JSONResponse:
    """
    Returns all committees defined by the current tenant.
    """
    committees = candidate_committee_service.get_committees_by_tenant(db, current_user.tenant_id)
    data = [CandidateCommitteeResponse.model_validate(c).model_dump(mode="json") for c in committees]
    return success_response(data=data, message="Candidate committees retrieved.")


@router.get(
    "/public",
    summary="List all candidate committees for a specific tenant (Public)",
)
def get_public_committees(
    tenant_id: int,
    db: Session = Depends(get_db),
) -> JSONResponse:
    """
    Returns all committees defined by the specified tenant. Publicly accessible.
    """
    committees = candidate_committee_service.get_committees_by_tenant(db, tenant_id)
    data = [CandidateCommitteeResponse.model_validate(c).model_dump(mode="json") for c in committees]
    return success_response(data=data, message="Public candidate committees retrieved.")


@router.post(
    "/",
    status_code=status.HTTP_201_CREATED,
    response_model=CandidateCommitteeResponse,
    summary="Create a new candidate committee (admin only)",
)
def create_committee(
    payload: CandidateCommitteeCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
) -> CandidateCommitteeResponse:
    """
    Define a new committee. Requires admin privileges.
    """
    committee = candidate_committee_service.create_committee(db, payload, current_user.tenant_id)
    return CandidateCommitteeResponse.model_validate(committee)


@router.get(
    "/{committee_id}",
    response_model=CandidateCommitteeResponse,
    summary="Get a single candidate committee by ID",
)
def get_committee(
    committee_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> CandidateCommitteeResponse:
    """
    Fetch details for a specific committee. Ensures multi-tenant isolation.
    """
    committee = candidate_committee_service.get_committee_by_id(db, committee_id)
    if committee.tenant_id != current_user.tenant_id:
        from fastapi import HTTPException
        raise HTTPException(status_code=403, detail="Access denied")
    return CandidateCommitteeResponse.model_validate(committee)


@router.put(
    "/{committee_id}",
    response_model=CandidateCommitteeResponse,
    summary="Update a candidate committee (admin only)",
)
def update_committee(
    committee_id: int,
    payload: CandidateCommitteeUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
) -> CandidateCommitteeResponse:
    """
    Update committee details. Requires admin privileges.
    """
    updated = candidate_committee_service.update_committee(db, committee_id, payload, current_user.tenant_id)
    return CandidateCommitteeResponse.model_validate(updated)


@router.delete(
    "/{committee_id}",
    summary="Delete a candidate committee (admin only)",
)
def delete_committee(
    committee_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
) -> JSONResponse:
    """
    Permanently remove a committee. Requires admin privileges.
    """
    candidate_committee_service.delete_committee(db, committee_id, current_user.tenant_id)
    return success_response(message=f"Committee {committee_id} deleted successfully.")
