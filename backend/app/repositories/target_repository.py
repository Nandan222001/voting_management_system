from typing import Optional
from sqlalchemy.orm import Session

from app.models.target import Target
from app.repositories.base import BaseRepository


class TargetRepository(BaseRepository[Target]):
    """Concrete repository for the ``Target`` model."""

    model = Target

    def __init__(self, db: Session) -> None:
        super().__init__(db)

    def get_all(
        self,
        skip: int = 0,
        limit: int = 100,
        parent_id: Optional[int] = None,
    ) -> list[Target]:
        """
        Fetch a paginated slice of all records, optionally filtered by parent_id.
        """
        query = self.db.query(Target)
        if parent_id is not None:
            query = query.filter(Target.parent_id == parent_id)
        return query.offset(skip).limit(limit).all()

    def get_by_tenant(self, tenant_id: int) -> list[Target]:
        """
        Return all targets defined for a specific tenant.

        Args:
            tenant_id: Primary key of the tenant.

        Returns:
            A list of ``Target`` instances.
        """
        return (
            self.db.query(Target)
            .filter(Target.tenant_id == tenant_id)
            .all()
        )
