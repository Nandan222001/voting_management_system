"""
Election repository.

Single Responsibility: Owns every SQLAlchemy query related to ``Election``
records.  The service layer should never construct raw ORM queries for
elections directly.
"""

from typing import Optional

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.candidate import Candidate
from app.models.election import Election, ElectionStatus
from app.repositories.base import BaseRepository


class ElectionRepository(BaseRepository[Election]):
    """Concrete repository for the ``Election`` model."""

    model = Election

    def __init__(self, db: Session) -> None:
        super().__init__(db)

    # ------------------------------------------------------------------
    # Filtered lookups
    # ------------------------------------------------------------------

    def get_active_elections(self) -> list[Election]:
        """
        Return all elections whose status is ``ACTIVE``.

        Returns:
            A list of active ``Election`` instances.
        """
        return (
            self.db.query(Election)
            .filter(Election.status == ElectionStatus.active)
            .all()
        )

    def get_by_status(self, status: ElectionStatus) -> list[Election]:
        """
        Return all elections matching the given *status*.

        Args:
            status: The ``ElectionStatus`` to filter by.

        Returns:
            A list of matching ``Election`` instances.
        """
        return (
            self.db.query(Election)
            .filter(Election.status == status)
            .all()
        )

    def get_with_candidate_count(self) -> list[tuple]:
        """
        Return elections alongside the number of candidates registered for
        each, as a list of ``(Election, candidate_count)`` tuples.

        Returns:
            List of ``(Election, int)`` tuples ordered by election id.
        """
        return (
            self.db.query(Election, func.count(Candidate.id).label("candidate_count"))
            .outerjoin(Candidate, Candidate.election_id == Election.id)
            .group_by(Election.id)
            .order_by(Election.id)
            .all()
        )

    # ------------------------------------------------------------------
    # Status mutation
    # ------------------------------------------------------------------

    def update_status(
        self,
        election_id: int,
        status: ElectionStatus,
    ) -> Optional[Election]:
        """
        Transition an election to a new *status*.

        Args:
            election_id: Primary key of the election to update.
            status:      The target ``ElectionStatus``.

        Returns:
            The updated ``Election`` instance, or ``None`` if not found.
        """
        election = self.get_by_id(election_id)
        if election is None:
            return None
        election.status = status
        self.db.commit()
        self.db.refresh(election)
        return election
