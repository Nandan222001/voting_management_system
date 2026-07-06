"""
Digital Voting System — FastAPI application entry point.

Wires together all routers, middleware, and startup/shutdown hooks.
"""

from contextlib import asynccontextmanager

from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.config.database import Base, engine
from app.controllers.auth_controller import router as auth_router
from app.controllers.candidate_controller import router as candidate_router
from app.controllers.candidate_committee_controller import router as candidate_committee_router
from app.controllers.election_controller import router as election_router
from app.controllers.report_controller import router as report_router
from app.controllers.target_controller import router as target_router
from app.controllers.tenant_controller import router as tenant_router
from app.controllers.user_controller import router as user_router
from app.controllers.vote_controller import router as vote_router, voting_router
from app.controllers.payment_controller import router as payment_router, webhook_router as payment_webhook_router
from app.controllers.plan_controller import router as plan_router
from app.controllers.media_controller import router as media_router
from app.controllers.nomination_controller import router as nomination_router
from app.controllers.announcement_controller import router as announcement_router
from app.controllers.notification_controller import router as notification_router
from app.controllers.event_controller import router as event_router
from app.middlewares.auth_middleware import verify_tenant_header
from app.utils.uploads import MOBILE_ASSETS_IMAGES_ROOT, STATIC_ROOT


# app.main.py

app = FastAPI(
    title="Digital Voting System API",
    description=(
        "Secure • Transparent • Reliable — Multi-tenant SaaS voting platform.\n\n"
        "**Roles:** `superadmin` (platform), `admin` (tenant), `voter`\n\n"
        "**Default SuperAdmin:** superadmin@techElect.com / Super@Admin123\n\n"
        "**Default Tenant Admin:** admin@voting.com / Admin@123"
    ),
    version="2.0.0",
)

# ---------------------------------------------------------------------------
# CORS — allow all origins in development for mobile/web accessibility
# ---------------------------------------------------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "*",  # Allow all origins for development
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Routers
# ---------------------------------------------------------------------------
# Applying verify_tenant_header globally to all API routes (header is optional where not needed)
common_dependencies = [Depends(verify_tenant_header)]

app.include_router(auth_router, prefix="/api/v1", dependencies=common_dependencies)
app.include_router(tenant_router, prefix="/api/v1", dependencies=common_dependencies)
app.include_router(user_router, prefix="/api/v1", dependencies=common_dependencies)
app.include_router(election_router, prefix="/api/v1", dependencies=common_dependencies)
app.include_router(candidate_router, prefix="/api/v1", dependencies=common_dependencies)
app.include_router(nomination_router, prefix="/api/v1", dependencies=common_dependencies)
app.include_router(announcement_router, prefix="/api/v1", dependencies=common_dependencies)
app.include_router(notification_router, prefix="/api/v1", dependencies=common_dependencies)
app.include_router(event_router, prefix="/api/v1", dependencies=common_dependencies)
app.include_router(candidate_committee_router, prefix="/api/v1", dependencies=common_dependencies)
app.include_router(target_router, prefix="/api/v1", dependencies=common_dependencies)
app.include_router(vote_router, prefix="/api/v1", dependencies=common_dependencies)
app.include_router(voting_router, prefix="/api/v1", dependencies=common_dependencies)
app.include_router(payment_router, prefix="/api/v1", dependencies=common_dependencies)
# Webhook router has NO common_dependencies — Razorpay servers don't send X-Tenant-ID
app.include_router(payment_webhook_router, prefix="/api/v1")
app.include_router(plan_router, prefix="/api/v1", dependencies=common_dependencies)
app.include_router(media_router, prefix="/api/v1", dependencies=common_dependencies)
app.include_router(report_router, prefix="/api/v1", dependencies=common_dependencies)

# Serve uploaded static files from an absolute path so it works regardless of
# the process working directory.
STATIC_ROOT.mkdir(parents=True, exist_ok=True)
app.mount("/static", StaticFiles(directory=str(STATIC_ROOT)), name="static")
MOBILE_ASSETS_IMAGES_ROOT.mkdir(parents=True, exist_ok=True)
app.mount(
    "/mobile-assets/images",
    StaticFiles(directory=str(MOBILE_ASSETS_IMAGES_ROOT)),
    name="mobile-assets-images",
)


# ---------------------------------------------------------------------------
# Health check
# ---------------------------------------------------------------------------
@app.get("/", tags=["Health"])
def health_check():
    return {"status": "ok", "app": "Digital Voting System", "version": "2.0.0"}
