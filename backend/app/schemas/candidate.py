from datetime import datetime
from typing import Any, List, Optional

from pydantic import BaseModel, ConfigDict, Field, HttpUrl, field_validator

from .candidate_committee import CandidateCommitteeResponse
from .target import TargetResponse


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
        examples=["Experienced party member with 10 years of organizational service."],
    )
    committee_id: Optional[int] = Field(
        default=None,
        examples=[1],
    )
    target_id: Optional[int] = Field(
        default=None,
        examples=[1],
    )

    @field_validator("committee_id", "target_id", mode="before")
    @classmethod
    def transform_empty_string_to_none(cls, v: Any) -> Any:
        if v is None:
            return None
        if isinstance(v, str):
            val = v.strip()
            if val == "" or val.lower() == "null" or val.lower() == "undefined":
                return None
            if val.isdigit():
                return int(val)
        return v

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
    committee_id: Optional[int] = Field(default=None)
    target_id: Optional[int] = Field(default=None)

    @field_validator("committee_id", "target_id", mode="before")
    @classmethod
    def transform_empty_string_to_none(cls, v: Any) -> Any:
        if v is None:
            return None
        if isinstance(v, str):
            val = v.strip()
            if val == "" or val.lower() == "null" or val.lower() == "undefined":
                return None
            if val.isdigit():
                return int(val)
        return v

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

    committee: Optional[CandidateCommitteeResponse] = None
    target: Optional[TargetResponse] = None

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
