"""
Tenant service — SaaS multi-tenancy orchestration.

Single Responsibility: All tenant lifecycle logic lives here.
Dependency Inversion: Depends on TenantRepository and UserRepository abstractions.
"""

import re
from datetime import datetime, timezone
from typing import Optional

from fastapi import HTTPException, status, UploadFile
from sqlalchemy.orm import Session

from app.models.tenant import Tenant, TenantStatus
from app.models.user import User, UserRole, UserStatus
from app.repositories.tenant_repository import TenantRepository
from app.repositories.user_repository import UserRepository
from app.schemas.tenant import TenantCreate, TenantUpdate
from app.utils.security import generate_otp, hash_password
from app.utils.uploads import delete_uploaded_file, save_uploaded_image


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
    , logo: UploadFile | None = None) -> Tenant:
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
            contact_phone=data.contact_phone,
            plan=data.plan or "starter",
            logo_url=data.logo_url,
            primary_color=getattr(data, 'primary_color', None) or "#0051D5",
            max_elections=max_e,
            max_voters=max_v,
            status=TenantStatus.draft,
            created_by=created_by,
        )
        db.add(tenant)
        db.flush()  # get tenant.id before creating the admin user

        # If a logo file was uploaded, save it and update tenant.logo_url
        if logo is not None:
            tenant.logo_url = save_uploaded_image(
                logo,
                subdir="",
                filename_prefix=f"tenant_{tenant.id}",
            )
            db.add(tenant)
            db.commit()
            db.refresh(tenant)

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
    , logo: UploadFile | None = None) -> Tenant:
        tenant = self.get_tenant_by_id(db, tenant_id)
        repo = TenantRepository(db)
        update_dict = data.model_dump(exclude_unset=True)
        if "plan" in update_dict:
            plan_limits = {
                "starter": (5, 1000),
                "professional": (25, 10000),
                "enterprise": (999999, 99999999),
            }
            max_e, max_v = plan_limits.get(update_dict["plan"], (5, 1000))
            update_dict["max_elections"] = max_e
            update_dict["max_voters"] = max_v
        # handle uploaded logo if provided — save file and include in update dict
        if logo is not None:
            served_path = save_uploaded_image(
                logo,
                subdir="",
                filename_prefix=f"tenant_{tenant.id}",
            )
            delete_uploaded_file(tenant.logo_url)
            update_dict["logo_url"] = served_path

        return repo.update(tenant, update_dict)

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
        from app.models.election import Election, ElectionStatus
        from app.models.vote import Vote
        from app.models.candidate import Candidate
        from app.models.candidate_committee import CandidateCommittee
        from app.models.audit_log import AuditLog
        from app.models.target import Target

        total_tenants = db.query(Tenant).count()
        active_tenants = db.query(Tenant).filter(Tenant.status == TenantStatus.active).count()
        draft_tenants = db.query(Tenant).filter(Tenant.status == TenantStatus.draft).count()
        suspended_tenants = db.query(Tenant).filter(Tenant.status == TenantStatus.suspended).count()

        total_users = db.query(User).filter(User.tenant_id.isnot(None)).count()
        pending_users = db.query(User).filter(User.status == UserStatus.pending).count()

        total_elections = db.query(Election).count()
        active_elections = db.query(Election).filter(Election.status == ElectionStatus.active).count()
        draft_elections = db.query(Election).filter(Election.status == ElectionStatus.draft).count()
        closed_elections = db.query(Election).filter(Election.status == ElectionStatus.closed).count()

        total_votes = db.query(Vote).count()
        total_candidates = db.query(Candidate).count()
        total_committees = db.query(CandidateCommittee).count()
        total_political_committees = db.query(Target).count()

        # Recent activity (last 10 audit logs)
        logs = (
            db.query(AuditLog, User.full_name, Tenant.name)
            .outerjoin(User, AuditLog.user_id == User.id)
            .outerjoin(Tenant, AuditLog.tenant_id == Tenant.id)
            .order_by(AuditLog.created_at.desc())
            .limit(10)
            .all()
        )

        recent_activity = []
        for log, user_name, tenant_name in logs:
            recent_activity.append({
                "id": log.id,
                "action": log.action,
                "entity_type": log.entity_type,
                "details": log.details,
                "user_name": user_name or "System",
                "tenant_name": tenant_name or "Platform",
                "created_at": log.created_at.isoformat(),
                "ip_address": log.ip_address
            })

        # Recent elections (last 10)
        elections_logs = (
            db.query(Election, Tenant.name)
            .join(Tenant, Election.tenant_id == Tenant.id)
            .order_by(Election.created_at.desc())
            .limit(10)
            .all()
        )

        recent_elections = []
        for election, tenant_name in elections_logs:
            recent_elections.append({
                "id": election.id,
                "title": election.title,
                "status": election.status,
                "tenant_name": tenant_name,
                "created_at": election.created_at.isoformat(),
                "start_date": election.start_date.isoformat(),
                "end_date": election.end_date.isoformat(),
            })

        return {
            "total_tenants": total_tenants,
            "active_tenants": active_tenants,
            "draft_tenants": draft_tenants,
            "suspended_tenants": suspended_tenants,
            "total_users": total_users,
            "pending_users": pending_users,
            "total_elections": total_elections,
            "active_elections": active_elections,
            "draft_elections": draft_elections,
            "closed_elections": closed_elections,
            "total_votes": total_votes,
            "total_candidates": total_candidates,
            "total_committees": total_committees,
            "total_political_committees": total_political_committees,
            "recent_activity": recent_activity,
            "recent_elections": recent_elections,
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
