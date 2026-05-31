"""
Voting service.

Single Responsibility: Handles the core voting workflow — ballot casting,
duplicate-vote prevention, vote count aggregation, and results calculation.

Open/Closed Principle: New voting rules (e.g. time-window enforcement) can be
injected without modifying ``cast_vote``'s signature.

Dependency Inversion: Depends on repository abstractions; never on direct SQL.
"""

from datetime import datetime, timezone
from typing import Any, Optional

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.election import Election, ElectionStatus
from app.models.user import User
from app.models.vote import Vote
from app.repositories.audit_log_repository import AuditLogRepository
from app.repositories.candidate_repository import CandidateRepository
from app.repositories.election_repository import ElectionRepository
from app.repositories.payment_repository import PaymentRepository
from app.repositories.vote_repository import VoteRepository
from app.schemas.vote import ElectionResultResponse, VoteResultItem


class VoteService:
    """
    Orchestrates voting use-cases for the Digital Voting System.
    """

    # ------------------------------------------------------------------
    # Cast a vote
    # ------------------------------------------------------------------

    def cast_vote(
        self,
        db: Session,
        user_id: int,
        election_id: int,
        candidate_id: int,
        ip_address: Optional[str] = None,
        tenant_id: Optional[int] = None,
    ) -> Vote:
        """
        Cast a ballot on behalf of *user_id* in *election_id* for
        *candidate_id*.

        Validation steps performed (in order):
        1. The election must exist and belong to the same tenant as the voter.
        2. The election must currently be ``active``.
        3. The candidate must exist and belong to the election (and same tenant).
        4. The user must not have already voted in this election.

        Side-effects on success:
        * A ``Vote`` record is created with ``tenant_id`` set.
        * The candidate's ``vote_count`` is atomically incremented.
        * An audit log entry is written.

        Args:
            db:           Active database session.
            user_id:      Primary key of the voting user.
            election_id:  Primary key of the target election.
            candidate_id: Primary key of the chosen candidate.
            ip_address:   Network address of the client (optional).
            tenant_id:    Tenant the voter belongs to; all related entities must
                          share this tenant.  Pass ``None`` for superadmin.

        Returns:
            The newly-created ``Vote`` ORM instance.

        Raises:
            HTTPException 404: If the election or candidate is not found, or
                               does not belong to the same tenant.
            HTTPException 400: If the election is not active.
            HTTPException 409: If the user has already voted in this election.
        """
        election_repo = ElectionRepository(db)
        candidate_repo = CandidateRepository(db)
        vote_repo = VoteRepository(db)
        audit_repo = AuditLogRepository(db)

        # 1. Election must exist and belong to the correct tenant.
        election: Optional[Election] = election_repo.get_by_id(election_id)
        if election is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Election with id={election_id} not found.",
            )
        if tenant_id is not None and election.tenant_id != tenant_id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Election with id={election_id} not found.",
            )

        # 2. Election must be active.
        if election.status != ElectionStatus.active:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(
                    f"Voting is not currently open for this election. "
                    f"Status: '{election.status.value}'."
                ),
            )

        member = db.query(User).filter(User.id == user_id).first()
        if member is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Member not found.",
            )
        if election.target_district and member.district != election.target_district:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="This election is not available for your district.",
            )

        if member.membership_plan_id is None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(
                    "Please select a Membership Plan first: "
                    "Profile -> Edit Profile -> Select Membership Plan."
                ),
            )

        effective_tenant_id = tenant_id if tenant_id is not None else election.tenant_id
        if not PaymentRepository(db).has_captured_payment_for_user(
            effective_tenant_id,
            user_id,
        ):
            raise HTTPException(
                status_code=status.HTTP_402_PAYMENT_REQUIRED,
                detail=(
                    "Your selected Membership Plan payment is pending or not completed. "
                    "Please complete the payment to proceed with voting."
                ),
            )

        # 3. Candidate must belong to this election (and therefore same tenant).
        candidate = candidate_repo.get_by_id(candidate_id)
        if candidate is None or candidate.election_id != election_id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=(
                    f"Candidate with id={candidate_id} not found "
                    f"in election id={election_id}."
                ),
            )

        # 4. Duplicate vote check.
        if vote_repo.has_user_voted(user_id, election_id):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="You have already cast your vote in this election.",
            )

        # Persist the vote — tenant_id is required on the Vote model.
        vote = Vote(
            user_id=user_id,
            election_id=election_id,
            candidate_id=candidate_id,
            voted_at=datetime.now(timezone.utc),
            ip_address=ip_address,
            tenant_id=tenant_id if tenant_id is not None else election.tenant_id,
        )
        db.add(vote)

        # Atomically increment the candidate's tally.
        candidate_repo.increment_vote_count(candidate_id)

        db.commit()
        db.refresh(vote)

        # Write an audit trail entry (non-critical — logged after commit).
        try:
            audit_repo.log_action(
                user_id=user_id,
                action="vote.cast",
                entity_type="election",
                entity_id=election_id,
                details={
                    "candidate_id": candidate_id,
                    "election_title": election.title,
                },
                ip_address=ip_address,
            )
        except Exception:
            # Audit failure must not roll back the vote.
            pass

        return vote

    # ------------------------------------------------------------------
    # User's vote
    # ------------------------------------------------------------------

    def get_user_vote(
        self,
        db: Session,
        user_id: int,
        election_id: int,
    ) -> Optional[Vote]:
        """
        Retrieve the vote record for a specific user in a specific election.
        """
        vote_repo = VoteRepository(db)
        return vote_repo.get_user_vote_in_election(user_id, election_id)

    # ------------------------------------------------------------------
    # Election results
    # ------------------------------------------------------------------

    def get_election_results(
        self,
        db: Session,
        election_id: int,
        tenant_id: Optional[int] = None,
    ) -> ElectionResultResponse:
        """
        Return the full result summary for *election_id*, including per-
        candidate vote counts and percentage shares.

        Args:
            db:          Active database session.
            election_id: Primary key of the election.
            tenant_id:   When supplied, verify the election belongs to this
                         tenant before returning results.

        Returns:
            An :class:`~app.schemas.vote.ElectionResultResponse` instance.

        Raises:
            HTTPException 404: If the election does not exist or is not in tenant.
        """
        election_repo = ElectionRepository(db)
        election: Optional[Election] = election_repo.get_by_id(election_id)
        if election is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Election with id={election_id} not found.",
            )
        if tenant_id is not None and election.tenant_id != tenant_id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Election with id={election_id} not found.",
            )

        vote_repo = VoteRepository(db)
        candidate_repo = CandidateRepository(db)

        total_votes: int = vote_repo.get_election_vote_count(election_id)
        candidates = candidate_repo.get_election_results(election_id)

        result_items: list[VoteResultItem] = []
        previous_votes: int | None = None
        current_rank = 0
        for index, candidate in enumerate(candidates, start=1):
            if previous_votes is None or candidate.vote_count < previous_votes:
                current_rank = index
                previous_votes = candidate.vote_count
            percentage = (
                round((candidate.vote_count / total_votes) * 100, 2)
                if total_votes > 0
                else 0.0
            )
            result_items.append(
                VoteResultItem(
                    candidate_id=candidate.id,
                    candidate_name=candidate.full_name,
                    symbol=candidate.symbol,
                    image_url=candidate.image_url,
                    rank=current_rank,
                    vote_count=candidate.vote_count,
                    percentage=percentage,
                )
            )

        can_declare_winner = election.status == ElectionStatus.closed
        top_vote_count = result_items[0].vote_count if result_items else 0
        top_candidates = [
            item for item in result_items
            if can_declare_winner and total_votes > 0 and item.vote_count == top_vote_count
        ]
        is_tie = len(top_candidates) > 1
        winner = top_candidates[0] if len(top_candidates) == 1 else None
        for item in result_items:
            item.is_winner = bool(winner and item.candidate_id == winner.candidate_id)

        return ElectionResultResponse(
            election_id=election_id,
            election_title=election.title,
            total_votes=total_votes,
            results=result_items,
            winner=winner,
            winners=top_candidates,
            is_tie=is_tie,
            winner_declared=winner is not None,
        )

    # ------------------------------------------------------------------
    # Live statistics
    # ------------------------------------------------------------------

    def get_live_stats(
        self,
        db: Session,
        election_id: int,
        tenant_id: Optional[int] = None,
    ) -> dict[str, Any]:
        """
        Return real-time voting statistics for an election.

        Includes total votes cast, participation count, and a compact per-
        candidate breakdown.

        Args:
            db:          Active database session.
            election_id: Primary key of the election.
            tenant_id:   When supplied, verify the election belongs to this
                         tenant before returning stats.

        Returns:
            A dictionary with keys:
            ``election_id``, ``election_title``, ``status``,
            ``total_votes``, ``candidate_stats``.

        Raises:
            HTTPException 404: If the election does not exist or is not in tenant.
        """
        election_repo = ElectionRepository(db)
        election: Optional[Election] = election_repo.get_by_id(election_id)
        if election is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Election with id={election_id} not found.",
            )
        if tenant_id is not None and election.tenant_id != tenant_id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Election with id={election_id} not found.",
            )

        vote_repo = VoteRepository(db)
        candidate_repo = CandidateRepository(db)

        total_votes: int = vote_repo.get_election_vote_count(election_id)
        candidates = candidate_repo.get_election_results(election_id)

        candidate_stats = []
        previous_votes: int | None = None
        current_rank = 0
        for index, c in enumerate(candidates, start=1):
            if previous_votes is None or c.vote_count < previous_votes:
                current_rank = index
                previous_votes = c.vote_count
            candidate_stats.append({
                "candidate_id": c.id,
                "candidate_name": c.full_name,
                "image_url": c.image_url,
                "rank": current_rank,
                "vote_count": c.vote_count,
                "percentage": (
                    round((c.vote_count / total_votes) * 100, 2)
                    if total_votes > 0
                    else 0.0
                ),
            })

        can_declare_winner = election.status == ElectionStatus.closed
        top_vote_count = candidate_stats[0]["vote_count"] if candidate_stats else 0
        winners = [
            item for item in candidate_stats
            if can_declare_winner and total_votes > 0 and item["vote_count"] == top_vote_count
        ]
        is_tie = len(winners) > 1

        return {
            "election_id": election_id,
            "election_title": election.title,
            "status": election.status.value,
            "total_votes": total_votes,
            "candidate_stats": candidate_stats,
            "winner": winners[0] if len(winners) == 1 else None,
            "winners": winners,
            "is_tie": is_tie,
            "winner_declared": len(winners) == 1,
        }


# ---------------------------------------------------------------------------
# Module-level singleton
# ---------------------------------------------------------------------------
vote_service = VoteService()
