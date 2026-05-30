from typing import List, Optional, Tuple
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.plan import Plan
from app.repositories.plan_repository import PlanRepository
from app.schemas.plan import PlanCreate, PlanUpdate


class PlanService:
    """
    Handles business logic for managing dynamic voter subscription plans.
    """

    def get_plans(
        self, db: Session, tenant_id: int, active_only: bool = False
    ) -> Tuple[List[Plan], int]:
        """
        Retrieve all plans for a tenant.
        """
        repo = PlanRepository(db)
        return repo.get_by_tenant(tenant_id, active_only=active_only)

    def get_plan(self, db: Session, plan_id: int) -> Plan:
        """
        Retrieve a single plan by ID.
        """
        repo = PlanRepository(db)
        plan = repo.get_by_id(plan_id)
        if not plan:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Plan not found",
            )
        return plan

    def create_plan(self, db: Session, tenant_id: int, data: PlanCreate) -> Plan:
        """
        Create a new plan for a tenant.
        """
        repo = PlanRepository(db)
        plan_data = data.model_dump()
        plan_data["tenant_id"] = tenant_id
        return repo.create(plan_data)

    def update_plan(self, db: Session, plan_id: int, tenant_id: int, data: PlanUpdate) -> Plan:
        """
        Update an existing plan.
        """
        repo = PlanRepository(db)
        plan = repo.get_by_id(plan_id)
        if not plan or plan.tenant_id != tenant_id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Plan not found or access denied",
            )
        return repo.update(plan, data)

    def delete_plan(self, db: Session, plan_id: int, tenant_id: int) -> bool:
        """
        Remove a plan.
        """
        repo = PlanRepository(db)
        plan = repo.get_by_id(plan_id)
        if not plan or plan.tenant_id != tenant_id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Plan not found or access denied",
            )
        repo.delete(plan_id)
        return True


# ---------------------------------------------------------------------------
# Module-level singleton
# ---------------------------------------------------------------------------
plan_service = PlanService()
