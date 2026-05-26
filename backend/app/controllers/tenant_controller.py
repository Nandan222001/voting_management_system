"""
Tenant controller — platform-level tenant management (SuperAdmin only).

All routes require superadmin privileges. Regular tenant admins and voters
have no access to these endpoints.
"""

from fastapi import APIRouter, Depends, status, UploadFile, File, Form
from fastapi.responses import JSONResponse
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session

from app.config.database import get_db
from app.middlewares.auth_middleware import require_superadmin
from app.models.user import User
from app.schemas.tenant import TenantCreate, TenantResponse, TenantUpdate, TenantPublicResponse
from app.services.tenant_service import tenant_service
from app.utils.response import success_response

router = APIRouter(prefix="/tenants", tags=["Tenants (SuperAdmin)"])


@router.get("/public", summary="List all active tenants for selection")
def list_public_tenants(
    db: Session = Depends(get_db),
) -> JSONResponse:
    """
    Returns a minimal list of active tenants for public registration selection.
    No authentication required.
    """
    from app.models.tenant import Tenant as TenantModel
    tenants = db.query(TenantModel).filter(TenantModel.status == "active").all()
    data = [TenantPublicResponse.model_validate(t).model_dump(mode="json") for t in tenants]
    return success_response(data=data, message="Public tenants retrieved.")


class SuspendRequest(BaseModel):
    reason: str = "No reason provided"


# ---------------------------------------------------------------------------
# Platform stats
# ---------------------------------------------------------------------------

@router.get("/platform-stats", summary="Platform-wide statistics (superadmin)")
def get_platform_stats(
    _: User = Depends(require_superadmin),
    db: Session = Depends(get_db),
) -> JSONResponse:
    stats = tenant_service.get_platform_stats(db)
    return success_response(data=stats, message="Platform statistics retrieved.")


# ---------------------------------------------------------------------------
# CRUD
# ---------------------------------------------------------------------------

@router.get("/", summary="List all tenants with pagination")
def list_tenants(
    page: int = 1,
    per_page: int = 20,
    status: str | None = None,
    _: User = Depends(require_superadmin),
    db: Session = Depends(get_db),
) -> JSONResponse:
    from app.repositories.tenant_repository import TenantRepository
    from app.models.tenant import Tenant as TenantModel

    skip = (page - 1) * per_page
    repo = TenantRepository(db)

    if status:
        rows = repo.get_by_status_with_counts(status, skip=skip, limit=per_page)
        total = db.query(TenantModel).filter(TenantModel.status == status).count()
    else:
        rows = repo.get_all_with_counts(skip=skip, limit=per_page)
        total = repo.count()

    data = []
    for row in rows:
        t_dict = TenantResponse.model_validate(row["tenant"]).model_dump(mode="json")
        t_dict["user_count"] = row["user_count"]
        t_dict["election_count"] = row["election_count"]
        data.append(t_dict)

    return success_response(
        data={"tenants": data, "total": total, "page": page, "per_page": per_page},
        message="Tenants retrieved.",
    )


@router.post("/", status_code=status.HTTP_201_CREATED, summary="Create a new tenant")
def create_tenant(
    name: str = Form(...),
    slug: str | None = Form(None),
    contact_email: EmailStr | None = Form(None),
    plan: str = Form('starter'),
    admin_full_name: str = Form(...),
    admin_email: EmailStr = Form(...),
    admin_password: str = Form(...),
    logo: UploadFile | None = File(None),
    current_user: User = Depends(require_superadmin),
    db: Session = Depends(get_db),
) -> JSONResponse:
    # Build TenantCreate-like object from form fields
    body = TenantCreate(
        name=name,
        slug=slug,
        contact_email=contact_email,
        plan=plan,
        logo_url=None,
        admin_full_name=admin_full_name,
        admin_email=admin_email,
        admin_password=admin_password,
    )
    tenant = tenant_service.create_tenant(db, body, created_by=current_user.id, logo=logo)
    return success_response(
        data=TenantResponse.model_validate(tenant).model_dump(mode="json"),
        message=f"Tenant '{tenant.name}' created successfully.",
    )


@router.get("/{tenant_id}", summary="Get a single tenant with usage stats")
def get_tenant(
    tenant_id: int,
    _: User = Depends(require_superadmin),
    db: Session = Depends(get_db),
) -> JSONResponse:
    tenant = tenant_service.get_tenant_by_id(db, tenant_id)
    overview = tenant_service.get_tenant_overview(db, tenant_id)
    data = TenantResponse.model_validate(tenant).model_dump(mode="json")
    data["usage"] = overview
    return success_response(data=data, message="Tenant retrieved.")


@router.put("/{tenant_id}", summary="Update tenant branding / settings")
def update_tenant(
    tenant_id: int,
    name: str | None = Form(None),
    slug: str | None = Form(None),
    contact_email: EmailStr | None = Form(None),
    plan: str | None = Form(None),
    logo: UploadFile | None = File(None),
    _: User = Depends(require_superadmin),
    db: Session = Depends(get_db),
) -> JSONResponse:
    # Build a TenantUpdate model from supplied form fields
    update_data = {}
    if name is not None:
        update_data['name'] = name
    if slug is not None:
        update_data['slug'] = slug
    if contact_email is not None:
        update_data['contact_email'] = contact_email
    if plan is not None:
        update_data['plan'] = plan

    body = TenantUpdate(**update_data) if update_data else TenantUpdate()
    tenant = tenant_service.update_tenant(db, tenant_id, body, logo=logo)
    return success_response(
        data=TenantResponse.model_validate(tenant).model_dump(mode="json"),
        message="Tenant updated.",
    )


@router.delete("/{tenant_id}", summary="Soft-delete (cancel) a tenant")
def delete_tenant(
    tenant_id: int,
    _: User = Depends(require_superadmin),
    db: Session = Depends(get_db),
) -> JSONResponse:
    tenant_service.delete_tenant(db, tenant_id)
    return success_response(data=None, message="Tenant cancelled.")


# ---------------------------------------------------------------------------
# Lifecycle
# ---------------------------------------------------------------------------

@router.post("/{tenant_id}/suspend", summary="Suspend a tenant (blocks all logins)")
def suspend_tenant(
    tenant_id: int,
    body: SuspendRequest,
    _: User = Depends(require_superadmin),
    db: Session = Depends(get_db),
) -> JSONResponse:
    tenant = tenant_service.suspend_tenant(db, tenant_id, body.reason)
    return success_response(
        data=TenantResponse.model_validate(tenant).model_dump(mode="json"),
        message="Tenant suspended.",
    )


@router.post("/{tenant_id}/activate", summary="Activate or reactivate a tenant")
def activate_tenant(
    tenant_id: int,
    _: User = Depends(require_superadmin),
    db: Session = Depends(get_db),
) -> JSONResponse:
    tenant = tenant_service.activate_tenant(db, tenant_id)
    return success_response(
        data=TenantResponse.model_validate(tenant).model_dump(mode="json"),
        message="Tenant activated.",
    )


# ---------------------------------------------------------------------------
# Cross-tenant inspection (SuperAdmin support view)
# ---------------------------------------------------------------------------

@router.get("/{tenant_id}/elections", summary="List all elections for a tenant")
def tenant_elections(
    tenant_id: int,
    page: int = 1,
    per_page: int = 20,
    _: User = Depends(require_superadmin),
    db: Session = Depends(get_db),
) -> JSONResponse:
    from app.models.election import Election
    from app.schemas.election import ElectionResponse
    skip = (page - 1) * per_page
    elections = (
        db.query(Election)
        .filter(Election.tenant_id == tenant_id)
        .offset(skip).limit(per_page).all()
    )
    total = db.query(Election).filter(Election.tenant_id == tenant_id).count()
    data = [ElectionResponse.model_validate(e).model_dump(mode="json") for e in elections]
    return success_response(
        data={"elections": data, "total": total},
        message="Tenant elections retrieved.",
    )


@router.get("/{tenant_id}/users", summary="List all users for a tenant")
def tenant_users(
    tenant_id: int,
    page: int = 1,
    per_page: int = 20,
    _: User = Depends(require_superadmin),
    db: Session = Depends(get_db),
) -> JSONResponse:
    from app.schemas.user import UserResponse
    from app.models.user import User as UserModel
    skip = (page - 1) * per_page
    users = (
        db.query(UserModel)
        .filter(UserModel.tenant_id == tenant_id)
        .offset(skip).limit(per_page).all()
    )
    total = db.query(UserModel).filter(UserModel.tenant_id == tenant_id).count()
    data = [UserResponse.model_validate(u).model_dump(mode="json") for u in users]
    return success_response(
        data={"users": data, "total": total},
        message="Tenant users retrieved.",
    )
