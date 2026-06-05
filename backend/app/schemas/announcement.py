from datetime import datetime
from typing import Any, Optional

from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.models.announcement import AnnouncementStatus


def _clean_url_list(value: Any) -> list[str]:
    if value is None:
        return []
    if isinstance(value, str):
        return [value] if value.strip() else []
    if isinstance(value, list):
        return [str(item).strip() for item in value if str(item).strip()]
    return []


class AnnouncementBase(BaseModel):
    title: str = Field(..., min_length=3, max_length=200)
    short_description: str = Field(..., min_length=3, max_length=500)
    content: str = Field(..., min_length=3)
    image_urls: list[str] = Field(default_factory=list)
    attachment_urls: list[str] = Field(default_factory=list)
    publish_date: datetime
    status: AnnouncementStatus = AnnouncementStatus.draft
    is_featured: bool = False

    @field_validator("image_urls", "attachment_urls", mode="before")
    @classmethod
    def parse_url_list(cls, value: Any) -> list[str]:
        return _clean_url_list(value)

    model_config = ConfigDict(from_attributes=True)


class AnnouncementCreate(AnnouncementBase):
    tenant_id: Optional[int] = None


class AnnouncementUpdate(BaseModel):
    title: Optional[str] = Field(default=None, min_length=3, max_length=200)
    short_description: Optional[str] = Field(default=None, min_length=3, max_length=500)
    content: Optional[str] = Field(default=None, min_length=3)
    image_urls: Optional[list[str]] = None
    attachment_urls: Optional[list[str]] = None
    publish_date: Optional[datetime] = None
    status: Optional[AnnouncementStatus] = None
    is_featured: Optional[bool] = None

    @field_validator("image_urls", "attachment_urls", mode="before")
    @classmethod
    def parse_url_list(cls, value: Any) -> list[str]:
        return _clean_url_list(value)

    model_config = ConfigDict(from_attributes=True)


class AnnouncementResponse(AnnouncementBase):
    id: int
    tenant_id: int
    created_by: Optional[int] = None
    created_at: datetime
    updated_at: datetime


class AnnouncementListResponse(BaseModel):
    total: int
    page: int
    per_page: int
    items: list[AnnouncementResponse]

    model_config = ConfigDict(from_attributes=True)
