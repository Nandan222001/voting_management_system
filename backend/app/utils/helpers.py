"""
General-purpose helper utilities.

Single Responsibility: This module handles cross-cutting concerns such as
request introspection, query pagination, and membership expiry calculations.
"""

import re
from datetime import datetime, timedelta
from typing import Any, Optional

from fastapi import Request
from sqlalchemy.orm import Query, Session

from app.models.plan import Plan


def get_client_ip(request: Request) -> str:
    """Extract the real client IP address from a FastAPI Request."""
    forwarded_for: str | None = request.headers.get("X-Forwarded-For")
    if forwarded_for:
        return forwarded_for.split(",")[0].strip()

    if request.client and request.client.host:
        return request.client.host

    return "unknown"


def paginate(query: Query, page: int, per_page: int) -> tuple[list[Any], int]:
    """Apply offset/limit pagination to a SQLAlchemy Query object."""
    page = max(1, page)
    per_page = max(1, per_page)

    total: int = query.count()
    offset: int = (page - 1) * per_page
    items: list[Any] = query.offset(offset).limit(per_page).all()

    return items, total


def calculate_expiry_from_period(period: Optional[str]) -> Optional[datetime]:
    """Calculate expiry datetime from a plan period string."""
    if not period:
        return None

    normalized = period.strip().lower()

    if normalized == "lifetime":
        return None

    year_match = re.search(r"(\d+)\s*-?\s*year", normalized)
    month_match = re.search(r"(\d+)\s*-?\s*month", normalized)

    if normalized == "year" or year_match:
        years = int(year_match.group(1)) if year_match else 1
        return datetime.utcnow() + timedelta(days=365 * years)

    if normalized == "month" or month_match:
        months = int(month_match.group(1)) if month_match else 1
        return datetime.utcnow() + timedelta(days=30 * months)

    return None


def get_plan_expiry(db: Session, plan_id: int) -> Optional[datetime]:
    """Return the expiry datetime for a given plan id."""
    plan: Optional[Plan] = db.query(Plan).filter(Plan.id == plan_id).first()
    if not plan:
        return None

    return calculate_expiry_from_period(plan.period)