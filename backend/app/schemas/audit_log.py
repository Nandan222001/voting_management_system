from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, ConfigDict, Field


# ---------------------------------------------------------------------------
# Response schema
# ---------------------------------------------------------------------------

class AuditLogResponse(BaseModel):
    """
    Read-only representation of an audit log entry.

    Audit logs are immutable – there are no create / update schemas exposed
    via the API.  Only admins should be able to list / retrieve these records.
    """

    id: int

    # The user who triggered the action; None for system-generated events
    user_id: Optional[int] = None

    # A short, machine-readable label for the action
    # e.g. "user.login", "vote.cast", "election.status_changed"
    action: str = Field(..., examples=["vote.cast"])

    # The type of resource that was affected
    entity_type: Optional[str] = Field(default=None, examples=["election"])

    # The primary key of the affected resource
    entity_id: Optional[int] = Field(default=None, examples=[7])

    # Free-form JSON / text payload with extra context
    details: Optional[str] = Field(
        default=None,
        examples=['{"old_status": "draft", "new_status": "active"}'],
    )

    # IP address of the client that triggered the action
    ip_address: Optional[str] = Field(default=None, examples=["192.168.1.100"])

    # When the event was recorded (immutable)
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class AuditLogListResponse(BaseModel):
    """Paginated list of audit log entries."""

    total: int
    page: int
    page_size: int
    items: List[AuditLogResponse]

    model_config = ConfigDict(from_attributes=True)
