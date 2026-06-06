from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, ConfigDict, Field


# ---------------------------------------------------------------------------
# Base
# ---------------------------------------------------------------------------

class PlanBase(BaseModel):
    """Fields shared across plan schemas."""

    name: str = Field(..., min_length=1, max_length=100)
    price: float = Field(default=0.0, ge=0)
    currency: str = Field(default="INR", min_length=3, max_length=3)
    period: str = Field(default="month", max_length=20)
    description: Optional[str] = Field(default=None)
    features: Optional[str] = Field(default=None, description="Comma-separated or JSON list of features")
    
    is_active: bool = True
    is_highlighted: bool = False
    
    model_config = ConfigDict(from_attributes=True)


# ---------------------------------------------------------------------------
# Create / Update
# ---------------------------------------------------------------------------

class PlanCreate(PlanBase):
    """Payload for creating a new plan."""
    pass


class PlanUpdate(BaseModel):
    """Payload for updating an existing plan."""

    name: Optional[str] = Field(None, min_length=1, max_length=100)
    price: Optional[float] = Field(None, ge=0)
    currency: Optional[str] = Field(None, min_length=3, max_length=3)
    period: Optional[str] = Field(None, max_length=20)
    description: Optional[str] = None
    features: Optional[str] = None
    is_active: Optional[bool] = None
    is_highlighted: Optional[bool] = None


# ---------------------------------------------------------------------------
# Response
# ---------------------------------------------------------------------------

class PlanResponse(PlanBase):
    """Full representation of a plan."""

    id: int
    tenant_id: int
    created_at: datetime
    updated_at: datetime


class PlanListResponse(BaseModel):
    """List of plans."""

    total: int
    items: List[PlanResponse]

    model_config = ConfigDict(from_attributes=True)
