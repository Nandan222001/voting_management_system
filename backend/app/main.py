"""
Digital Voting System — FastAPI application entry point.

Wires together all routers, middleware, and startup/shutdown hooks.
"""

from contextlib import asynccontextmanager

from fastapi import FastAPI
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
from app.controllers.vote_controller import router as vote_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Import all models so SQLAlchemy registers them before create_all
    import app.models  # noqa: F401
    Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(
    title="Digital Voting System API",
    description=(
        "Secure • Transparent • Reliable — Multi-tenant SaaS voting platform.\n\n"
        "**Roles:** `superadmin` (platform), `admin` (tenant), `voter`\n\n"
        "**Default SuperAdmin:** superadmin@techElect.com / Super@Admin123\n\n"
        "**Default Tenant Admin:** admin@voting.com / Admin@123"
    ),
    version="2.0.0",
    lifespan=lifespan,
)

# ---------------------------------------------------------------------------
# CORS — allow all origins in development; restrict in production via env
# ---------------------------------------------------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Routers
# ---------------------------------------------------------------------------
# app.include_router(auth_router)
# app.include_router(tenant_router)   # SuperAdmin — platform management
# app.include_router(user_router)
# app.include_router(election_router)
# app.include_router(candidate_router)
# app.include_router(vote_router)
# app.include_router(report_router)
app.include_router(auth_router, prefix="/api/v1")
app.include_router(tenant_router, prefix="/api/v1")
app.include_router(user_router, prefix="/api/v1")
app.include_router(election_router, prefix="/api/v1")
app.include_router(candidate_router, prefix="/api/v1")
app.include_router(candidate_committee_router, prefix="/api/v1")
app.include_router(target_router, prefix="/api/v1")
app.include_router(vote_router, prefix="/api/v1")
app.include_router(report_router, prefix="/api/v1")

# Serve uploaded static files (tenant logos etc.)
app.mount("/static", StaticFiles(directory="./static"), name="static")


# ---------------------------------------------------------------------------
# Health check
# ---------------------------------------------------------------------------
@app.get("/", tags=["Health"])
def health_check():
    return {"status": "ok", "app": "Digital Voting System", "version": "2.0.0"}
