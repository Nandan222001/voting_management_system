"""
Candidate repository.

Single Responsibility: All persistence queries for ``Candidate`` records are
centralised here so that no other layer needs to know about the underlying
table schema.
"""

from typing import Optional

from sqlalchemy.orm import Session

from app.models.candidate import Candidate
from app.repositories.base import BaseRepository


class CandidateRepository(BaseRepository[Candidate]):
    """Concrete repository for the ``Candidate`` model."""

    model = Candidate

    def __init__(self, db: Session) -> None:
        super().__init__(db)

    # ------------------------------------------------------------------
    # Lookup helpers
    # ------------------------------------------------------------------

    def get_by_election(self, election_id: int) -> list[Candidate]:
        """
        Return all candidates registered for a specific election.

        Args:
            election_id: Primary key of the parent ``Election``.

        Returns:
            A list of ``Candidate`` instances belonging to that election.
        """
        return (
            self.db.query(Candidate)
            .filter(Candidate.election_id == election_id)
            .all()
        )

    def get_election_results(self, election_id: int) -> list[Candidate]:
        """
        Return candidates for an election ordered by descending vote count.

        Suitable for rendering a results leaderboard or summary.

        Args:
            election_id: Primary key of the target ``Election``.

        Returns:
            A list of ``Candidate`` instances, highest vote-getter first.
        """
        return (
            self.db.query(Candidate)
            .filter(Candidate.election_id == election_id)
            .order_by(Candidate.vote_count.desc())
            .all()
        )

    # ------------------------------------------------------------------
    # Vote count mutation
    # ------------------------------------------------------------------

    def increment_vote_count(self, candidate_id: int) -> Optional[Candidate]:
        """
        Atomically increment the ``vote_count`` of a candidate by 1.

        Uses a server-side expression (``Candidate.vote_count + 1``) to avoid
        a read-modify-write race condition in concurrent environments.

        Args:
            candidate_id: Primary key of the candidate to update.

        Returns:
            The refreshed ``Candidate`` instance, or ``None`` if not found.
        """
        candidate = self.get_by_id(candidate_id)
        if candidate is None:
            return None

        candidate.vote_count = Candidate.vote_count + 1
        self.db.commit()
        self.db.refresh(candidate)
        return candidate
