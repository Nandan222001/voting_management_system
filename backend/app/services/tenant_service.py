"""
Tenant service — SaaS multi-tenancy orchestration.

Single Responsibility: All tenant lifecycle logic lives here.
Dependency Inversion: Depends on TenantRepository and UserRepository abstractions.
"""

import re
from datetime import datetime, timezone
from typing import Optional

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.tenant import Tenant, TenantStatus
from app.models.user import User, UserRole, UserStatus
from app.repositories.tenant_repository import TenantRepository
from app.repositories.user_repository import UserRepository
from app.schemas.tenant import TenantCreate, TenantUpdate
from app.utils.security import generate_otp, hash_password


def _slugify(name: str) -> str:
    slug = name.lower().strip()
    slug = re.sub(r"[^\w\s-]", "", slug)
    slug = re.sub(r"[\s_]+", "-", slug)
    slug = re.sub(r"-+", "-", slug).strip("-")
    return slug[:100]


class TenantService:

    # ------------------------------------------------------------------
    # Creation
    # ------------------------------------------------------------------

    def create_tenant(
        self, db: Session, data: TenantCreate, created_by: int
    ) -> Tenant:
        repo = TenantRepository(db)

        slug = data.slug or _slugify(data.name)
        if repo.get_by_slug(slug):
            slug = f"{slug}-{int(datetime.now(timezone.utc).timestamp())}"

        plan_limits = {
            "starter": (5, 1000),
            "professional": (25, 10000),
            "enterprise": (999999, 99999999),
        }
        max_e, max_v = plan_limits.get(data.plan or "starter", (5, 1000))

        tenant = Tenant(
            name=data.name,
            slug=slug,
            contact_email=data.contact_email,
            plan=data.plan or "starter",
            logo_url=data.logo_url,
            primary_color=data.primary_color or "#4f46e5",
            max_elections=max_e,
            max_voters=max_v,
            status=TenantStatus.trial,
            created_by=created_by,
        )
        db.add(tenant)
        db.flush()  # get tenant.id before creating the admin user

        # Create first admin user for the tenant
        user_repo = UserRepository(db)
        if data.admin_email and user_repo.get_by_email(data.admin_email):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Email {data.admin_email} is already registered.",
            )

        if data.admin_email and data.admin_password:
            admin = User(
                full_name=data.admin_full_name or f"{data.name} Admin",
                email=data.admin_email,
                phone=None,
                hashed_password=hash_password(data.admin_password),
                role=UserRole.admin,
                status=UserStatus.active,
                is_verified=True,
                tenant_id=tenant.id,
            )
            db.add(admin)

        db.commit()
        db.refresh(tenant)
        return tenant

    # ------------------------------------------------------------------
    # Read
    # ------------------------------------------------------------------

    def get_all_tenants(
        self,
        db: Session,
        skip: int = 0,
        limit: int = 20,
        status: Optional[str] = None,
    ) -> tuple[list[Tenant], int]:
        repo = TenantRepository(db)
        if status:
            items = repo.get_by_status(status, skip=skip, limit=limit)
            total = db.query(Tenant).filter(Tenant.status == status).count()
        else:
            items = repo.get_all(skip=skip, limit=limit)
            total = repo.count()
        return items, total

    def get_tenant_by_id(self, db: Session, tenant_id: int) -> Tenant:
        repo = TenantRepository(db)
        tenant = repo.get_by_id(tenant_id)
        if not tenant:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Tenant {tenant_id} not found.",
            )
        return tenant

    # ------------------------------------------------------------------
    # Update
    # ------------------------------------------------------------------

    def update_tenant(
        self, db: Session, tenant_id: int, data: TenantUpdate
    ) -> Tenant:
        tenant = self.get_tenant_by_id(db, tenant_id)
        repo = TenantRepository(db)
        return repo.update(tenant, data)

    # ------------------------------------------------------------------
    # Lifecycle
    # ------------------------------------------------------------------

    def suspend_tenant(self, db: Session, tenant_id: int, reason: str) -> Tenant:
        tenant = self.get_tenant_by_id(db, tenant_id)
        if tenant.status == TenantStatus.suspended:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Tenant is already suspended.",
            )
        repo = TenantRepository(db)
        return repo.update_status(tenant_id, TenantStatus.suspended.value)

    def activate_tenant(self, db: Session, tenant_id: int) -> Tenant:
        tenant = self.get_tenant_by_id(db, tenant_id)
        repo = TenantRepository(db)
        return repo.update_status(tenant_id, TenantStatus.active.value)

    def delete_tenant(self, db: Session, tenant_id: int) -> None:
        tenant = self.get_tenant_by_id(db, tenant_id)
        repo = TenantRepository(db)
        repo.update_status(tenant_id, TenantStatus.cancelled.value)

    # ------------------------------------------------------------------
    # Stats
    # ------------------------------------------------------------------

    def get_tenant_overview(self, db: Session, tenant_id: int) -> dict:
        self.get_tenant_by_id(db, tenant_id)
        repo = TenantRepository(db)
        return repo.get_usage_stats(tenant_id)

    def get_platform_stats(self, db: Session) -> dict:
        from app.models.election import Election
        from app.models.vote import Vote

        total_tenants = db.query(Tenant).count()
        active_tenants = db.query(Tenant).filter(Tenant.status == TenantStatus.active).count()
        trial_tenants = db.query(Tenant).filter(Tenant.status == TenantStatus.trial).count()
        suspended_tenants = db.query(Tenant).filter(Tenant.status == TenantStatus.suspended).count()
        total_users = db.query(User).filter(User.tenant_id.isnot(None)).count()
        total_elections = db.query(Election).count()
        total_votes = db.query(Vote).count()

        return {
            "total_tenants": total_tenants,
            "active_tenants": active_tenants,
            "trial_tenants": trial_tenants,
            "suspended_tenants": suspended_tenants,
            "total_users": total_users,
            "total_elections": total_elections,
            "total_votes": total_votes,
        }

    def check_election_limit(self, db: Session, tenant_id: int) -> bool:
        from app.models.election import Election
        tenant = self.get_tenant_by_id(db, tenant_id)
        count = db.query(Election).filter(Election.tenant_id == tenant_id).count()
        return count < tenant.max_elections

    def check_voter_limit(self, db: Session, tenant_id: int) -> bool:
        tenant = self.get_tenant_by_id(db, tenant_id)
        count = (
            db.query(User)
            .filter(User.tenant_id == tenant_id, User.role == UserRole.voter)
            .count()
        )
        return count < tenant.max_voters


tenant_service = TenantService()
