"""
Election management service.

Single Responsibility: Handles all business logic for election lifecycle
management — creation, retrieval, updates, status transitions, and statistics.

Open/Closed Principle: New transition guards (e.g. "can only activate if
candidates exist") can be added without changing existing method signatures.

Dependency Inversion: Depends on ``ElectionRepository`` (abstraction).
"""

from typing import Any, Optional

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.election import Election, ElectionStatus
from app.repositories.election_repository import ElectionRepository
from app.schemas.election import ElectionCreate, ElectionUpdate


class ElectionService:
    """
    Orchestrates election use-cases for the Digital Voting System.
    """

    # ------------------------------------------------------------------
    # Create
    # ------------------------------------------------------------------

    def create_election(
        self,
        db: Session,
        data: ElectionCreate,
        created_by: int,
    ) -> Election:
        """
        Persist a new election.

        Args:
            db:         Active database session.
            data:       Validated creation payload.
            created_by: Primary key of the admin creating the election.

        Returns:
            The freshly-created ``Election`` ORM instance.
        """
        repo = ElectionRepository(db)
        election_data = data.model_dump()
        election_data["created_by"] = created_by
        return repo.create(election_data)

    # ------------------------------------------------------------------
    # Read operations
    # ------------------------------------------------------------------

    def get_all(
        self,
        db: Session,
        skip: int = 0,
        limit: int = 20,
        status_filter: Optional[ElectionStatus] = None,
    ) -> tuple[list[Election], int]:
        """
        Return a paginated list of elections, optionally filtered by status.

        Args:
            db:            Active database session.
            skip:          Row offset.
            limit:         Maximum rows to return.
            status_filter: When supplied, restrict to elections with this status.

        Returns:
            A ``(elections, total)`` tuple.
        """
        query = db.query(Election)
        if status_filter is not None:
            query = query.filter(Election.status == status_filter)

        total: int = query.count()
        elections: list[Election] = (
            query.order_by(Election.created_at.desc())
            .offset(skip)
            .limit(limit)
            .all()
        )
        return elections, total

    def get_by_id(self, db: Session, election_id: int) -> Election:
        """
        Fetch a single election by primary key.

        Args:
            db:          Active database session.
            election_id: Primary key to look up.

        Returns:
            The matching ``Election`` instance.

        Raises:
            HTTPException 404: If no election with that id exists.
        """
        repo = ElectionRepository(db)
        election: Optional[Election] = repo.get_by_id(election_id)
        if election is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Election with id={election_id} not found.",
            )
        return election

    # ------------------------------------------------------------------
    # Update / Delete
    # ------------------------------------------------------------------

    def update_election(
        self, db: Session, election_id: int, data: ElectionUpdate
    ) -> Election:
        """
        Apply a partial update to an election.

        Args:
            db:          Active database session.
            election_id: Primary key of the election to update.
            data:        Pydantic schema containing only the fields to change.

        Returns:
            The updated ``Election`` instance.

        Raises:
            HTTPException 404: If the election does not exist.
            HTTPException 400: If trying to update a closed or cancelled election.
        """
        repo = ElectionRepository(db)
        election = self.get_by_id(db, election_id)

        if election.status in (ElectionStatus.closed, ElectionStatus.cancelled):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Cannot update an election in '{election.status.value}' status.",
            )

        return repo.update(election, data)

    def delete_election(self, db: Session, election_id: int) -> bool:
        """
        Permanently delete an election.

        Only draft elections may be deleted to prevent accidental removal of
        active or historical voting data.

        Args:
            db:          Active database session.
            election_id: Primary key of the election to delete.

        Returns:
            ``True`` on success.

        Raises:
            HTTPException 404: If the election does not exist.
            HTTPException 400: If the election is not in ``draft`` status.
        """
        repo = ElectionRepository(db)
        election = self.get_by_id(db, election_id)

        if election.status != ElectionStatus.draft:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(
                    f"Only draft elections can be deleted. "
                    f"Current status: '{election.status.value}'."
                ),
            )

        deleted = repo.delete(election_id)
        if not deleted:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Election with id={election_id} not found.",
            )
        return True

    # ------------------------------------------------------------------
    # Status transitions
    # ------------------------------------------------------------------

    def activate_election(self, db: Session, election_id: int) -> Election:
        """
        Transition a draft election to ``active``.

        Args:
            db:          Active database session.
            election_id: Primary key of the election to activate.

        Returns:
            The updated ``Election`` instance.

        Raises:
            HTTPException 404: If the election does not exist.
            HTTPException 400: If the election is not in ``draft`` status.
        """
        repo = ElectionRepository(db)
        election = self.get_by_id(db, election_id)

        if election.status != ElectionStatus.draft:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(
                    f"Only draft elections can be activated. "
                    f"Current status: '{election.status.value}'."
                ),
            )

        updated = repo.update_status(election_id, ElectionStatus.active)
        if updated is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Election with id={election_id} not found.",
            )
        return updated

    def close_election(self, db: Session, election_id: int) -> Election:
        """
        Transition an active election to ``closed``.

        Args:
            db:          Active database session.
            election_id: Primary key of the election to close.

        Returns:
            The updated ``Election`` instance.

        Raises:
            HTTPException 404: If the election does not exist.
            HTTPException 400: If the election is not in ``active`` status.
        """
        repo = ElectionRepository(db)
        election = self.get_by_id(db, election_id)

        if election.status != ElectionStatus.active:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(
                    f"Only active elections can be closed. "
                    f"Current status: '{election.status.value}'."
                ),
            )

        updated = repo.update_status(election_id, ElectionStatus.closed)
        if updated is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Election with id={election_id} not found.",
            )
        return updated

    # ------------------------------------------------------------------
    # Statistics
    # ------------------------------------------------------------------

    def get_stats(self, db: Session) -> dict[str, Any]:
        """
        Return aggregate election statistics.

        Args:
            db: Active database session.

        Returns:
            A dictionary with keys:
            ``total``, ``draft``, ``active``, ``closed``, ``cancelled``.
        """
        total: int = db.query(Election).count()
        draft_count: int = (
            db.query(Election)
            .filter(Election.status == ElectionStatus.draft)
            .count()
        )
        active_count: int = (
            db.query(Election)
            .filter(Election.status == ElectionStatus.active)
            .count()
        )
        closed_count: int = (
            db.query(Election)
            .filter(Election.status == ElectionStatus.closed)
            .count()
        )
        cancelled_count: int = (
            db.query(Election)
            .filter(Election.status == ElectionStatus.cancelled)
            .count()
        )

        return {
            "total": total,
            "draft": draft_count,
            "active": active_count,
            "closed": closed_count,
            "cancelled": cancelled_count,
        }


# ---------------------------------------------------------------------------
# Module-level singleton
# ---------------------------------------------------------------------------
election_service = ElectionService()
