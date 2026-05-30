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
    TargetRepository = TargetRepository

    def create_target(
        self, db: Session, data: TargetCreate, tenant_id: Optional[int] = None
    ) -> Target:
        """
        Define a new target. Can be platform-wide (tenant_id=None) or tenant-specific.
        """
        repo = self.TargetRepository(db)
        
        # Check for duplicate name
        existing = db.query(Target).filter(Target.name == data.name).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"A committee with the name '{data.name}' already exists.",
            )

        # Optional: Validate parent_id
        if data.parent_id:
            parent = repo.get_by_id(data.parent_id)
            if not parent:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Parent target not found.",
                )

        target_data = data.model_dump()
        target_data["tenant_id"] = tenant_id
        return repo.create(target_data)

    def get_targets_by_tenant(self, db: Session, tenant_id: Optional[int]) -> list[Target]:
        """
        Fetch all targets available for a tenant (including global ones).
        """
        # If tenant_id is None (SuperAdmin), return all.
        # If tenant_id is set, return targets for that tenant AND global targets (tenant_id IS NULL)
        query = db.query(Target)
        if tenant_id is not None:
            from sqlalchemy import or_
            query = query.filter(or_(Target.tenant_id == tenant_id, Target.tenant_id.is_(None)))
        
        return query.all()

    def get_target_by_id(self, db: Session, target_id: int) -> Target:
        """
        Fetch a single target by ID.
        """
        target = self.TargetRepository(db).get_by_id(target_id)
        if not target:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Target with id={target_id} not found.",
            )
        return target

    def update_target(
        self, db: Session, target_id: int, data: TargetUpdate
    ) -> Target:
        """
        Update a target's details. (SuperAdmin only)
        """
        target = self.get_target_by_id(db, target_id)
        repo = self.TargetRepository(db)
        
        # Check for duplicate name (if name is being changed)
        if data.name and data.name != target.name:
            existing = db.query(Target).filter(Target.name == data.name).first()
            if existing:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"A committee with the name '{data.name}' already exists.",
                )

        # Optional: Validate parent_id
        if data.parent_id:
            parent = repo.get_by_id(data.parent_id)
            if not parent:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Parent target not found.",
                )
        
        return repo.update(target, data)

    def delete_target(self, db: Session, target_id: int) -> bool:
        """
        Permanently delete a target. (SuperAdmin only)
        """
        self.get_target_by_id(db, target_id)
        
        # Check if target has children
        repo = self.TargetRepository(db)
        children = db.query(Target).filter(Target.parent_id == target_id).first()
        if children:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot delete a target that has sub-targets.",
            )

        return repo.delete(target_id)


target_service = TargetService()
