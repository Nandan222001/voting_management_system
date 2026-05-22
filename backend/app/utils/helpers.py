"""
General-purpose helper utilities.

Single Responsibility: This module handles cross-cutting concerns such as
request introspection and query pagination — neither of which belongs in
business-logic or persistence layers.
"""

from typing import Any

from fastapi import Request
from sqlalchemy.orm import Query


def get_client_ip(request: Request) -> str:
    """
    Extract the real client IP address from a FastAPI ``Request``.

    Checks the ``X-Forwarded-For`` header first (common behind a reverse
    proxy or load balancer), then falls back to the direct connection
    address.

    Args:
        request: The incoming FastAPI / Starlette request object.

    Returns:
        The client's IP address as a string, e.g. ``"192.168.1.10"``.
        Returns ``"unknown"`` when the address cannot be determined.
    """
    # Honour X-Forwarded-For when behind a proxy/load-balancer.
    forwarded_for: str | None = request.headers.get("X-Forwarded-For")
    if forwarded_for:
        # The header may contain a comma-separated list; the first entry is
        # the originating client.
        return forwarded_for.split(",")[0].strip()

    # Starlette populates request.client for direct connections.
    if request.client and request.client.host:
        return request.client.host

    return "unknown"


def paginate(query: Query, page: int, per_page: int) -> tuple[list[Any], int]:
    """
    Apply offset/limit pagination to a SQLAlchemy *legacy* ``Query`` object.

    Args:
        query:    An unexecuted SQLAlchemy ``Query``.
        page:     1-indexed page number.  Values below 1 are clamped to 1.
        per_page: Maximum number of rows per page.  Values below 1 are
                  clamped to 1.

    Returns:
        A two-element tuple ``(items, total)`` where:

        * ``items``  – the hydrated ORM objects for the requested page.
        * ``total``  – total row count matching the *un-paginated* query.

    Example::

        items, total = paginate(db.query(User), page=2, per_page=20)
    """
    # Guard against nonsensical values.
    page = max(1, page)
    per_page = max(1, per_page)

    total: int = query.count()
    offset: int = (page - 1) * per_page
    items: list[Any] = query.offset(offset).limit(per_page).all()

    return items, total
