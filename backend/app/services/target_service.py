from typing import Optional

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.target import Target
from app.repositories.target_repository import TargetRepository
from app.schemas.target import TargetCreate, TargetUpdate


class TargetService:
    """
    Handles business logic for geographical/administrative targets 
    (States, Districts, etc.).
    """

    def create_target(
        self, db: Session, data: TargetCreate, tenant_id: int
    ) -> Target:
        """
        Define a new target for a tenant.
        """
        repo = TargetRepository(db)
        
        # Optional: Validate parent_id belongs to same tenant
        if data.parent_id:
            parent = repo.get_by_id(data.parent_id)
            if not parent or parent.tenant_id != tenant_id:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Parent target not found or unauthorized.",
                )

        target_data = data.model_dump()
        target_data["tenant_id"] = tenant_id
        return repo.create(target_data)

    def get_targets_by_tenant(self, db: Session, tenant_id: int) -> list[Target]:
        """
        Fetch all targets available for a tenant.
        """
        repo = TargetRepository(db)
        return repo.get_by_tenant(tenant_id)

    def get_target_by_id(self, db: Session, target_id: int) -> Target:
        """
        Fetch a single target by ID.
        """
        repo = TargetRepository(db)
        target = repo.get_by_id(target_id)
        if not target:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Target with id={target_id} not found.",
            )
        return target

    def update_target(
        self, db: Session, target_id: int, data: TargetUpdate, tenant_id: int
    ) -> Target:
        """
        Update a target's details. Ensures the target belongs to the tenant.
        """
        target = self.get_target_by_id(db, target_id)
        if target.tenant_id != tenant_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to update this target.",
            )
        
        # Optional: Validate parent_id belongs to same tenant
        if data.parent_id:
            repo = TargetRepository(db)
            parent = repo.get_by_id(data.parent_id)
            if not parent or parent.tenant_id != tenant_id:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Parent target not found or unauthorized.",
                )
        
        repo = TargetRepository(db)
        return repo.update(target, data)

    def delete_target(self, db: Session, target_id: int, tenant_id: int) -> bool:
        """
        Permanently delete a target. Ensures the target belongs to the tenant.
        """
        target = self.get_target_by_id(db, target_id)
        if target.tenant_id != tenant_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to delete this target.",
            )
        
        # Check if target has children
        repo = TargetRepository(db)
        children = db.query(Target).filter(Target.parent_id == target_id).first()
        if children:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot delete a target that has sub-targets (districts/wards).",
            )

        return repo.delete(target_id)


target_service = TargetService()
