"""
Tenant repository.

Single Responsibility: All database queries that concern the ``Tenant`` model
live here.  Service classes depend on this repository, not on raw SQLAlchemy
queries (Dependency Inversion Principle).
"""

from typing import Optional

from sqlalchemy.orm import Session

from app.models.tenant import Tenant, TenantStatus
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
        Fetch a tenant by its unique slug.

        Args:
            slug: URL-safe identifier for the tenant.

        Returns:
            The matching ``Tenant`` instance, or ``None``.
        """
        return self.db.query(Tenant).filter(Tenant.slug == slug).first()

    # ------------------------------------------------------------------
    # Status mutation
    # ------------------------------------------------------------------

    def update_status(self, tenant_id: int, new_status: TenantStatus) -> Optional[Tenant]:
        """
        Change the lifecycle status of a tenant.

        Args:
            tenant_id:  Primary key of the target tenant.
            new_status: The ``TenantStatus`` value to set.

        Returns:
            The updated ``Tenant`` instance, or ``None`` if not found.
        """
        tenant = self.get_by_id(tenant_id)
        if tenant is None:
            return None
        tenant.status = new_status
        self.db.commit()
        self.db.refresh(tenant)
        return tenant
