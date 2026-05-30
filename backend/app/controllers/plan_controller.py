from fastapi import APIRouter, Depends, Query, status
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session

from app.config.database import get_db
from app.middlewares.auth_middleware import get_current_user, require_admin
from app.models.user import User
from app.schemas.plan import PlanCreate, PlanUpdate, PlanResponse, PlanListResponse
from app.services.plan_service import plan_service
from app.utils.response import success_response

router = APIRouter(prefix="/plans", tags=["Voter Subscription Plans"])


@router.get(
    "/",
    summary="List all subscription plans for the tenant",
)
def get_plans(
    active_only: bool = Query(False),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> JSONResponse:
    """
    Returns a list of all plans defined by the tenant admin.
    """
    items, total = plan_service.get_plans(db, tenant_id=current_user.tenant_id, active_only=active_only)
    
    return success_response(
        data={
            "total": total,
            "items": [PlanResponse.model_validate(i).model_dump(mode="json") for i in items]
        },
        message="Plans retrieved successfully."
    )


@router.get(
    "/public",
    summary="List all subscription plans for a specific tenant (Public)",
)
def get_public_plans(
    tenant_id: int,
    db: Session = Depends(get_db),
) -> JSONResponse:
    """
    Returns a list of all active plans defined by the specified tenant. Publicly accessible.
    """
    items, total = plan_service.get_plans(db, tenant_id=tenant_id, active_only=True)
    
    return success_response(
        data={
            "total": total,
            "items": [PlanResponse.model_validate(i).model_dump(mode="json") for i in items]
        },
        message="Public plans retrieved successfully."
    )


@router.post(
    "/",
    status_code=status.HTTP_201_CREATED,
    summary="Create a new subscription plan (Admin only)",
)
def create_plan(
    payload: PlanCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
) -> JSONResponse:
    """
    Define a new plan that voters can subscribe to.
    """
    plan = plan_service.create_plan(db, tenant_id=current_user.tenant_id, data=payload)
    return success_response(
        data=PlanResponse.model_validate(plan).model_dump(mode="json"),
        message="Subscription plan created successfully."
    )


@router.put(
    "/{plan_id}",
    summary="Update an existing plan (Admin only)",
)
def update_plan(
    plan_id: int,
    payload: PlanUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
) -> JSONResponse:
    """
    Modify an existing subscription plan.
    """
    plan = plan_service.update_plan(db, plan_id=plan_id, tenant_id=current_user.tenant_id, data=payload)
    return success_response(
        data=PlanResponse.model_validate(plan).model_dump(mode="json"),
        message="Subscription plan updated successfully."
    )


@router.delete(
    "/{plan_id}",
    summary="Delete a subscription plan (Admin only)",
)
def delete_plan(
    plan_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
) -> JSONResponse:
    """
    Remove a plan from the registry.
    """
    plan_service.delete_plan(db, plan_id=plan_id, tenant_id=current_user.tenant_id)
    return success_response(message="Subscription plan deleted successfully.")
