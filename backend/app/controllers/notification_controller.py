from typing import List, Any, Optional
from fastapi import APIRouter, Depends, status, HTTPException
from fastapi.encoders import jsonable_encoder
from sqlalchemy.orm import Session
from sqlalchemy import text
from pydantic import BaseModel

from app.config.database import get_db
from app.middlewares.auth_middleware import get_header_tenant_id
from app.utils.response import success_response

router = APIRouter(prefix="/notifications", tags=["Notifications"])

class NotificationGroupResponse(BaseModel):
    today: List[Any]
    tomorrow: List[Any]

@router.get("", summary="Get grouped notifications for today and tomorrow")
def get_notifications(
    tenant_id: Optional[int] = Depends(get_header_tenant_id),
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
    if tenant_id is None:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Tenant context required. Please provide X-Tenant-ID header or valid Auth token."
        )
    
    # 1. Fetch Today's Announcements
    today_announcements_query = text("""
        SELECT * FROM announcements 
        WHERE DATE(publish_date) = CURDATE() 
        AND tenant_id = :tenant_id 
        AND status = 'published'
        ORDER BY publish_date DESC
    """)
    today_announcements = db.execute(today_announcements_query, {"tenant_id": tenant_id}).fetchall()
    
    # 2. Fetch Today's Active Elections
    today_elections_query = text("""
        SELECT * FROM elections 
        WHERE CURDATE() BETWEEN DATE(start_date) AND DATE(end_date) 
        AND tenant_id = :tenant_id 
        AND status = 'active'
    """)
    today_elections = db.execute(today_elections_query, {"tenant_id": tenant_id}).fetchall()
    
    # 3. Fetch Tomorrow's Announcements
    tomorrow_announcements_query = text("""
        SELECT * FROM announcements 
        WHERE DATE(publish_date) = DATE_ADD(CURDATE(), INTERVAL 1 DAY) 
        AND tenant_id = :tenant_id 
        AND status = 'published'
    """)
    tomorrow_announcements = db.execute(tomorrow_announcements_query, {"tenant_id": tenant_id}).fetchall()
    
    # 4. Fetch Tomorrow's Scheduled Elections
    tomorrow_elections_query = text("""
        SELECT * FROM elections 
        WHERE DATE(start_date) = DATE_ADD(CURDATE(), INTERVAL 1 DAY) 
        AND tenant_id = :tenant_id
    """)
    tomorrow_elections = db.execute(tomorrow_elections_query, {"tenant_id": tenant_id}).fetchall()
    
    # Helper to format mixed results
    def format_item(item, item_type):
        d = dict(item._mapping)
        d['item_type'] = item_type
        
        # Handle JSON strings for image_urls if they haven't been parsed by the driver
        if 'image_urls' in d and isinstance(d['image_urls'], str):
            import json
            try:
                d['image_urls'] = json.loads(d['image_urls'])
            except:
                d['image_urls'] = []
        elif 'image_urls' not in d:
            # For elections or items without images, ensure a consistent empty list
            d['image_urls'] = []
            
        return d

    data = {
        "today": [format_item(i, "announcement") for i in today_announcements] + 
                 [format_item(i, "election") for i in today_elections],
        "tomorrow": [format_item(i, "announcement") for i in tomorrow_announcements] + 
                    [format_item(i, "election") for i in tomorrow_elections]
    }
    
    # Crucial: Use jsonable_encoder because the dict contains datetime objects
    # which standard JSONResponse cannot serialize.
    return success_response(
        data=jsonable_encoder(data), 
        message="Notifications grouped successfully."
    )
