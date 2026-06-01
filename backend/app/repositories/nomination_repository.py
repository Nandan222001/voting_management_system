from typing import Optional

from sqlalchemy.orm import Session

from app.models.nomination import Nomination, NominationStatus
from app.repositories.base import BaseRepository


class NominationRepository(BaseRepository[Nomination]):
    """Persistence helpers for voter nomination applications."""

    model = Nomination

    def __init__(self, db: Session) -> None:
        super().__init__(db)

    def get_by_election_and_user(
        self,
        election_id: int,
        user_id: int,
    ) -> Optional[Nomination]:
        return (
            self.db.query(Nomination)
            .filter(
                Nomination.election_id == election_id,
                Nomination.user_id == user_id,
            )
            .first()
        )

    def list_filtered(
        self,
        skip: int = 0,
        limit: int = 20,
        tenant_id: Optional[int] = None,
        election_id: Optional[int] = None,
        user_id: Optional[int] = None,
        status_filter: Optional[NominationStatus] = None,
    ) -> list[Nomination]:
        query = self.db.query(Nomination)
        query = self._apply_filters(
            query,
            tenant_id=tenant_id,
            election_id=election_id,
            user_id=user_id,
            status_filter=status_filter,
        )
        return (
            query.order_by(Nomination.created_at.desc(), Nomination.id.desc())
            .offset(skip)
            .limit(limit)
            .all()
        )

    def count_filtered(
        self,
        tenant_id: Optional[int] = None,
        election_id: Optional[int] = None,
        user_id: Optional[int] = None,
        status_filter: Optional[NominationStatus] = None,
    ) -> int:
        query = self.db.query(Nomination)
        query = self._apply_filters(
            query,
            tenant_id=tenant_id,
            election_id=election_id,
            user_id=user_id,
            status_filter=status_filter,
        )
        return query.count()

    def _apply_filters(
        self,
        query,
        tenant_id: Optional[int] = None,
        election_id: Optional[int] = None,
        user_id: Optional[int] = None,
        status_filter: Optional[NominationStatus] = None,
    ):
        if tenant_id is not None:
            query = query.filter(Nomination.tenant_id == tenant_id)
        if election_id is not None:
            query = query.filter(Nomination.election_id == election_id)
        if user_id is not None:
            query = query.filter(Nomination.user_id == user_id)
        if status_filter is not None:
            query = query.filter(Nomination.status == status_filter)
        return query
