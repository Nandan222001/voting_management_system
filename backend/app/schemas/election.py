from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, ConfigDict, Field, model_validator

from app.models.election import ElectionStatus
from app.schemas.target import TargetResponse


# ---------------------------------------------------------------------------
# Base
# ---------------------------------------------------------------------------

class ElectionBase(BaseModel):
    """Fields shared across create / update / response schemas."""

    title: str = Field(..., min_length=3, max_length=255, examples=["Student Council 2025"])
    description: Optional[str] = Field(default=None, examples=["Annual student council election."])
    start_date: datetime = Field(..., examples=["2025-09-01T08:00:00"])
    end_date: datetime = Field(..., examples=["2025-09-01T18:00:00"])
    target_district: Optional[str] = Field(
        default=None,
        max_length=100,
        examples=["Maharashtra"],
        description="Optional district scope. If omitted, all tenant members are eligible.",
    )
    target_id: Optional[int] = Field(
        default=None,
        examples=[1],
        description="Link to a structured geographical target.",
    )

    model_config = ConfigDict(from_attributes=True)


# ---------------------------------------------------------------------------
# Create
# ---------------------------------------------------------------------------

class ElectionCreate(ElectionBase):
    """Payload for creating a new election."""

    status: ElectionStatus = Field(default=ElectionStatus.draft)

    @model_validator(mode="after")
    def end_after_start(self) -> "ElectionCreate":
        if self.end_date <= self.start_date:
            raise ValueError("end_date must be after start_date")
        return self


# ---------------------------------------------------------------------------
# Update
# ---------------------------------------------------------------------------

class ElectionUpdate(BaseModel):
    """All fields optional for partial updates."""

    title: Optional[str] = Field(default=None, min_length=3, max_length=255)
    description: Optional[str] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    target_district: Optional[str] = Field(default=None, max_length=100)
    target_id: Optional[int] = None
    status: Optional[ElectionStatus] = None

    model_config = ConfigDict(from_attributes=True)

    @model_validator(mode="after")
    def end_after_start(self) -> "ElectionUpdate":
        if self.start_date and self.end_date:
            if self.end_date <= self.start_date:
                raise ValueError("end_date must be after start_date")
        return self


# ---------------------------------------------------------------------------
# Response
# ---------------------------------------------------------------------------

class ElectionResponse(ElectionBase):
    """Full election record returned by the API, including computed fields."""

    id: int
    status: ElectionStatus
    created_by: Optional[int] = None
    created_at: datetime
    updated_at: datetime

    # Computed / aggregated fields populated by the service layer
    candidate_count: int = Field(default=0, examples=[4])
    total_votes: int = Field(default=0, examples=[120])

    target: Optional[TargetResponse] = None

    model_config = ConfigDict(from_attributes=True)


class ElectionListResponse(BaseModel):
    """Paginated list of elections."""

    total: int
    page: int
    page_size: int
    items: List[ElectionResponse]

    model_config = ConfigDict(from_attributes=True)
