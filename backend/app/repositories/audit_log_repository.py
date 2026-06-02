"""
Audit log repository.

Single Responsibility: All persistence queries for ``AuditLog`` records are
centralised here. The service layer never constructs raw ORM queries for audit
entries directly (Dependency Inversion Principle).
"""

import json
from typing import Any, Optional

from sqlalchemy.orm import Session

from app.models.audit_log import AuditLog
from app.repositories.base import BaseRepository


class AuditLogRepository(BaseRepository[AuditLog]):
    """Concrete repository for the ``AuditLog`` model."""

    model = AuditLog

    def __init__(self, db: Session) -> None:
        super().__init__(db)

    # ------------------------------------------------------------------
    # Write helpers
    # ------------------------------------------------------------------

    def log_action(
        self,
        user_id: Optional[int],
        action: str,
        entity_type: Optional[str] = None,
        entity_id: Optional[int] = None,
        details: Optional[Any] = None,
        ip_address: Optional[str] = None,
        tenant_id: Optional[int] = None,
    ) -> AuditLog:
        """
        Create and persist a new audit log entry.

        Args:
            user_id:     Primary key of the actor; ``None`` for system events.
            action:      Short verb describing what happened (e.g. ``"login"``).
            entity_type: Type of the affected resource (e.g. ``"election"``).
            entity_id:   Primary key of the affected resource.
            details:     Arbitrary context; will be JSON-serialised if not
                         already a string.
            ip_address:  Network address of the client.

        Returns:
            The freshly-created ``AuditLog`` instance.
        """
        # Normalise *details* to a JSON string so the TEXT column always
        # stores well-formed data that can be parsed downstream.
        if details is not None and not isinstance(details, str):
            details = json.dumps(details, default=str)

        log_entry = AuditLog(
            user_id=user_id,
            tenant_id=tenant_id,
            action=action,
            entity_type=entity_type,
            entity_id=entity_id,
            details=details,
            ip_address=ip_address,
        )
        self.db.add(log_entry)
        self.db.commit()
        self.db.refresh(log_entry)
        return log_entry

    # ------------------------------------------------------------------
    # Lookup helpers
    # ------------------------------------------------------------------

    def get_by_user(self, user_id: int) -> list[AuditLog]:
        """
        Return all audit log entries created by *user_id*, ordered by
        creation time descending (newest first).

        Args:
            user_id: Primary key of the user whose history is requested.

        Returns:
            A list of ``AuditLog`` instances.
        """
        return (
            self.db.query(AuditLog)
            .filter(AuditLog.user_id == user_id)
            .order_by(AuditLog.created_at.desc())
            .all()
        )

    def get_by_entity(
        self, entity_type: str, entity_id: int
    ) -> list[AuditLog]:
        """
        Return all audit log entries that reference a specific resource,
        ordered by creation time descending.

        Args:
            entity_type: Type string of the resource (e.g. ``"election"``).
            entity_id:   Primary key of the resource.

        Returns:
            A list of ``AuditLog`` instances.
        """
        return (
            self.db.query(AuditLog)
            .filter(
                AuditLog.entity_type == entity_type,
                AuditLog.entity_id == entity_id,
            )
            .order_by(AuditLog.created_at.desc())
            .all()
        )

    def get_paginated(
        self,
        skip: int = 0,
        limit: int = 50,
        user_id: Optional[int] = None,
        action: Optional[str] = None,
    ) -> tuple[list[AuditLog], int]:
        """
        Return a paginated, optionally-filtered list of audit log entries.

        Args:
            skip:    Row offset for pagination.
            limit:   Maximum rows to return.
            user_id: When supplied, restrict to entries from that user.
            action:  When supplied, restrict to entries with that action.

        Returns:
            A ``(items, total)`` tuple.
        """
        query = self.db.query(AuditLog)

        if user_id is not None:
            query = query.filter(AuditLog.user_id == user_id)
        if action is not None:
            query = query.filter(AuditLog.action == action)

        total: int = query.count()
        items: list[AuditLog] = (
            query.order_by(AuditLog.created_at.desc())
            .offset(skip)
            .limit(limit)
            .all()
        )
        return items, total
