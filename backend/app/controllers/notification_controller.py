from typing import List, Any
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from sqlalchemy import text
from pydantic import BaseModel

from app.config.database import get_db
from app.middlewares.auth_middleware import get_header_tenant_id
from app.schemas.announcement import AnnouncementResponse
from app.schemas.election import ElectionResponse
from app.utils.response import success_response

router = APIRouter(prefix="/notifications", tags=["Notifications"])

class NotificationGroupResponse(BaseModel):
    today: List[Any]
    tomorrow: List[Any]

@router.get("/", summary="Get grouped notifications for today and tomorrow")
def get_notifications(
    tenant_id: int = Depends(get_header_tenant_id),
    db: Session = Depends(get_db),
):
    """
    Fetches announcements and elections grouped by 'today' and 'tomorrow'.
    
    TODAY: 
    - Announcements published today.
    - Elections active today.
    
    TOMORROW:
    - Announcements scheduled for tomorrow.
    - Elections starting tomorrow.
    """
    
    # 1. Fetch Today's Announcements
    # SQL: SELECT * FROM announcements WHERE DATE(publish_date) = CURDATE() AND tenant_id = :tid AND status = 'published'
    today_announcements_query = text("""
        SELECT * FROM announcements 
        WHERE DATE(publish_date) = CURDATE() 
        AND tenant_id = :tenant_id 
        AND status = 'published'
        ORDER BY publish_date DESC
    """)
    today_announcements = db.execute(today_announcements_query, {"tenant_id": tenant_id}).fetchall()
    
    # 2. Fetch Today's Active Elections
    # SQL: SELECT * FROM elections WHERE CURDATE() BETWEEN DATE(start_date) AND DATE(end_date) AND tenant_id = :tid AND status = 'active'
    today_elections_query = text("""
        SELECT * FROM elections 
        WHERE CURDATE() BETWEEN DATE(start_date) AND DATE(end_date) 
        AND tenant_id = :tenant_id 
        AND status = 'active'
    """)
    today_elections = db.execute(today_elections_query, {"tenant_id": tenant_id}).fetchall()
    
    # 3. Fetch Tomorrow's Announcements
    # SQL: SELECT * FROM announcements WHERE DATE(publish_date) = DATE_ADD(CURDATE(), INTERVAL 1 DAY) AND tenant_id = :tid AND status = 'published'
    tomorrow_announcements_query = text("""
        SELECT * FROM announcements 
        WHERE DATE(publish_date) = DATE_ADD(CURDATE(), INTERVAL 1 DAY) 
        AND tenant_id = :tenant_id 
        AND status = 'published'
    """)
    tomorrow_announcements = db.execute(tomorrow_announcements_query, {"tenant_id": tenant_id}).fetchall()
    
    # 4. Fetch Tomorrow's Scheduled Elections
    # SQL: SELECT * FROM elections WHERE DATE(start_date) = DATE_ADD(CURDATE(), INTERVAL 1 DAY) AND tenant_id = :tid
    tomorrow_elections_query = text("""
        SELECT * FROM elections 
        WHERE DATE(start_date) = DATE_ADD(CURDATE(), INTERVAL 1 DAY) 
        AND tenant_id = :tenant_id
    """)
    tomorrow_elections = db.execute(tomorrow_elections_query, {"tenant_id": tenant_id}).fetchall()
    
    # Helper to format mixed results
    def format_item(item, item_type):
        # We convert the Row object to a dict and add a 'type' field
        d = dict(item._mapping)
        d['item_type'] = item_type
        # Add necessary fields for frontend compatibility if missing
        if 'image_urls' in d and isinstance(d['image_urls'], str):
            import json
            try:
                d['image_urls'] = json.loads(d['image_urls'])
            except:
                d['image_urls'] = []
        return d

    data = {
        "today": [format_item(i, "announcement") for i in today_announcements] + 
                 [format_item(i, "election") for i in today_elections],
        "tomorrow": [format_item(i, "announcement") for i in tomorrow_announcements] + 
                    [format_item(i, "election") for i in tomorrow_elections]
    }
    
    return success_response(data=data, message="Notifications grouped successfully.")
