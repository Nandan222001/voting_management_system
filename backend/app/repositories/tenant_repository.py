"""
Tenant repository.

Single Responsibility: All database queries that concern the ``Tenant`` model
live here.  Service classes depend on this repository, not on raw SQLAlchemy
queries (Dependency Inversion Principle).
"""

from typing import Optional

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.election import Election, ElectionStatus
from app.models.tenant import Tenant, TenantStatus
from app.models.user import User
from app.models.vote import Vote
from app.repositories.base import BaseRepository


class TenantRepository(BaseRepository[Tenant]):
    """Concrete repository for the ``Tenant`` model."""

    model = Tenant

    def __init__(self, db: Session) -> None:
        super().__init__(db)

    # ------------------------------------------------------------------
    # Lookup helpers
    # ------------------------------------------------------------------

    def get_by_slug(self, slug: str) -> Optional[Tenant]:
        """
        Fetch a tenant by its unique URL slug.

        Args:
            slug: The slug identifier to search for.

        Returns:
            The matching ``Tenant`` instance, or ``None``.
        """
        return (
            self.db.query(Tenant)
            .filter(Tenant.slug == slug)
            .first()
        )

    def get_by_status(
        self,
        status: str,
        skip: int = 0,
        limit: int = 100,
    ) -> list[Tenant]:
        """
        Return a paginated list of tenants with the given lifecycle *status*.

        Args:
            status: The ``TenantStatus`` string value to filter by.
            skip:   Offset (for pagination).
            limit:  Maximum number of results.

        Returns:
            A list of ``Tenant`` instances.
        """
        return (
            self.db.query(Tenant)
            .filter(Tenant.status == status)
            .offset(skip)
            .limit(limit)
            .all()
        )

    def get_all_with_counts(
        self,
        skip: int = 0,
        limit: int = 100,
    ) -> list[dict]:
        """
        Return tenants enriched with ``user_count`` and ``election_count``
        aggregates, computed via correlated sub-queries.

        Args:
            skip:  Offset (for pagination).
            limit: Maximum number of results.

        Returns:
            A list of dicts, each containing:
            ``tenant`` (ORM instance), ``user_count`` (int),
            ``election_count`` (int).
        """
        user_count_sq = (
            self.db.query(func.count(User.id))
            .filter(User.tenant_id == Tenant.id)
            .correlate(Tenant)
            .scalar_subquery()
        )
        election_count_sq = (
            self.db.query(func.count(Election.id))
            .filter(Election.tenant_id == Tenant.id)
            .correlate(Tenant)
            .scalar_subquery()
        )

        rows = (
            self.db.query(
                Tenant,
                user_count_sq.label("user_count"),
                election_count_sq.label("election_count"),
            )
            .offset(skip)
            .limit(limit)
            .all()
        )

        result = []
        for tenant, user_count, election_count in rows:
            result.append(
                {
                    "tenant": tenant,
                    "user_count": user_count or 0,
                    "election_count": election_count or 0,
                }
            )
        return result

    # ------------------------------------------------------------------
    # Status mutation
    # ------------------------------------------------------------------

    def update_status(self, tenant_id: int, status: str) -> Optional[Tenant]:
        """
        Change the lifecycle status of a tenant.

        Args:
            tenant_id: Primary key of the target tenant.
            status:    New status string (maps to ``TenantStatus`` enum values).

        Returns:
            The updated ``Tenant`` instance, or ``None`` if not found.
        """
        tenant = self.get_by_id(tenant_id)
        if tenant is None:
            return None
        tenant.status = status
        self.db.commit()
        self.db.refresh(tenant)
        return tenant

    # ------------------------------------------------------------------
    # Usage statistics
    # ------------------------------------------------------------------

    def get_usage_stats(self, tenant_id: int) -> dict:
        """
        Return aggregated usage statistics for a single tenant.

        Args:
            tenant_id: Primary key of the tenant to summarise.

        Returns:
            A dict with keys:
            ``user_count``, ``election_count``, ``vote_count``,
            ``active_elections``.
        """
        user_count: int = (
            self.db.query(func.count(User.id))
            .filter(User.tenant_id == tenant_id)
            .scalar()
            or 0
        )
        election_count: int = (
            self.db.query(func.count(Election.id))
            .filter(Election.tenant_id == tenant_id)
            .scalar()
            or 0
        )
        vote_count: int = (
            self.db.query(func.count(Vote.id))
            .filter(Vote.tenant_id == tenant_id)
            .scalar()
            or 0
        )
        active_elections: int = (
            self.db.query(func.count(Election.id))
            .filter(
                Election.tenant_id == tenant_id,
                Election.status == ElectionStatus.active,
            )
            .scalar()
            or 0
        )

        return {
            "user_count": user_count,
            "election_count": election_count,
            "vote_count": vote_count,
            "active_elections": active_elections,
        }
