from sqlalchemy.orm import Session

from app.models.candidate_committee import CandidateCommittee
from app.repositories.base import BaseRepository


class CandidateCommitteeRepository(BaseRepository[CandidateCommittee]):
    """Concrete repository for the ``CandidateCommittee`` model."""

    model = CandidateCommittee

    def __init__(self, db: Session) -> None:
        super().__init__(db)

    def get_by_tenant(self, tenant_id: int) -> list[CandidateCommittee]:
        """
        Return all candidate committees defined for a specific tenant.

        Args:
            tenant_id: Primary key of the tenant.

        Returns:
            A list of ``CandidateCommittee`` instances.
        """
        return (
            self.db.query(CandidateCommittee)
            .filter(CandidateCommittee.tenant_id == tenant_id)
            .all()
        )

