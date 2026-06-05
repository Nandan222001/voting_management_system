from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, ConfigDict, Field


# ---------------------------------------------------------------------------
# Base
# ---------------------------------------------------------------------------

class CandidateCommitteeBase(BaseModel):
    """Fields shared across create / update / response schemas for candidate committees."""

    name: str = Field(
        ...,
        min_length=2,
        max_length=100,
        examples=["Executive Committee"],
    )
    description: Optional[str] = Field(
        default=None,
        examples=["The main governing body."],
    )

    model_config = ConfigDict(from_attributes=True)


# ---------------------------------------------------------------------------
# Create
# ---------------------------------------------------------------------------

class CandidateCommitteeCreate(CandidateCommitteeBase):
    """Payload for creating a new candidate committee."""
    pass


# ---------------------------------------------------------------------------
# Update
# ---------------------------------------------------------------------------

class CandidateCommitteeUpdate(BaseModel):
    """Payload for updating an existing candidate committee (all fields optional)."""

    name: Optional[str] = Field(default=None, min_length=2, max_length=100)
    description: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


# ---------------------------------------------------------------------------
# Response
# ---------------------------------------------------------------------------

class CandidateCommitteeResponse(CandidateCommitteeBase):
    """Full record for a candidate committee returned by the API."""

    id: int
    tenant_id: int
    candidate_count: int = 0
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class CandidateCommitteeListResponse(BaseModel):
    """Paginated list of candidate committees."""

    total: int
    items: List[CandidateCommitteeResponse]

    model_config = ConfigDict(from_attributes=True)
