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

    # ------------------------------------------------------------------
    # Following / Followers
    # ------------------------------------------------------------------

    def get_followers_count(self, email: str) -> int:
        """
        Returns the count of unique followers for a candidate identified by email.
        """
        from app.models.candidate_follower import CandidateFollower
        return (
            self.db.query(CandidateFollower.user_id)
            .join(Candidate, Candidate.id == CandidateFollower.candidate_id)
            .filter(Candidate.email == email)
            .distinct()
            .count()
        )

    def get_followers(self, email: str) -> list:
        """
        Returns the list of users following a candidate identified by email.
        """
        from app.models.candidate_follower import CandidateFollower
        from app.models.user import User
        return (
            self.db.query(User)
            .join(CandidateFollower, User.id == CandidateFollower.user_id)
            .join(Candidate, Candidate.id == CandidateFollower.candidate_id)
            .filter(Candidate.email == email)
            .distinct()
            .all()
        )

    def get_following_count(self, user_id: int) -> int:
        """
        Returns the count of candidates followed by the user.
        """
        from app.models.candidate_follower import CandidateFollower
        return (
            self.db.query(CandidateFollower)
            .filter(CandidateFollower.user_id == user_id)
            .count()
        )

    def get_following(self, user_id: int) -> list[Candidate]:
        """
        Returns the list of candidates followed by the user.
        """
        from app.models.candidate_follower import CandidateFollower
        return (
            self.db.query(Candidate)
            .join(CandidateFollower, Candidate.id == CandidateFollower.candidate_id)
            .filter(CandidateFollower.user_id == user_id)
            .all()
        )

    def get_follow_status(self, candidate_id: int, user_id: int) -> bool:
        """
        Check if a user is following a candidate.
        """
        from app.models.candidate_follower import CandidateFollower
        return (
            self.db.query(CandidateFollower)
            .filter(
                CandidateFollower.candidate_id == candidate_id,
                CandidateFollower.user_id == user_id,
            )
            .first()
            is not None
        )

    def toggle_follow(self, candidate_id: int, user_id: int, tenant_id: int) -> bool:
        """
        Toggle follow status. Returns True if now following, False if unfollowed.
        """
        from app.models.candidate_follower import CandidateFollower
        existing = (
            self.db.query(CandidateFollower)
            .filter(
                CandidateFollower.candidate_id == candidate_id,
                CandidateFollower.user_id == user_id,
            )
            .first()
        )

        if existing:
            self.db.delete(existing)
            self.db.commit()
            return False
        else:
            new_follow = CandidateFollower(
                candidate_id=candidate_id, user_id=user_id, tenant_id=tenant_id
            )
            self.db.add(new_follow)
            self.db.commit()
            return True
