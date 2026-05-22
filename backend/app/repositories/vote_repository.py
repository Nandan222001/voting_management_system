"""
Vote repository.

Single Responsibility: All database queries that concern the ``Vote`` model
live exclusively here. Services rely on this abstraction rather than on raw
SQLAlchemy expressions (Dependency Inversion Principle).
"""

from typing import Optional

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.vote import Vote
from app.repositories.base import BaseRepository


class VoteRepository(BaseRepository[Vote]):
    """Concrete repository for the ``Vote`` model."""

    model = Vote

    def __init__(self, db: Session) -> None:
        super().__init__(db)

    # ------------------------------------------------------------------
    # Lookup helpers
    # ------------------------------------------------------------------

    def get_user_vote_in_election(
        self, user_id: int, election_id: int
    ) -> Optional[Vote]:
        """
        Fetch the vote cast by *user_id* in *election_id*, if any.

        Args:
            user_id:     Primary key of the voter.
            election_id: Primary key of the election.

        Returns:
            The matching ``Vote`` instance, or ``None``.
        """
        return (
            self.db.query(Vote)
            .filter(Vote.user_id == user_id, Vote.election_id == election_id)
            .first()
        )

    def has_user_voted(self, user_id: int, election_id: int) -> bool:
        """
        Return ``True`` if the user has already cast a vote in the election.

        Args:
            user_id:     Primary key of the voter.
            election_id: Primary key of the election.

        Returns:
            Boolean indicating whether a vote record exists.
        """
        return (
            self.db.query(Vote)
            .filter(Vote.user_id == user_id, Vote.election_id == election_id)
            .count()
            > 0
        )

    def get_election_vote_count(self, election_id: int) -> int:
        """
        Return the total number of votes cast in *election_id*.

        Args:
            election_id: Primary key of the election.

        Returns:
            Integer vote count.
        """
        return (
            self.db.query(Vote)
            .filter(Vote.election_id == election_id)
            .count()
        )

    def get_results_by_election(self, election_id: int) -> list[Vote]:
        """
        Return all vote records for the given election, ordered by
        ``voted_at`` ascending.

        Args:
            election_id: Primary key of the election.

        Returns:
            A list of ``Vote`` instances.
        """
        return (
            self.db.query(Vote)
            .filter(Vote.election_id == election_id)
            .order_by(Vote.voted_at.asc())
            .all()
        )

    def get_total_vote_count(self) -> int:
        """
        Return the total number of votes across all elections.

        Returns:
            Integer total vote count.
        """
        return self.db.query(Vote).count()

    def get_vote_count_by_candidate(self, election_id: int) -> list[tuple]:
        """
        Return ``(candidate_id, vote_count)`` tuples for an election, grouped
        by candidate, ordered by count descending.

        Args:
            election_id: Primary key of the election.

        Returns:
            List of ``(int, int)`` tuples.
        """
        return (
            self.db.query(Vote.candidate_id, func.count(Vote.id).label("vote_count"))
            .filter(Vote.election_id == election_id)
            .group_by(Vote.candidate_id)
            .order_by(func.count(Vote.id).desc())
            .all()
        )
