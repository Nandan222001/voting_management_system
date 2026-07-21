"""
Election management service.

Single Responsibility: Handles all business logic for election lifecycle
management — creation, retrieval, updates, status transitions, and statistics.

Open/Closed Principle: New transition guards (e.g. "can only activate if
candidates exist") can be added without changing existing method signatures.

Dependency Inversion: Depends on ``ElectionRepository`` (abstraction).
"""

from typing import Any, Optional
from datetime import datetime, timezone

from fastapi import HTTPException, status
from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.models.election import Election, ElectionStatus
from app.models.candidate import Candidate
from app.models.vote import Vote
from app.repositories.election_repository import ElectionRepository
from app.repositories.tenant_repository import TenantRepository
from app.schemas.election import ElectionCreate, ElectionUpdate


class ElectionService:
    """
    Orchestrates election use-cases for the Digital Voting System.
    """

    def resolve_superadmin_tenant_id(
        self,
        db: Session,
        tenant_id: Optional[int] = None,
    ) -> int:
        """
        Resolve the tenant used when a superadmin creates tenant-owned data.
        """
        if tenant_id is not None:
            return tenant_id

        tenant_repo = TenantRepository(db)
        tenants = tenant_repo.get_all(skip=0, limit=2)
        if len(tenants) == 1:
            return tenants[0].id

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="tenant_id is required when a superadmin creates an election.",
        )

    def attach_winner_summary(self, db: Session, election: Election) -> Election:
        candidates = (
            db.query(Candidate)
            .filter(Candidate.election_id == election.id)
            .order_by(Candidate.vote_count.desc(), Candidate.full_name.asc())
            .all()
        )
        total_votes = sum(c.vote_count or 0 for c in candidates)
        setattr(election, "candidate_count", len(candidates))
        setattr(election, "total_votes", total_votes)
        setattr(election, "winner", None)
        setattr(election, "winners", [])
        setattr(election, "is_tie", False)
        setattr(election, "winner_declared", False)

        if election.status != ElectionStatus.closed or total_votes <= 0 or not candidates:
            return election

        top_vote_count = candidates[0].vote_count or 0
        top_candidates = [c for c in candidates if (c.vote_count or 0) == top_vote_count]
        winners = [
            {
                "candidate_id": c.id,
                "candidate_name": c.full_name,
                "image_url": c.image_url,
                "vote_count": c.vote_count or 0,
                "percentage": round(((c.vote_count or 0) / total_votes) * 100, 2),
                "rank": 1,
            }
            for c in top_candidates
        ]
        is_tie = len(winners) > 1
        setattr(election, "winners", winners)
        setattr(election, "is_tie", is_tie)
        setattr(election, "winner", winners[0] if not is_tie and winners else None)
        setattr(election, "winner_declared", bool(winners and not is_tie))
        return election

    # ------------------------------------------------------------------
    # Create
    # ------------------------------------------------------------------

    def create_election(
        self,
        db: Session,
        data: ElectionCreate,
        created_by: int,
        tenant_id: Optional[int] = None,
        bypass_limit: bool = False,
    ) -> Election:
        """
        Persist a new election, scoped to *tenant_id*.
        """
        if tenant_id is not None and not bypass_limit:
            tenant_repo = TenantRepository(db)
            tenant = tenant_repo.get_by_id(tenant_id)
            if tenant is not None:
                current_count: int = (
                    db.query(Election)
                    .filter(Election.tenant_id == tenant_id)
                    .count()
                )
                if current_count >= tenant.max_elections:
                    raise HTTPException(
                        status_code=status.HTTP_402_PAYMENT_REQUIRED,
                        detail=(
                            f"Election limit of {tenant.max_elections} has been "
                            "reached for this organisation. Please upgrade your plan."
                        ),
                    )

        repo = ElectionRepository(db)
        election_data = data.model_dump(exclude={"target_ids"})

        # Clean target_ids and derive legacy target_id/target_district
        clean_ids = []
        if data.target_ids:
            clean_ids = [int(tid) for tid in data.target_ids if tid is not None]
            if clean_ids:
                # Set legacy target_id to the first selected target
                election_data["target_id"] = clean_ids[0]
                # Derive target_district from first target name if available
                from app.models.target import Target
                first_target = db.query(Target).filter(Target.id == clean_ids[0]).first()
                if first_target and first_target.name:
                    election_data["target_district"] = first_target.name

        election_data["created_by"] = created_by
        election_data["tenant_id"] = tenant_id
        
        election = repo.create(election_data)
        
        if clean_ids:
            from app.models.target import Target
            targets = db.query(Target).filter(Target.id.in_(clean_ids)).all()
            election.targets = targets
            db.commit()
            
        return election

    # ------------------------------------------------------------------
    # Read operations
    # ------------------------------------------------------------------

    def get_all(
        self,
        db: Session,
        skip: int = 0,
        limit: int = 20,
        status_filter: Optional[str] = None,
        search_filter: Optional[str] = None,
        tenant_id: Optional[int] = None,
        member_district: Optional[str] = None,
    ) -> tuple[list[Election], int]:
        """
        Return a paginated list of elections, optionally filtered by status,
        search term, and scoped to a tenant.
        """
        from sqlalchemy import text

        query = db.query(Election)

        if tenant_id is not None:
            query = query.filter(Election.tenant_id == tenant_id)

        if status_filter:
            query = query.filter(text("status = :status")).params(status=status_filter)

        if search_filter:
            search_param = f"%{search_filter}%"
            query = query.filter(Election.title.ilike(search_param))

        if member_district is not None:
            query = query.filter(
                or_(
                    Election.target_district.is_(None),
                    Election.target_district == "",
                    Election.target_district == member_district,
                )
            )

        total: int = query.count()
        elections: list[Election] = (
            query.order_by(Election.created_at.desc())
            .offset(skip)
            .limit(limit)
            .all()
        )
        for election in elections:
            self.attach_winner_summary(db, election)
        return elections, total

    def get_by_id(
        self,
        db: Session,
        election_id: int,
        tenant_id: Optional[int] = None,
    ) -> Election:
        """
        Fetch a single election by primary key, optionally scoped to a tenant.
        """
        repo = ElectionRepository(db)
        election: Optional[Election] = repo.get_by_id(election_id)
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
        return self.attach_winner_summary(db, election)

    # ------------------------------------------------------------------
    # Update / Delete
    # ------------------------------------------------------------------

    def update_election(
        self,
        db: Session,
        election_id: int,
        data: ElectionUpdate,
        tenant_id: Optional[int] = None,
    ) -> Election:
        """
        Apply a partial update to an election.
        """
        repo = ElectionRepository(db)
        election = self.get_by_id(db, election_id, tenant_id=tenant_id)

        if election.status in (ElectionStatus.closed, ElectionStatus.cancelled):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Cannot update an election in '{election.status.value}' status.",
            )

        update_data = data.model_dump(exclude_unset=True, exclude={"target_ids"})

        # If target_ids are being updated, also sync legacy target_id/target_district
        if data.target_ids is not None:
            clean_ids = [int(tid) for tid in data.target_ids if tid is not None]
            if clean_ids:
                from app.models.target import Target
                first_target = db.query(Target).filter(Target.id == clean_ids[0]).first()
                if first_target:
                    update_data["target_id"] = clean_ids[0]
                    update_data["target_district"] = first_target.name
                targets = db.query(Target).filter(Target.id.in_(clean_ids)).all()
                updated.targets = targets
            else:
                update_data["target_id"] = None
                update_data["target_district"] = None
                updated.targets = []

        updated = repo.update(election, update_data)
        db.commit()

        return updated

    def delete_election(
        self,
        db: Session,
        election_id: int,
        tenant_id: Optional[int] = None,
    ) -> bool:
        """
        Permanently delete an election.
        """
        repo = ElectionRepository(db)
        election = self.get_by_id(db, election_id, tenant_id=tenant_id)

        if election.status != ElectionStatus.draft:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Only draft elections can be deleted. Current status: '{election.status.value}'.",
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

    def activate_election(
        self,
        db: Session,
        election_id: int,
        tenant_id: Optional[int] = None,
    ) -> Election:
        """
        Transition a draft election to ``active``.
        """
        repo = ElectionRepository(db)
        election = self.get_by_id(db, election_id, tenant_id=tenant_id)

        if election.status != ElectionStatus.draft:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Only draft elections can be activated. Current status: '{election.status.value}'.",
            )

        candidate_count: int = (
            db.query(Candidate)
            .filter(Candidate.election_id == election_id)
            .count()
        )
        if candidate_count == 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot activate an election with zero candidates.",
            )

        updated = repo.update_status(election_id, ElectionStatus.active)
        if updated is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Election with id={election_id} not found.",
            )
        return updated

    def close_election(
        self,
        db: Session,
        election_id: int,
        tenant_id: Optional[int] = None,
    ) -> Election:
        """
        Transition an active election to ``closed``.
        """
        repo = ElectionRepository(db)
        election = self.get_by_id(db, election_id, tenant_id=tenant_id)

        if election.status != ElectionStatus.active:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Only active elections can be closed. Current status: '{election.status.value}'.",
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

    def get_stats(
        self,
        db: Session,
        tenant_id: Optional[int] = None,
    ) -> dict[str, Any]:
        """
        Return aggregate election statistics.
        """
        base_query = db.query(Election)
        if tenant_id is not None:
            base_query = base_query.filter(Election.tenant_id == tenant_id)

        total: int = base_query.count()
        draft_count: int = base_query.filter(Election.status == ElectionStatus.draft).count()
        active_count: int = base_query.filter(Election.status == ElectionStatus.active).count()
        closed_count: int = base_query.filter(Election.status == ElectionStatus.closed).count()
        cancelled_count: int = base_query.filter(Election.status == ElectionStatus.cancelled).count()

        return {
            "total": total,
            "draft": draft_count,
            "active": active_count,
            "closed": closed_count,
            "cancelled": cancelled_count,
        }

    # ------------------------------------------------------------------
    # Completed Elections
    # ------------------------------------------------------------------

    def get_completed(
        self,
        db: Session,
        tenant_id: Optional[int] = None,
    ) -> list[dict[str, Any]]:
        """
        Return ALL completed elections with winner summaries.
        """
        query = db.query(Election)

        if tenant_id is not None:
            query = query.filter(Election.tenant_id == tenant_id)

        now = datetime.now(timezone.utc)
        query = query.filter(
            or_(
                Election.status == ElectionStatus.closed,
                Election.end_date < now,
            )
        )

        elections = query.order_by(Election.end_date.desc()).all()
        return self._build_results(db, elections)

    def get_completed_for_user(
        self,
        db: Session,
        user_id: int,
        tenant_id: Optional[int] = None,
    ) -> list[dict[str, Any]]:
        """
        Return ONLY completed elections where the user has cast at least one vote.
        """
        # Get distinct election IDs the user voted in
        voted_election_ids = (
            db.query(Vote.election_id)
            .filter(Vote.user_id == user_id)
            .distinct()
            .subquery()
        )

        query = db.query(Election).filter(Election.id.in_(voted_election_ids))

        if tenant_id is not None:
            query = query.filter(Election.tenant_id == tenant_id)

        now = datetime.now(timezone.utc)
        query = query.filter(
            or_(
                Election.status == ElectionStatus.closed,
                Election.end_date < now,
            )
        )

        elections = query.order_by(Election.end_date.desc()).all()
        return self._build_results(db, elections)

    def get_completed_by_id(
        self,
        db: Session,
        election_id: int,
        tenant_id: Optional[int] = None,
    ) -> dict[str, Any]:
        """
        Return a single completed election result by ID, or raise 404.
        """
        election = db.query(Election).filter(Election.id == election_id).first()
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
        # Ensure it's completed (handle naive end_date from SQLite)
        now = datetime.now(timezone.utc)
        end_date = election.end_date
        if end_date is not None and end_date.tzinfo is None:
            end_date = end_date.replace(tzinfo=timezone.utc)
        is_completed = (
            election.status == ElectionStatus.closed or
            (end_date is not None and end_date < now)
        )
        if not is_completed:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Election is not yet completed.",
            )
        results = self._build_results(db, [election])
        return results[0] if results else {}

    def _build_results(
        self,
        db: Session,
        elections: list[Election],
    ) -> list[dict[str, Any]]:
        """
        Shared helper: build result dicts with winner, runner-up, and candidate list.
        """
        results = []
        for election in elections:
            candidates = (
                db.query(Candidate)
                .filter(Candidate.election_id == election.id)
                .order_by(Candidate.vote_count.desc(), Candidate.full_name.asc())
                .all()
            )
            total_votes = sum(c.vote_count or 0 for c in candidates)
            winner = candidates[0] if candidates and (candidates[0].vote_count or 0) > 0 else None
            runner_up = candidates[1] if len(candidates) > 1 and (candidates[1].vote_count or 0) > 0 else None
            winning_margin = (
                (winner.vote_count or 0) - (runner_up.vote_count or 0)
                if winner and runner_up
                else (winner.vote_count or 0 if winner else 0)
            )

            candidate_list = []
            for idx, c in enumerate(candidates, start=1):
                pct = (
                    round(((c.vote_count or 0) / total_votes) * 100, 2)
                    if total_votes > 0
                    else 0.0
                )
                candidate_list.append({
                    "id": c.id,
                    "name": c.full_name,
                    "photo": c.image_url,
                    "symbol": c.symbol,
                    "votes": c.vote_count or 0,
                    "percentage": pct,
                    "rank": idx,
                })

            results.append({
                "election_id": election.id,
                "title": election.title,
                "status": election.status.value,
                "end_date": election.end_date.isoformat() if election.end_date else None,
                "total_votes": total_votes,
                "winner": {
                    "candidate_id": winner.id,
                    "name": winner.full_name,
                    "photo": winner.image_url,
                    "symbol": winner.symbol,
                    "position": winner.position_name,
                    "votes": winner.vote_count or 0,
                } if winner else None,
                "runner_up": {
                    "candidate_id": runner_up.id,
                    "name": runner_up.full_name,
                    "votes": runner_up.vote_count or 0,
                } if runner_up else None,
                "winning_margin": winning_margin,
                "candidates": candidate_list,
            })

        return results


# ---------------------------------------------------------------------------
# Module-level singleton
# ---------------------------------------------------------------------------
election_service = ElectionService()