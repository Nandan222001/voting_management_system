"""
User management service.

Single Responsibility: Handles all business logic related to user accounts —
retrieval, profile updates, password changes, admin approval/blocking, and
dashboard statistics.

Open/Closed Principle: New behaviours (e.g. email notifications on approval)
can be layered in without modifying existing methods.

Dependency Inversion: Depends on ``UserRepository`` (abstraction), not on
raw SQLAlchemy.
"""

from typing import Any, Optional

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.user import User, UserRole, UserStatus
from app.repositories.user_repository import UserRepository
from app.schemas.user import UserSettingsUpdate, UserUpdate
from app.utils.security import hash_password, verify_password


class UserService:
    """
    Orchestrates user-management use-cases for the Digital Voting System.
    """

    # ------------------------------------------------------------------
    # Read operations
    # ------------------------------------------------------------------

    def get_all_users(
        self,
        db: Session,
        skip: int = 0,
        limit: int = 20,
        role: Optional[UserRole] = None,
        status_filter: Optional[UserStatus] = None,
        tenant_id: Optional[int] = None,
        designation: Optional[str] = None,
        district: Optional[str] = None,
    ) -> tuple[list[User], int]:
        """
        Return a paginated list of users, optionally filtered by role, status,
        and tenant.

        Args:
            db:            Active database session.
            skip:          Row offset.
            limit:         Maximum rows to return.
            role:          When supplied, restrict to users with this role.
            status_filter: When supplied, restrict to users with this status.
            tenant_id:     When supplied, restrict to users belonging to that
                           tenant.  Pass ``None`` (superadmin) to see all users
                           across every tenant.

        Returns:
            A ``(users, total)`` tuple.
        """
        repo = UserRepository(db)
        query = db.query(User)

        # Scope to tenant when the caller is not a superadmin.
        if tenant_id is not None:
            query = query.filter(User.tenant_id == tenant_id)

        if role is not None:
            query = query.filter(User.role == role)
        if status_filter is not None:
            query = query.filter(User.status == status_filter)
        if designation:
            query = query.filter(User.designation == designation)
        if district:
            query = query.filter(User.district == district)

        total: int = query.count()
        users: list[User] = query.offset(skip).limit(limit).all()
        return users, total

    def get_user_by_id(
        self,
        db: Session,
        user_id: int,
        tenant_id: Optional[int] = None,
    ) -> User:
        """
        Fetch a single user by primary key, optionally scoped to a tenant.

        Args:
            db:        Active database session.
            user_id:   Primary key to look up.
            tenant_id: When supplied, verify the user belongs to this tenant.
                       Pass ``None`` (superadmin) to skip the ownership check.

        Returns:
            The matching ``User`` instance.

        Raises:
            HTTPException 404: If no user with that id exists, or the user does
                               not belong to the specified tenant.
        """
        repo = UserRepository(db)
        user: Optional[User] = repo.get_by_id(user_id)
        if user is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"User with id={user_id} not found.",
            )
        if tenant_id is not None and user.tenant_id != tenant_id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"User with id={user_id} not found.",
            )
        return user

    # ------------------------------------------------------------------
    # Write operations
    # ------------------------------------------------------------------

    def update_user(
        self, db: Session, user_id: int, data: UserUpdate
    ) -> User:
        """
        Apply a partial update to a user's profile.

        Args:
            db:      Active database session.
            user_id: Primary key of the user to update.
            data:    Pydantic schema with only the fields that should change.

        Returns:
            The updated ``User`` instance.

        Raises:
            HTTPException 404: If the user does not exist.
        """
        repo = UserRepository(db)
        user = self.get_user_by_id(db, user_id)
        return repo.update(user, data)

    def update_own_settings(
        self, db: Session, user_id: int, data: UserSettingsUpdate
    ) -> User:
        """
        Apply self-service settings updates for the signed-in user.

        Role, status, tenant, verification state, and email are intentionally
        excluded from the settings schema so users cannot elevate privileges
        or move themselves between tenants.
        """
        repo = UserRepository(db)
        user = self.get_user_by_id(db, user_id)
        return repo.update(user, data)

    def change_password(
        self,
        db: Session,
        user_id: int,
        old_password: str,
        new_password: str,
    ) -> User:
        """
        Change the password for the given user after verifying the current one.

        Args:
            db:           Active database session.
            user_id:      Primary key of the user.
            old_password: The user's current plain-text password.
            new_password: The desired new plain-text password.

        Returns:
            The updated ``User`` instance.

        Raises:
            HTTPException 400: If the current password is incorrect.
            HTTPException 404: If the user does not exist.
        """
        user = self.get_user_by_id(db, user_id)

        if not verify_password(old_password, user.hashed_password):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Current password is incorrect.",
            )

        user.hashed_password = hash_password(new_password)
        db.commit()
        db.refresh(user)
        return user

    def approve_user(
        self,
        db: Session,
        user_id: int,
        tenant_id: Optional[int] = None,
    ) -> User:
        """
        Approve a pending user, setting their status to ``active``.

        Args:
            db:        Active database session.
            user_id:   Primary key of the user to approve.
            tenant_id: When supplied, verify the user belongs to this tenant.

        Returns:
            The updated ``User`` instance.

        Raises:
            HTTPException 404: If the user does not exist or is not in tenant.
            HTTPException 400: If the user is not in ``pending`` status.
        """
        repo = UserRepository(db)
        user = self.get_user_by_id(db, user_id, tenant_id=tenant_id)

        if user.status != UserStatus.pending:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"User status is '{user.status.value}', not 'pending'.",
            )

        updated = repo.update_status(user_id, UserStatus.active)
        if updated is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"User with id={user_id} not found.",
            )
        return updated

    def block_user(
        self,
        db: Session,
        user_id: int,
        tenant_id: Optional[int] = None,
    ) -> User:
        """
        Block an active user, preventing further logins.

        Args:
            db:        Active database session.
            user_id:   Primary key of the user to block.
            tenant_id: When supplied, verify the user belongs to this tenant.

        Returns:
            The updated ``User`` instance.

        Raises:
            HTTPException 404: If the user does not exist or is not in tenant.
            HTTPException 400: If the user is already blocked.
        """
        repo = UserRepository(db)
        user = self.get_user_by_id(db, user_id, tenant_id=tenant_id)

        if user.status == UserStatus.blocked:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User is already blocked.",
            )

        updated = repo.update_status(user_id, UserStatus.blocked)
        if updated is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"User with id={user_id} not found.",
            )
        return updated

    def delete_user(
        self,
        db: Session,
        user_id: int,
        tenant_id: Optional[int] = None,
    ) -> bool:
        """
        Permanently delete a user record.

        Args:
            db:        Active database session.
            user_id:   Primary key of the user to delete.
            tenant_id: When supplied, verify the user belongs to this tenant.

        Returns:
            ``True`` on success.

        Raises:
            HTTPException 404: If the user does not exist or is not in tenant.
        """
        # Validate tenant ownership before deletion.
        self.get_user_by_id(db, user_id, tenant_id=tenant_id)

        repo = UserRepository(db)
        deleted = repo.delete(user_id)
        if not deleted:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"User with id={user_id} not found.",
            )
        return True

    # ------------------------------------------------------------------
    # Dashboard statistics
    # ------------------------------------------------------------------

    def get_dashboard_stats(
        self,
        db: Session,
        tenant_id: Optional[int] = None,
    ) -> dict[str, Any]:
        """
        Return aggregate user statistics for the admin dashboard.

        Counts are scoped to the given tenant when *tenant_id* is provided.
        Superadmin callers pass ``None`` to see platform-wide totals.

        Args:
            db:        Active database session.
            tenant_id: When supplied, restrict counts to this tenant.

        Returns:
            A dictionary with keys:
            ``total_users``, ``total_voters``, ``total_admins``,
            ``pending_count``, ``active_count``, ``blocked_count``.
        """
        base_query = db.query(User)
        if tenant_id is not None:
            base_query = base_query.filter(User.tenant_id == tenant_id)

        total_users: int = base_query.count()
        total_voters: int = (
            base_query.filter(User.role == UserRole.voter).count()
        )
        total_admins: int = (
            base_query.filter(User.role == UserRole.admin).count()
        )
        pending_count: int = (
            base_query.filter(User.status == UserStatus.pending).count()
        )
        active_count: int = (
            base_query.filter(User.status == UserStatus.active).count()
        )
        blocked_count: int = (
            base_query.filter(User.status == UserStatus.blocked).count()
        )

        return {
            "total_users": total_users,
            "total_voters": total_voters,
            "total_admins": total_admins,
            "pending_count": pending_count,
            "active_count": active_count,
            "blocked_count": blocked_count,
        }


# ---------------------------------------------------------------------------
# Module-level singleton
# ---------------------------------------------------------------------------
user_service = UserService()
