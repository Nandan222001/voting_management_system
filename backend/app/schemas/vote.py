from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, ConfigDict, Field


# ---------------------------------------------------------------------------
# Request schemas
# ---------------------------------------------------------------------------

class VoteCreate(BaseModel):
    """Payload submitted by a voter to cast a ballot."""

    election_id: int = Field(..., gt=0, examples=[1])
    candidate_id: int = Field(..., gt=0, examples=[3])

    model_config = ConfigDict(from_attributes=True)


# ---------------------------------------------------------------------------
# Response schemas
# ---------------------------------------------------------------------------

class VoteResponse(BaseModel):
    """Confirmation record returned after a vote is successfully cast."""

    id: int
    user_id: int
    election_id: int
    candidate_id: int
    voted_at: datetime
    ip_address: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


# ---------------------------------------------------------------------------
# Results schemas
# ---------------------------------------------------------------------------

class VoteResultItem(BaseModel):
    """Per-candidate tally entry within an election result."""

    candidate_id: int
    candidate_name: str
    symbol: Optional[str] = None
    image_url: Optional[str] = None
    rank: int = Field(default=0, examples=[1])
    is_winner: bool = False
    vote_count: int = Field(default=0, examples=[42])
    percentage: float = Field(
        default=0.0,
        ge=0.0,
        le=100.0,
        examples=[35.5],
        description="Percentage of total votes cast in the election.",
    )

    model_config = ConfigDict(from_attributes=True)


class ElectionResultResponse(BaseModel):
    """Aggregated result for an entire election."""

    election_id: int
    election_title: str
    total_votes: int = Field(default=0, examples=[120])
    results: List[VoteResultItem]
    winner: Optional[VoteResultItem] = None
    winners: List[VoteResultItem] = Field(default_factory=list)
    is_tie: bool = False
    winner_declared: bool = False

    model_config = ConfigDict(from_attributes=True)
