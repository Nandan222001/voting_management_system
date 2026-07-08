from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, ConfigDict, Field
from app.models.event import EventCommunicationType


class EventBase(BaseModel):
    event_type: str = Field(..., examples=["Meeting"])
    event_date: str = Field(..., examples=["2026-06-15"])
    event_time: str = Field(..., examples=["10:00 AM"])
    place: str = Field(..., examples=["Patna"])
    communication_type: EventCommunicationType = Field(default=EventCommunicationType.offline)
    description: Optional[str] = None


class EventCreate(EventBase):
    pass


class EventResponse(EventBase):
    id: int
    tenant_id: int
    created_by: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class EventNotificationResponse(BaseModel):
    id: int
    event_id: int
    user_id: int
    is_read: bool
    created_at: datetime
    event: Optional[EventResponse] = None

    model_config = ConfigDict(from_attributes=True)
