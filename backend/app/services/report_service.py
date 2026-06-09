"""
Reporting service.

Single Responsibility: Aggregates cross-entity statistics and reporting data
for the admin dashboard, election reports, participation analytics, and the
audit log viewer.

Open/Closed Principle: New report types can be added as new methods without
altering existing ones.

Dependency Inversion: Depends on repository abstractions — no raw SQL outside
the repository layer.
"""

from typing import Any, Optional

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.audit_log import AuditLog
from app.models.candidate import Candidate
from app.models.election import Election, ElectionStatus
from app.models.user import User, UserStatus
from app.models.vote import Vote
from app.repositories.audit_log_repository import AuditLogRepository
from app.repositories.candidate_repository import CandidateRepository
from app.repositories.election_repository import ElectionRepository
from app.repositories.vote_repository import VoteRepository
from app.schemas.audit_log import AuditLogResponse


class ReportService:
    """
    Provides aggregated reporting and analytics for the Digital Voting System.
    """

    # ------------------------------------------------------------------
    # Dashboard overview
    # ------------------------------------------------------------------

    def get_dashboard_overview(self, db: Session) -> dict[str, Any]:
        """
        Return a high-level overview of the entire system, suitable for the
        admin home dashboard.

        Args:
            db: Active database session.

        Returns:
            A dictionary with keys:
            ``total_users``, ``total_elections``, ``total_votes``,
            ``active_elections``, ``pending_users``, ``closed_elections``,
            ``draft_elections``.
        """
        total_users: int = db.query(User).count()
        total_elections: int = db.query(Election).count()
        total_votes: int = db.query(Vote).count()
        active_elections: int = (
            db.query(Election)
            .filter(Election.status == ElectionStatus.active)
            .count()
        )
        pending_users: int = (
            db.query(User).filter(User.status == UserStatus.pending).count()
        )
        closed_elections: int = (
            db.query(Election)
            .filter(Election.status == ElectionStatus.closed)
            .count()
        )
        draft_elections: int = (
            db.query(Election)
            .filter(Election.status == ElectionStatus.draft)
            .count()
        )

        return {
            "total_users": total_users,
            "total_elections": total_elections,
            "total_votes": total_votes,
            "active_elections": active_elections,
            "pending_users": pending_users,
            "closed_elections": closed_elections,
            "draft_elections": draft_elections,
        }

    # ------------------------------------------------------------------
    # Election report
    # ------------------------------------------------------------------

    def get_election_report(
        self, db: Session, election_id: int
    ) -> dict[str, Any]:
        """
        Build a comprehensive report for a single election including metadata,
        candidate standings, vote distribution, and participation rate.

        Args:
            db:          Active database session.
            election_id: Primary key of the target election.

        Returns:
            A dictionary with keys:
            ``election``, ``total_candidates``, ``total_votes``,
            ``candidate_results``, ``participation_rate``.

        Raises:
            HTTPException 404: If the election does not exist.
        """
        election_repo = ElectionRepository(db)
        candidate_repo = CandidateRepository(db)
        vote_repo = VoteRepository(db)

        election: Optional[Election] = election_repo.get_by_id(election_id)
        if election is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Election with id={election_id} not found.",
            )

        total_votes: int = vote_repo.get_election_vote_count(election_id)
        candidates = candidate_repo.get_election_results(election_id)
        total_candidates: int = len(candidates)

        # Total registered voters (active/verified users).
        total_voters: int = (
            db.query(User)
            .filter(User.status == UserStatus.active, User.is_verified.is_(True))
            .count()
        )
        participation_rate: float = (
            round((total_votes / total_voters) * 100, 2)
            if total_voters > 0
            else 0.0
        )

        candidate_results = []
        for candidate in candidates:
            percentage = (
                round((candidate.vote_count / total_votes) * 100, 2)
                if total_votes > 0
                else 0.0
            )
            candidate_results.append(
                {
                    "candidate_id": candidate.id,
                    "full_name": candidate.full_name,
                    "symbol": candidate.symbol,
                    "vote_count": candidate.vote_count,
                    "percentage": percentage,
                }
            )

        return {
            "election": {
                "id": election.id,
                "title": election.title,
                "description": election.description,
                "status": election.status.value,
                "start_date": election.start_date.isoformat(),
                "end_date": election.end_date.isoformat(),
                "created_by": election.created_by,
            },
            "total_candidates": total_candidates,
            "total_votes": total_votes,
            "candidate_results": candidate_results,
            "participation_rate": participation_rate,
        }

    # ------------------------------------------------------------------
    # Participation statistics
    # ------------------------------------------------------------------

    def get_participation_stats(
        self, db: Session, election_id: int
    ) -> dict[str, Any]:
        """
        Return participation statistics for a single election.

        Args:
            db:          Active database session.
            election_id: Primary key of the election.

        Returns:
            A dictionary with keys:
            ``election_id``, ``election_title``, ``total_eligible_voters``,
            ``total_votes_cast``, ``participation_rate``,
            ``abstention_count``, ``abstention_rate``.

        Raises:
            HTTPException 404: If the election does not exist.
        """
        election_repo = ElectionRepository(db)
        vote_repo = VoteRepository(db)

        election: Optional[Election] = election_repo.get_by_id(election_id)
        if election is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Election with id={election_id} not found.",
            )

        total_votes_cast: int = vote_repo.get_election_vote_count(election_id)

        # Eligible voters are active, verified users with the voter role.
        from app.models.user import UserRole

        total_eligible_voters: int = (
            db.query(User)
            .filter(
                User.status == UserStatus.active,
                User.is_verified.is_(True),
                User.role == UserRole.voter,
            )
            .count()
        )

        participation_rate: float = (
            round((total_votes_cast / total_eligible_voters) * 100, 2)
            if total_eligible_voters > 0
            else 0.0
        )
        abstention_count: int = max(0, total_eligible_voters - total_votes_cast)
        abstention_rate: float = (
            round((abstention_count / total_eligible_voters) * 100, 2)
            if total_eligible_voters > 0
            else 0.0
        )

        return {
            "election_id": election_id,
            "election_title": election.title,
            "total_eligible_voters": total_eligible_voters,
            "total_votes_cast": total_votes_cast,
            "participation_rate": participation_rate,
            "abstention_count": abstention_count,
            "abstention_rate": abstention_rate,
        }

    # ------------------------------------------------------------------
    # Audit logs
    # ------------------------------------------------------------------

    def get_audit_logs(
        self,
        db: Session,
        skip: int = 0,
        limit: int = 50,
        user_id: Optional[int] = None,
        action: Optional[str] = None,
        tenant_id: Optional[int] = None,
        exclude_actions: Optional[list[str]] = None,
    ) -> tuple[list[AuditLogResponse], int]:
        """
        Return a paginated, optionally-filtered list of audit log entries.

        Args:
            db:      Active database session.
            skip:    Row offset for pagination.
            limit:   Maximum rows per page.
            user_id: When supplied, restrict to entries from that user.
            action:  When supplied, restrict to entries with that action type.
            tenant_id: When supplied, restrict to entries for that tenant.
            exclude_actions: When supplied, exclude these actions from results.

        Returns:
            A ``(items, total)`` tuple where items are
            :class:`~app.schemas.audit_log.AuditLogResponse` instances.
        """
        audit_repo = AuditLogRepository(db)
        logs, total = audit_repo.get_paginated(
            skip=skip,
            limit=limit,
            user_id=user_id,
            action=action,
            tenant_id=tenant_id,
            exclude_actions=exclude_actions,
        )

        response_items = [
            AuditLogResponse(
                id=log.id,
                user_id=log.user_id,
                action=log.action,
                entity_type=log.entity_type,
                entity_id=log.entity_id,
                details=log.details,
                ip_address=log.ip_address,
                created_at=log.created_at,
            )
            for log in logs
        ]

        return response_items, total


# ---------------------------------------------------------------------------
# Module-level singleton
# ---------------------------------------------------------------------------
report_service = ReportService()
