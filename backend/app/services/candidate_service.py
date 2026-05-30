"""
Candidate management service.

Single Responsibility: Handles all business logic for candidate management —
adding candidates to elections, retrieval, updates, deletion, and results.

Open/Closed Principle: Candidate validation rules can be extended (e.g.
minimum candidate count enforcement) without altering existing methods.

Dependency Inversion: Depends on ``CandidateRepository`` and
``ElectionRepository`` abstractions, never on raw SQL.
"""

from typing import Optional

from fastapi import HTTPException, status, UploadFile
from sqlalchemy.orm import Session

from app.models.candidate import Candidate
from app.models.election import ElectionStatus
from app.repositories.candidate_repository import CandidateRepository
from app.repositories.candidate_committee_repository import CandidateCommitteeRepository
from app.repositories.election_repository import ElectionRepository
from app.schemas.candidate import CandidateCreate, CandidateUpdate
from app.utils.uploads import delete_uploaded_file, save_uploaded_image


class CandidateService:
    """
    Orchestrates candidate use-cases for the Digital Voting System.
    """

    # ------------------------------------------------------------------
    # Create
    # ------------------------------------------------------------------

    async def add_candidate(
        self,
        db: Session,
        data: CandidateCreate,
        image_file: UploadFile | None = None,
        tenant_id: Optional[int] = None,
    ) -> Candidate:
        """
        Add a candidate to an election.

        Candidates may only be added to elections in ``draft`` or ``active``
        status (not ``closed`` or ``cancelled``).
        """
        election_repo = ElectionRepository(db)
        election = election_repo.get_by_id(data.election_id)

        if election is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Election with id={data.election_id} not found.",
            )
        if tenant_id is not None and election.tenant_id != tenant_id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Election with id={data.election_id} not found.",
            )

        if election.status in (ElectionStatus.closed, ElectionStatus.cancelled):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(
                    f"Cannot add candidates to an election in "
                    f"'{election.status.value}' status."
                ),
            )

        # Validate committee_id if provided
        if data.committee_id is not None:
            committee_repo = CandidateCommitteeRepository(db)
            committee = committee_repo.get_by_id(data.committee_id)
            if not committee:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Candidate committee with id={data.committee_id} not found.",
                )
            if committee.tenant_id != election.tenant_id:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="The selected committee does not belong to this organization.",
                )

        candidate_repo = CandidateRepository(db)
        candidate_data = data.model_dump()
        candidate_data["tenant_id"] = election.tenant_id

        # Handle uploaded image file if provided
        if image_file is not None:
            candidate_data["image_url"] = await save_uploaded_image(
                image_file,
                subdir="candidates",
                filename_prefix="candidate",
            )

        return candidate_repo.create(candidate_data)

    # ------------------------------------------------------------------
    # Read operations
    # ------------------------------------------------------------------

    def get_by_election(
        self, db: Session, election_id: int
    ) -> list[Candidate]:
        """
        Return all candidates registered for the given election.

        Args:
            db:          Active database session.
            election_id: Primary key of the election.

        Returns:
            A list of ``Candidate`` instances.

        Raises:
            HTTPException 404: If the election does not exist.
        """
        election_repo = ElectionRepository(db)
        if election_repo.get_by_id(election_id) is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Election with id={election_id} not found.",
            )

        candidate_repo = CandidateRepository(db)
        return candidate_repo.get_by_election(election_id)

    def get_by_id(self, db: Session, candidate_id: int) -> Candidate:
        """
        Fetch a single candidate by primary key.

        Args:
            db:           Active database session.
            candidate_id: Primary key to look up.

        Returns:
            The matching ``Candidate`` instance.

        Raises:
            HTTPException 404: If no candidate with that id exists.
        """
        repo = CandidateRepository(db)
        candidate: Optional[Candidate] = repo.get_by_id(candidate_id)
        if candidate is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Candidate with id={candidate_id} not found.",
            )
        return candidate

    # ------------------------------------------------------------------
    # Update / Delete
    # ------------------------------------------------------------------

    async def update_candidate(
        self, db: Session, candidate_id: int, data: CandidateUpdate, image_file: UploadFile | None = None
    ) -> Candidate:
        """
        Apply a partial update to a candidate's profile.
        """
        repo = CandidateRepository(db)
        candidate = self.get_by_id(db, candidate_id)

        election_repo = ElectionRepository(db)
        election = election_repo.get_by_id(candidate.election_id)

        if election and election.status in (
            ElectionStatus.closed,
            ElectionStatus.cancelled,
        ):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(
                    f"Cannot update candidates in an election with "
                    f"'{election.status.value}' status."
                ),
            )

        # Validate committee_id if provided
        if data.committee_id is not None:
            committee_repo = CandidateCommitteeRepository(db)
            committee = committee_repo.get_by_id(data.committee_id)
            if not committee:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Candidate committee with id={data.committee_id} not found.",
                )
            if committee.tenant_id != election.tenant_id:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="The selected committee does not belong to this organization.",
                )

        # Handle image replacement
        update_dict = data.model_dump(exclude_unset=True)
        if image_file is not None:
            served_path = await save_uploaded_image(
                image_file,
                subdir="candidates",
                filename_prefix=f"candidate_{candidate_id}",
            )
            delete_uploaded_file(candidate.image_url)
            update_dict["image_url"] = served_path

        return repo.update(candidate, update_dict)

    def delete_candidate(self, db: Session, candidate_id: int) -> bool:
        """
        Permanently delete a candidate.

        Candidates may only be removed from elections that are still in
        ``draft`` status to prevent corruption of live or historical results.

        Args:
            db:           Active database session.
            candidate_id: Primary key of the candidate to delete.

        Returns:
            ``True`` on success.

        Raises:
            HTTPException 404: If the candidate does not exist.
            HTTPException 400: If the parent election is not in ``draft`` status.
        """
        repo = CandidateRepository(db)
        candidate = self.get_by_id(db, candidate_id)

        election_repo = ElectionRepository(db)
        election = election_repo.get_by_id(candidate.election_id)

        if election and election.status != ElectionStatus.draft:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(
                    f"Candidates can only be deleted from draft elections. "
                    f"Current election status: '{election.status.value}'."
                ),
            )

        deleted = repo.delete(candidate_id)
        if not deleted:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Candidate with id={candidate_id} not found.",
            )
        return True

    # ------------------------------------------------------------------
    # Results
    # ------------------------------------------------------------------

    def get_election_results(
        self, db: Session, election_id: int
    ) -> list[Candidate]:
        """
        Return candidates for an election ordered by vote count descending.

        Args:
            db:          Active database session.
            election_id: Primary key of the election.

        Returns:
            A list of ``Candidate`` instances, highest vote-getter first.

        Raises:
            HTTPException 404: If the election does not exist.
        """
        election_repo = ElectionRepository(db)
        if election_repo.get_by_id(election_id) is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Election with id={election_id} not found.",
            )

        candidate_repo = CandidateRepository(db)
        return candidate_repo.get_election_results(election_id)


# ---------------------------------------------------------------------------
# Module-level singleton
# ---------------------------------------------------------------------------
candidate_service = CandidateService()
