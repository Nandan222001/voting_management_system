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

    def get_active_elections(
        self,
        tenant_id: Optional[int] = None,
    ) -> list[Election]:
        """
        Return all elections whose status is ``ACTIVE``.

        When *tenant_id* is supplied the results are scoped to that tenant;
        otherwise all active elections across all tenants are returned
        (superadmin cross-tenant view).

        Args:
            tenant_id: Optional tenant scope.

        Returns:
            A list of active ``Election`` instances.
        """
        query = self.db.query(Election).filter(
            Election.status == ElectionStatus.active
        )
        if tenant_id is not None:
            query = query.filter(Election.tenant_id == tenant_id)
        return query.all()

    def get_by_status(
        self,
        status: ElectionStatus,
        tenant_id: Optional[int] = None,
    ) -> list[Election]:
        """
        Return all elections matching the given *status*.

        When *tenant_id* is supplied the results are scoped to that tenant.

        Args:
            status:    The ``ElectionStatus`` to filter by.
            tenant_id: Optional tenant scope.

        Returns:
            A list of matching ``Election`` instances.
        """
        query = self.db.query(Election).filter(Election.status == status)
        if tenant_id is not None:
            query = query.filter(Election.tenant_id == tenant_id)
        return query.all()

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
    # Tenant-scoped helpers
    # ------------------------------------------------------------------

    def get_active_by_tenant(self, tenant_id: int) -> list[Election]:
        """
        Return all active elections belonging to *tenant_id*.

        Args:
            tenant_id: The tenant scope to restrict the query to.

        Returns:
            A list of active ``Election`` instances for that tenant.
        """
        return (
            self.db.query(Election)
            .filter(
                Election.tenant_id == tenant_id,
                Election.status == ElectionStatus.active,
            )
            .all()
        )

    def count_by_tenant(self, tenant_id: int) -> int:
        """
        Count all elections belonging to *tenant_id*.

        Args:
            tenant_id: The tenant scope to count within.

        Returns:
            Row count as an integer.
        """
        return (
            self.db.query(Election)
            .filter(Election.tenant_id == tenant_id)
            .count()
        )

    def count_active_by_tenant(self, tenant_id: int) -> int:
        """
        Count active elections belonging to *tenant_id*.

        Args:
            tenant_id: The tenant scope to count within.

        Returns:
            Row count as an integer.
        """
        return (
            self.db.query(Election)
            .filter(
                Election.tenant_id == tenant_id,
                Election.status == ElectionStatus.active,
            )
            .count()
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
