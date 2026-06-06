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
    president_id: Optional[int] = Field(
        default=None,
        examples=[42],
    )
    winner_id: Optional[int] = Field(
        default=None,
        examples=[43],
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
    president_id: Optional[int] = None
    winner_id: Optional[int] = None

    model_config = ConfigDict(from_attributes=True)


# ---------------------------------------------------------------------------
# Response
# ---------------------------------------------------------------------------

class UserMiniResponse(BaseModel):
    """Simplified user record for leadership assignment (President/Winner)."""
    id: int
    full_name: str
    email: str
    phone: Optional[str] = None
    image: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class TargetResponse(TargetBase):
    """Full record for a target returned by the API."""

    id: int
    tenant_id: Optional[int] = None
    president: Optional[UserMiniResponse] = None
    winner: Optional[UserMiniResponse] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class TargetListResponse(BaseModel):
    """Paginated list of targets."""

    total: int
    items: List[TargetResponse]

    model_config = ConfigDict(from_attributes=True)
