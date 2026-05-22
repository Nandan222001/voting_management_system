"""
Audit middleware.

Single Responsibility: Intercepts every state-changing HTTP request
(POST, PUT, DELETE, PATCH) and writes an ``AuditLog`` row so that
administrators can reconstruct the full history of mutations.
"""

import json
import logging
from typing import Callable

from jose import JWTError
from sqlalchemy.orm import Session
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response

from app.config.database import SessionLocal
from app.models.audit_log import AuditLog
from app.utils.helpers import get_client_ip
from app.utils.security import decode_token

logger = logging.getLogger(__name__)

# HTTP methods that mutate server state and should be audited.
_AUDITED_METHODS = {"POST", "PUT", "DELETE", "PATCH"}


class AuditMiddleware(BaseHTTPMiddleware):
    """
    Starlette ``BaseHTTPMiddleware`` that persists audit log entries for every
    state-changing HTTP request.

    The middleware:
    1. Lets the request pass through to the route handler.
    2. After the response is generated, opens a *separate* DB session and
       writes one ``AuditLog`` row containing the method, path, status code,
       client IP, and (if authenticated) the requesting user's ID.

    A separate session is used so that audit logging never interferes with the
    transactional state of the request's own session.
    """

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        response: Response = await call_next(request)

        if request.method not in _AUDITED_METHODS:
            return response

        # Derive a human-readable action from method + path.
        action = f"{request.method} {request.url.path}"

        # Best-effort extraction of the authenticated user.
        user_id: int | None = None
        auth_header: str | None = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            token = auth_header.removeprefix("Bearer ").strip()
            try:
                payload = decode_token(token)
                raw_sub = payload.get("sub")
                if raw_sub is not None:
                    user_id = int(raw_sub)
            except (JWTError, ValueError, TypeError):
                pass

        # Derive entity type / id from URL path segments.
        # e.g. /api/v1/elections/42  -> entity_type="elections", entity_id=42
        entity_type: str | None = None
        entity_id: int | None = None
        path_parts = [p for p in request.url.path.split("/") if p]
        # The entity type is typically the last non-numeric path segment.
        for i, part in enumerate(path_parts):
            if not part.isdigit():
                entity_type = part
            else:
                try:
                    entity_id = int(part)
                except ValueError:
                    pass

        ip_address = get_client_ip(request)

        details_payload: dict = {
            "path": request.url.path,
            "method": request.method,
            "status_code": response.status_code,
            "query_params": dict(request.query_params),
        }

        db: Session = SessionLocal()
        try:
            log_entry = AuditLog(
                user_id=user_id,
                action=action,
                entity_type=entity_type,
                entity_id=entity_id,
                details=json.dumps(details_payload),
                ip_address=ip_address,
            )
            db.add(log_entry)
            db.commit()
        except Exception as exc:  # pragma: no cover
            logger.error("AuditMiddleware: failed to write audit log: %s", exc)
            db.rollback()
        finally:
            db.close()

        return response
