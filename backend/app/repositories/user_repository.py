"""
User repository.

Single Responsibility: All database queries that concern the ``User`` model
live here and nowhere else.  Service classes depend on this repository,
not on raw SQLAlchemy queries (Dependency Inversion Principle).
"""

from datetime import datetime
from typing import Optional

from sqlalchemy.orm import Session

from app.models.user import User, UserRole, UserStatus
from app.repositories.base import BaseRepository


class UserRepository(BaseRepository[User]):
    """Concrete repository for the ``User`` model."""

    model = User

    def __init__(self, db: Session) -> None:
        super().__init__(db)

    # ------------------------------------------------------------------
    # Lookup helpers
    # ------------------------------------------------------------------

    def get_by_email(self, email: str) -> Optional[User]:
        """
        Fetch a user by their unique e-mail address.

        Args:
            email: E-mail address to search for (case-insensitive look-up
                   relies on the database collation).

        Returns:
            The matching ``User`` instance, or ``None``.
        """
        return (
            self.db.query(User)
            .filter(User.email == email)
            .first()
        )

    def get_by_role(
        self,
        role: UserRole,
        skip: int = 0,
        limit: int = 100,
    ) -> list[User]:
        """
        Return a paginated list of users that have the given *role*.

        Args:
            role:  The ``UserRole`` enum value to filter by.
            skip:  Offset (for pagination).
            limit: Maximum number of results.

        Returns:
            A list of ``User`` instances.
        """
        return (
            self.db.query(User)
            .filter(User.role == role)
            .offset(skip)
            .limit(limit)
            .all()
        )

    def get_pending_users(self) -> list[User]:
        """
        Return all users whose registration is awaiting admin approval.

        Returns:
            A list of ``User`` instances with ``status == PENDING``.
        """
        return (
            self.db.query(User)
            .filter(User.status == UserStatus.pending)
            .all()
        )

    # ------------------------------------------------------------------
    # Status / OTP mutations
    # ------------------------------------------------------------------

    def update_status(self, user_id: int, status: UserStatus) -> Optional[User]:
        """
        Change the account status of a user.

        Args:
            user_id: Primary key of the target user.
            status:  New ``UserStatus`` value.

        Returns:
            The updated ``User`` instance, or ``None`` if not found.
        """
        user = self.get_by_id(user_id)
        if user is None:
            return None
        user.status = status
        self.db.commit()
        self.db.refresh(user)
        return user

    def update_otp(
        self,
        user_id: int,
        otp_code: str,
        expires_at: datetime,
    ) -> Optional[User]:
        """
        Store a freshly-generated OTP and its expiry timestamp on the user.

        Args:
            user_id:    Primary key of the target user.
            otp_code:   The plaintext OTP string to persist.
            expires_at: UTC datetime when the OTP should no longer be valid.

        Returns:
            The updated ``User`` instance, or ``None`` if not found.
        """
        user = self.get_by_id(user_id)
        if user is None:
            return None
        user.otp_code = otp_code
        user.otp_expires_at = expires_at
        self.db.commit()
        self.db.refresh(user)
        return user
