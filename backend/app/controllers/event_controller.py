from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import text

from app.config.database import get_db
from app.middlewares.auth_middleware import get_current_user
from app.models.user import User
from app.models.event import Event, EventNotification
from app.models.target import Target
from app.schemas.event import EventCreate, EventResponse, EventNotificationResponse
from app.utils.response import success_response

router = APIRouter(prefix="/events", tags=["Events"])


def get_all_descendant_target_ids(db: Session, target_id: int) -> List[int]:
    """Recursively fetch all descendant target IDs."""
    query = text("""
        WITH RECURSIVE target_hierarchy AS (
            SELECT id FROM targets WHERE id = :target_id
            UNION ALL
            SELECT t.id FROM targets t
            INNER JOIN target_hierarchy th ON t.parent_id = th.id
        )
        SELECT id FROM target_hierarchy
    """)
    result = db.execute(query, {"target_id": target_id}).fetchall()
    return [row[0] for row in result]


@router.post("", response_model=EventResponse, summary="Create a new event")
def create_event(
    payload: EventCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Create a new event and notify all users in the committee hierarchy (downward).
    Only available to users who are 'Winners' of a target.
    """
    # Check if user is a winner of any target (committee)
    target = db.query(Target).filter(Target.winner_id == current_user.id).first()
    if not target:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only winners of a committee can create events."
        )

    # Create the event
    new_event = Event(
        tenant_id=current_user.tenant_id,
        created_by=current_user.id,
        event_type=payload.event_type,
        event_date=payload.event_date,
        event_time=payload.event_time,
        place=payload.place,
        communication_type=payload.communication_type,
        description=payload.description
    )
    db.add(new_event)
    db.flush()

    # Find all descendant target IDs (including self)
    descendant_ids = get_all_descendant_target_ids(db, target.id)
    
    # Notify all users in these committees (except the creator)
    users_to_notify = db.query(User.id).filter(
        User.target_id.in_(descendant_ids),
        User.id != current_user.id
    ).all()

    notifications = []
    for user_row in users_to_notify:
        notifications.append(EventNotification(
            event_id=new_event.id,
            user_id=user_row[0],
            is_read=0
        ))
    
    if notifications:
        db.bulk_save_objects(notifications)
    
    db.commit()
    db.refresh(new_event)

    return success_response(
        data=EventResponse.model_validate(new_event).model_dump(mode="json"),
        message="Event created and notifications sent to committee hierarchy."
    )


@router.get("/my", response_model=List[EventResponse], summary="Get events created by me")
def get_my_events(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    events = db.query(Event).filter(Event.created_by == current_user.id).order_by(Event.created_at.desc()).all()
    return success_response(
        data=[EventResponse.model_validate(e).model_dump(mode="json") for e in events],
        message="My events retrieved."
    )


@router.get("/hierarchy", response_model=List[EventResponse], summary="Get events from lower hierarchy")
def get_hierarchy_events(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Upper hierarchy winners see events created by users below them.
    """
    # Find user's target where they are the winner
    target = db.query(Target).filter(Target.winner_id == current_user.id).first()
    if not target:
        return success_response(data=[], message="No hierarchy events found.")

    descendant_ids = get_all_descendant_target_ids(db, target.id)
    # Remove own target ID to see only "lower" hierarchy
    descendant_ids = [d for d in descendant_ids if d != target.id]

    if not descendant_ids:
        return success_response(data=[], message="No lower committees found.")

    # Find winners in these descendant committees
    descendant_winners = db.query(Target.winner_id).filter(
        Target.id.in_(descendant_ids),
        Target.winner_id.isnot(None)
    ).all()
    descendant_winner_ids = [w[0] for w in descendant_winners]

    if not descendant_winner_ids:
        return success_response(data=[], message="No winners found in lower committees.")

    events = db.query(Event).filter(
        Event.created_by.in_(descendant_winner_ids)
    ).order_by(Event.created_at.desc()).all()

    return success_response(
        data=[EventResponse.model_validate(e).model_dump(mode="json") for e in events],
        message="Lower hierarchy committee events retrieved."
    )


@router.get("/notifications", response_model=List[EventNotificationResponse], summary="Get my event notifications")
def get_event_notifications(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    notifications = db.query(EventNotification).filter(
        EventNotification.user_id == current_user.id
    ).order_by(EventNotification.created_at.desc()).all()
    
    return success_response(
        data=[EventNotificationResponse.model_validate(n).model_dump(mode="json") for n in notifications],
        message="Event notifications retrieved."
    )


@router.get("/{event_id}", response_model=EventResponse, summary="Get event details")
def get_event_details(
    event_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found.")
    
    return success_response(
        data=EventResponse.model_validate(event).model_dump(mode="json"),
        message="Event details retrieved."
    )


@router.put("/notifications/{notif_id}/read", summary="Mark notification as read")
def mark_notification_read(
    notif_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    notif = db.query(EventNotification).filter(
        EventNotification.id == notif_id,
        EventNotification.user_id == current_user.id
    ).first()
    
    if not notif:
        raise HTTPException(status_code=404, detail="Notification not found.")
    
    notif.is_read = 1
    db.commit()
    
    return success_response(message="Notification marked as read.")
