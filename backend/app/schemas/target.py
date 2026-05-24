from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, ConfigDict, Field

from app.models.target import TargetType


# ---------------------------------------------------------------------------
# Base
# ---------------------------------------------------------------------------

class TargetBase(BaseModel):
    """Fields shared across create / update / response schemas for targets."""

    name: str = Field(
        ...,
        min_length=2,
        max_length=150,
        examples=["Maharashtra"],
    )
    type: TargetType = Field(
        default=TargetType.district,
        examples=[TargetType.state],
    )
    parent_id: Optional[int] = Field(
        default=None,
        examples=[1],
    )

    model_config = ConfigDict(from_attributes=True)


# ---------------------------------------------------------------------------
# Create
# ---------------------------------------------------------------------------

class TargetCreate(TargetBase):
    """Payload for defining a new geographical/administrative target."""
    pass


# ---------------------------------------------------------------------------
# Update
# ---------------------------------------------------------------------------

class TargetUpdate(BaseModel):
    """Payload for updating an existing target (all fields optional)."""

    name: Optional[str] = Field(default=None, min_length=2, max_length=150)
    type: Optional[TargetType] = None
    parent_id: Optional[int] = None

    model_config = ConfigDict(from_attributes=True)


# ---------------------------------------------------------------------------
# Response
# ---------------------------------------------------------------------------

class TargetResponse(TargetBase):
    """Full record for a target returned by the API."""

    id: int
    tenant_id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class TargetListResponse(BaseModel):
    """Paginated list of targets."""

    total: int
    items: List[TargetResponse]

    model_config = ConfigDict(from_attributes=True)
