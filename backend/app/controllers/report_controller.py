"""
Report controller — analytics, audit logs, and election reports.

All routes require at minimum admin-level access.
"""

from fastapi import APIRouter, Depends, Query
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session

from app.config.database import get_db
from app.middlewares.auth_middleware import get_current_user, require_admin
from app.models.user import User, UserRole
from app.services.report_service import report_service
from app.utils.response import success_response

router = APIRouter(prefix="/reports", tags=["Reports"])


# ---------------------------------------------------------------------------
# Dashboard overview
# ---------------------------------------------------------------------------

@router.get("/dashboard", summary="Admin dashboard overview statistics")
def get_dashboard(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> JSONResponse:
    data = report_service.get_dashboard_overview(db)
    return success_response(data=data, message="Dashboard overview retrieved.")


# ---------------------------------------------------------------------------
# Election reports
# ---------------------------------------------------------------------------

@router.get("/elections/{election_id}", summary="Detailed report for a single election")
def get_election_report(
    election_id: int,
    _: User = Depends(require_admin),
    db: Session = Depends(get_db),
) -> JSONResponse:
    data = report_service.get_election_report(db, election_id)
    return success_response(data=data, message="Election report retrieved.")


@router.get(
    "/participation/{election_id}",
    summary="Voter participation statistics for an election",
)
def get_participation_stats(
    election_id: int,
    _: User = Depends(require_admin),
    db: Session = Depends(get_db),
) -> JSONResponse:
    data = report_service.get_participation_stats(db, election_id)
    return success_response(data=data, message="Participation statistics retrieved.")


# ---------------------------------------------------------------------------
# Audit logs
# ---------------------------------------------------------------------------

@router.get("/audit-logs", summary="Paginated audit log (admin only)")
def get_audit_logs(
    page: int = Query(1, ge=1),
    per_page: int = Query(50, ge=1, le=200),
    user_id: int | None = Query(None),
    action: str | None = Query(None),
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db),
) -> JSONResponse:
    """
    Returns a paginated list of system activity logs.
    SuperAdmins see everything (except payment logs); Admins see only their tenant's logs.
    """
    skip = (page - 1) * per_page
    
    # SuperAdmin sees all tenants, but we need to exclude payment logs from the general view
    # as they are now in the Admin's revenue panel.
    tenant_id = None if current_user.role == UserRole.superadmin else current_user.tenant_id
    
    exclude_actions = [
        "PAYMENT ORDER CREATED",
        "PAYMENT VERIFIED",
        "PAYMENT FAILED",
        "payment.order_created",
        "payment.verified",
        "payment.failed"
    ]
    
    logs, total = report_service.get_audit_logs(
        db, 
        skip=skip, 
        limit=per_page, 
        user_id=user_id, 
        action=action,
        tenant_id=tenant_id,
        exclude_actions=exclude_actions
    )
    
    return success_response(
        data={
            "logs": [log.model_dump(mode="json") for log in logs],
            "total": total,
            "page": page,
            "per_page": per_page,
        },
        message="Audit logs retrieved.",
    )
