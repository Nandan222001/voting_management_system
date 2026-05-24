from sqlalchemy.orm import Session

from app.models.target import Target
from app.repositories.base import BaseRepository


class TargetRepository(BaseRepository[Target]):
    """Concrete repository for the ``Target`` model."""

    model = Target

    def __init__(self, db: Session) -> None:
        super().__init__(db)

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
