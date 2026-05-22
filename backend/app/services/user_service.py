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
from app.schemas.user import UserUpdate
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
    ) -> tuple[list[User], int]:
        """
        Return a paginated list of users, optionally filtered by role and/or
        status.

        Args:
            db:            Active database session.
            skip:          Row offset.
            limit:         Maximum rows to return.
            role:          When supplied, restrict to users with this role.
            status_filter: When supplied, restrict to users with this status.

        Returns:
            A ``(users, total)`` tuple.
        """
        repo = UserRepository(db)
        query = db.query(User)

        if role is not None:
            query = query.filter(User.role == role)
        if status_filter is not None:
            query = query.filter(User.status == status_filter)

        total: int = query.count()
        users: list[User] = query.offset(skip).limit(limit).all()
        return users, total

    def get_user_by_id(self, db: Session, user_id: int) -> User:
        """
        Fetch a single user by primary key.

        Args:
            db:      Active database session.
            user_id: Primary key to look up.

        Returns:
            The matching ``User`` instance.

        Raises:
            HTTPException 404: If no user with that id exists.
        """
        repo = UserRepository(db)
        user: Optional[User] = repo.get_by_id(user_id)
        if user is None:
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

    def approve_user(self, db: Session, user_id: int) -> User:
        """
        Approve a pending user, setting their status to ``active``.

        Args:
            db:      Active database session.
            user_id: Primary key of the user to approve.

        Returns:
            The updated ``User`` instance.

        Raises:
            HTTPException 404: If the user does not exist.
            HTTPException 400: If the user is not in ``pending`` status.
        """
        repo = UserRepository(db)
        user = self.get_user_by_id(db, user_id)

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

    def block_user(self, db: Session, user_id: int) -> User:
        """
        Block an active user, preventing further logins.

        Args:
            db:      Active database session.
            user_id: Primary key of the user to block.

        Returns:
            The updated ``User`` instance.

        Raises:
            HTTPException 404: If the user does not exist.
            HTTPException 400: If the user is already blocked.
        """
        repo = UserRepository(db)
        user = self.get_user_by_id(db, user_id)

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

    def delete_user(self, db: Session, user_id: int) -> bool:
        """
        Permanently delete a user record.

        Args:
            db:      Active database session.
            user_id: Primary key of the user to delete.

        Returns:
            ``True`` on success.

        Raises:
            HTTPException 404: If the user does not exist.
        """
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

    def get_dashboard_stats(self, db: Session) -> dict[str, Any]:
        """
        Return aggregate user statistics for the admin dashboard.

        Counts are computed from the database rather than cached, ensuring
        they always reflect the current state.

        Args:
            db: Active database session.

        Returns:
            A dictionary with keys:
            ``total_users``, ``total_voters``, ``total_admins``,
            ``pending_count``, ``active_count``, ``blocked_count``.
        """
        total_users: int = db.query(User).count()
        total_voters: int = db.query(User).filter(User.role == UserRole.voter).count()
        total_admins: int = db.query(User).filter(User.role == UserRole.admin).count()
        pending_count: int = (
            db.query(User).filter(User.status == UserStatus.pending).count()
        )
        active_count: int = (
            db.query(User).filter(User.status == UserStatus.active).count()
        )
        blocked_count: int = (
            db.query(User).filter(User.status == UserStatus.blocked).count()
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
