from typing import Optional

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.candidate_committee import CandidateCommittee
from app.repositories.candidate_committee_repository import CandidateCommitteeRepository
from app.schemas.candidate_committee import CandidateCommitteeCreate, CandidateCommitteeUpdate


class CandidateCommitteeService:
    """
    Handles business logic for candidate committees (positions like President, Secretary).
    """

    def create_committee(
        self, db: Session, data: CandidateCommitteeCreate, tenant_id: int
    ) -> CandidateCommittee:
        """
        Define a new candidate committee for a tenant.
        """
        repo = CandidateCommitteeRepository(db)
        committee_data = data.model_dump()
        committee_data["tenant_id"] = tenant_id
        return repo.create(committee_data)

    def get_committees_by_tenant(self, db: Session, tenant_id: int) -> list[CandidateCommittee]:
        """
        Fetch all committees available for a tenant.
        """
        repo = CandidateCommitteeRepository(db)
        return repo.get_by_tenant(tenant_id)

    def get_committee_by_id(self, db: Session, committee_id: int) -> CandidateCommittee:
        """
        Fetch a single committee by ID.
        """
        repo = CandidateCommitteeRepository(db)
        committee = repo.get_by_id(committee_id)
        if not committee:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Candidate committee with id={committee_id} not found.",
            )
        return committee

    def update_committee(
        self, db: Session, committee_id: int, data: CandidateCommitteeUpdate, tenant_id: int
    ) -> CandidateCommittee:
        """
        Update a candidate committee's details. Ensures the committee belongs to the tenant.
        """
        committee = self.get_committee_by_id(db, committee_id)
        if committee.tenant_id != tenant_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to update this committee.",
            )
        
        repo = CandidateCommitteeRepository(db)
        return repo.update(committee, data)

    def delete_committee(self, db: Session, committee_id: int, tenant_id: int) -> bool:
        """
        Permanently delete a candidate committee. Ensures the committee belongs to the tenant.
        """
        committee = self.get_committee_by_id(db, committee_id)
        if committee.tenant_id != tenant_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to delete this committee.",
            )
        
        repo = CandidateCommitteeRepository(db)
        return repo.delete(committee_id)


candidate_committee_service = CandidateCommitteeService()
