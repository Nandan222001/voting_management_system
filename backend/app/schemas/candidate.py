from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, ConfigDict, Field, HttpUrl


# ---------------------------------------------------------------------------
# Base
# ---------------------------------------------------------------------------

class CandidateBase(BaseModel):
    """Fields shared across create / update / response schemas."""

    full_name: str = Field(
        ...,
        min_length=2,
        max_length=150,
        examples=["Alice Johnson"],
    )
    party: Optional[str] = Field(
        default=None,
        max_length=150,
        examples=["Progressive Party"],
    )
    symbol: Optional[str] = Field(
        default=None,
        max_length=100,
        examples=["Rising Sun"],
    )
    image_url: Optional[str] = Field(
        default=None,
        max_length=500,
        examples=["https://cdn.example.com/candidates/alice.jpg"],
    )
    bio: Optional[str] = Field(
        default=None,
        examples=["Experienced community leader with 10 years of public service."],
    )

    model_config = ConfigDict(from_attributes=True)


# ---------------------------------------------------------------------------
# Create
# ---------------------------------------------------------------------------

class CandidateCreate(CandidateBase):
    """Payload for adding a new candidate to an election."""

    election_id: int = Field(..., gt=0, examples=[1])


# ---------------------------------------------------------------------------
# Update
# ---------------------------------------------------------------------------

class CandidateUpdate(BaseModel):
    """All fields optional for partial updates."""

    full_name: Optional[str] = Field(default=None, min_length=2, max_length=150)
    party: Optional[str] = Field(default=None, max_length=150)
    symbol: Optional[str] = Field(default=None, max_length=100)
    image_url: Optional[str] = Field(default=None, max_length=500)
    bio: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


# ---------------------------------------------------------------------------
# Response
# ---------------------------------------------------------------------------

class CandidateResponse(CandidateBase):
    """Full candidate record returned by the API, including vote statistics."""

    id: int
    election_id: int
    vote_count: int = Field(default=0, examples=[42])

    # Percentage of the total votes in the election; populated by the service layer
    vote_percentage: float = Field(default=0.0, examples=[35.5])

    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class CandidateListResponse(BaseModel):
    """Paginated list of candidates."""

    total: int
    page: int
    page_size: int
    items: List[CandidateResponse]

    model_config = ConfigDict(from_attributes=True)
