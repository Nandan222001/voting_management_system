from datetime import datetime
from typing import Any, Optional

from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.models.nomination import NominationStatus


def _parse_bool(value: Any) -> bool:
    if isinstance(value, bool):
        return value
    if value is None:
        return False
    if isinstance(value, str):
        return value.strip().lower() in {"1", "true", "yes", "y", "on"}
    return bool(value)


class NominationBase(BaseModel):
    full_name: str = Field(..., min_length=2, max_length=150)
    position_name: Optional[str] = Field(default=None, max_length=100)
    committee_id: Optional[int] = None
    target_id: Optional[int] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    date_of_birth: Optional[str] = None
    gender: Optional[str] = None
    parent_name: Optional[str] = None
    kyc_type: Optional[str] = None
    voter_id_number: Optional[str] = None
    state: Optional[str] = None
    district: Optional[str] = None
    taluka: Optional[str] = None
    village: Optional[str] = None
    pincode: Optional[str] = None
    image_url: Optional[str] = Field(default=None, max_length=500)
    bio: Optional[str] = None
    is_willing: bool = True
    held_previously: bool = False
    prev_position: Optional[str] = None
    prev_duration: Optional[str] = None
    is_disciplined: bool = False
    discipline_details: Optional[str] = None
    has_complaints: bool = False
    agreed_constitution: bool = False
    accepted_results: bool = False
    signature_url: Optional[str] = Field(default=None, max_length=500)

    @field_validator(
        "is_willing",
        "held_previously",
        "is_disciplined",
        "has_complaints",
        "agreed_constitution",
        "accepted_results",
        mode="before",
    )
    @classmethod
    def parse_bool_fields(cls, value: Any) -> bool:
        return _parse_bool(value)

    @field_validator("committee_id", "target_id", mode="before")
    @classmethod
    def empty_string_to_none(cls, value: Any) -> Any:
        if value is None:
            return None
        if isinstance(value, str):
            cleaned = value.strip()
            if cleaned == "" or cleaned.lower() in {"null", "undefined"}:
                return None
            if cleaned.isdigit():
                return int(cleaned)
        return value

    model_config = ConfigDict(from_attributes=True)


class NominationCreate(NominationBase):
    election_id: int = Field(..., gt=0)


class NominationUpdate(BaseModel):
    full_name: Optional[str] = Field(default=None, min_length=2, max_length=150)
    position_name: Optional[str] = Field(default=None, max_length=100)
    committee_id: Optional[int] = None
    target_id: Optional[int] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    date_of_birth: Optional[str] = None
    gender: Optional[str] = None
    parent_name: Optional[str] = None
    kyc_type: Optional[str] = None
    voter_id_number: Optional[str] = None
    state: Optional[str] = None
    district: Optional[str] = None
    taluka: Optional[str] = None
    village: Optional[str] = None
    pincode: Optional[str] = None
    image_url: Optional[str] = Field(default=None, max_length=500)
    bio: Optional[str] = None
    is_willing: Optional[bool] = None
    held_previously: Optional[bool] = None
    prev_position: Optional[str] = None
    prev_duration: Optional[str] = None
    is_disciplined: Optional[bool] = None
    discipline_details: Optional[str] = None
    has_complaints: Optional[bool] = None
    agreed_constitution: Optional[bool] = None
    accepted_results: Optional[bool] = None
    signature_url: Optional[str] = Field(default=None, max_length=500)

    @field_validator(
        "is_willing",
        "held_previously",
        "is_disciplined",
        "has_complaints",
        "agreed_constitution",
        "accepted_results",
        mode="before",
    )
    @classmethod
    def parse_bool_fields(cls, value: Any) -> bool:
        return _parse_bool(value)

    @field_validator("committee_id", "target_id", mode="before")
    @classmethod
    def empty_string_to_none(cls, value: Any) -> Any:
        return NominationBase.empty_string_to_none(value)

    model_config = ConfigDict(from_attributes=True)


from app.schemas.user import UserResponse
from app.schemas.election import ElectionResponse
from app.schemas.candidate_committee import CandidateCommitteeResponse
from app.schemas.target import TargetResponse


class NominationResponse(NominationBase):
    id: int
    election_id: int
    user_id: int
    tenant_id: int
    status: NominationStatus
    created_at: datetime
    updated_at: datetime

    # Relations
    election: Optional[ElectionResponse] = None
    user: Optional[UserResponse] = None
    committee: Optional[CandidateCommitteeResponse] = None
    target: Optional[TargetResponse] = None

    model_config = ConfigDict(from_attributes=True)


class NominationListResponse(BaseModel):
    total: int
    page: int
    per_page: int
    items: list[NominationResponse]

    model_config = ConfigDict(from_attributes=True)
