from typing import List, Optional, Tuple
from sqlalchemy.orm import Session

from app.models.plan import Plan
from app.repositories.base import BaseRepository


class PlanRepository(BaseRepository[Plan]):
    """Concrete repository for the ``Plan`` model."""

    model = Plan

    def __init__(self, db: Session) -> None:
        super().__init__(db)

    def get_by_tenant(
        self, 
        tenant_id: int, 
        skip: int = 0, 
        limit: int = 100,
        active_only: bool = False
    ) -> Tuple[List[Plan], int]:
        """
        Fetch a list of plans for a tenant.
        """
        query = self.db.query(Plan).filter(Plan.tenant_id == tenant_id)
        
        if active_only:
            query = query.filter(Plan.is_active == True)
            
        total = query.count()
        items = query.order_by(Plan.price.asc()).offset(skip).limit(limit).all()
        
        return items, total
