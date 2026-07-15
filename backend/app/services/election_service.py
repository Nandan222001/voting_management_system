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
from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.models.election import Election, ElectionStatus
from app.models.candidate import Candidate
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

        Superadmins do not carry a tenant_id in their JWT. If they pass one
        explicitly, use it. If the platform has exactly one tenant, use that
        tenant as a practical default for local/single-tenant deployments.
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

        When *tenant_id* is provided the tenant's ``max_elections`` limit is
        checked before creation unless ``bypass_limit`` is True.  
        Superadmin callers may pass ``None`` to create platform-level elections 
        (no limit check performed).

        Args:
            db:           Active database session.
            data:         Validated creation payload.
            created_by:   Primary key of the admin creating the election.
            tenant_id:    Tenant to assign the election to, or ``None``.
            bypass_limit: If True, skips the election quota check.

        Returns:
            The freshly-created ``Election`` ORM instance.

        Raises:
            HTTPException 402: If the tenant's election limit has been reached.
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
        election_data["created_by"] = created_by
        election_data["tenant_id"] = tenant_id
        
        election = repo.create(election_data)
        
        # Link multiple targets if provided
        if data.target_ids:
            from app.models.target import Target
            targets = db.query(Target).filter(Target.id.in_(data.target_ids)).all()
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

        Args:
            db:            Active database session.
            skip:          Row offset.
            limit:         Maximum rows to return.
            status_filter: When supplied (e.g. 'active', 'draft'), restrict results.
                           'all' or None returns everything.
            search_filter: Optional search term for the election title (LIKE %term%).
            tenant_id:     When supplied, restrict to elections belonging to
                           this tenant.  Pass ``None`` (superadmin) to see all.

        Returns:
            A ``(elections, total)`` tuple.
        """
        from sqlalchemy import text

        # Base query
        query = db.query(Election)

        # 1. Multi-tenancy Scoping
        if tenant_id is not None:
            query = query.filter(Election.tenant_id == tenant_id)

        # 2. Strict Status Filtering (Raw SQL logic via text)
        if status_filter:
            # Query equivalent: WHERE status = :status
            query = query.filter(text("status = :status")).params(status=status_filter)

        # 3. Search Filtering (Node Title Search)
        if search_filter:
            # Query equivalent: WHERE title LIKE :search
            search_param = f"%{search_filter}%"
            query = query.filter(Election.title.ilike(search_param))

        # 4. Member District Scoping
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

        Args:
            db:          Active database session.
            election_id: Primary key to look up.
            tenant_id:   When supplied, verify the election belongs to this
                         tenant.  Pass ``None`` (superadmin) to skip the check.

        Returns:
            The matching ``Election`` instance.

        Raises:
            HTTPException 404: If no election with that id exists, or the
                               election does not belong to the specified tenant.
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

        # Update base fields
        update_data = data.model_dump(exclude_unset=True, exclude={"target_ids"})
        updated = repo.update(election, update_data)
        
        # Update targets relationship if target_ids provided
        if data.target_ids is not None:
            from app.models.target import Target
            targets = db.query(Target).filter(Target.id.in_(data.target_ids)).all()
            updated.targets = targets
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

        Only draft elections may be deleted to prevent accidental removal of
        active or historical voting data.

        Args:
            db:          Active database session.
            election_id: Primary key of the election to delete.
            tenant_id:   When supplied, verify tenant ownership before deletion.

        Returns:
            ``True`` on success.

        Raises:
            HTTPException 404: If the election does not exist or is not in tenant.
            HTTPException 400: If the election is not in ``draft`` status.
        """
        repo = ElectionRepository(db)
        election = self.get_by_id(db, election_id, tenant_id=tenant_id)

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

    def activate_election(
        self,
        db: Session,
        election_id: int,
        tenant_id: Optional[int] = None,
    ) -> Election:
        """
        Transition a draft election to ``active``.

        Args:
            db:          Active database session.
            election_id: Primary key of the election to activate.
            tenant_id:   When supplied, verify tenant ownership first.

        Returns:
            The updated ``Election`` instance.

        Raises:
            HTTPException 404: If the election does not exist or is not in tenant.
            HTTPException 400: If the election is not in ``draft`` status or has no candidates.
        """
        repo = ElectionRepository(db)
        election = self.get_by_id(db, election_id, tenant_id=tenant_id)

        if election.status != ElectionStatus.draft:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(
                    f"Only draft elections can be activated. "
                    f"Current status: '{election.status.value}'."
                ),
            )

        candidate_count = len(election.candidates) if election.candidates else 0
        if candidate_count == 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Election must have at least one candidate before it can be activated.",
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

        Args:
            db:          Active database session.
            election_id: Primary key of the election to close.
            tenant_id:   When supplied, verify tenant ownership first.

        Returns:
            The updated ``Election`` instance.

        Raises:
            HTTPException 404: If the election does not exist or is not in tenant.
            HTTPException 400: If the election is not in ``active`` status.
        """
        repo = ElectionRepository(db)
        election = self.get_by_id(db, election_id, tenant_id=tenant_id)

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

    def get_stats(
        self,
        db: Session,
        tenant_id: Optional[int] = None,
    ) -> dict[str, Any]:
        """
        Return aggregate election statistics, optionally scoped to a tenant.

        Superadmin callers pass ``None`` to receive platform-wide totals.

        Args:
            db:        Active database session.
            tenant_id: When supplied, restrict counts to this tenant.

        Returns:
            A dictionary with keys:
            ``total``, ``draft``, ``active``, ``closed``, ``cancelled``.
        """
        base_query = db.query(Election)
        if tenant_id is not None:
            base_query = base_query.filter(Election.tenant_id == tenant_id)

        total: int = base_query.count()
        draft_count: int = (
            base_query.filter(Election.status == ElectionStatus.draft).count()
        )
        active_count: int = (
            base_query.filter(Election.status == ElectionStatus.active).count()
        )
        closed_count: int = (
            base_query.filter(Election.status == ElectionStatus.closed).count()
        )
        cancelled_count: int = (
            base_query.filter(Election.status == ElectionStatus.cancelled).count()
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
