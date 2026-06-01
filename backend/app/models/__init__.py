# Re-export every ORM model so that:
#   1. Alembic's env.py can import Base and discover all tables via
#      ``from app.models import Base``  (after importing this package).
#   2. Application code can do ``from app.models import User`` comfortably.

from app.config.database import Base                                         # noqa: F401
from app.models.tenant import Tenant, TenantStatus, TenantPlan               # noqa: F401
from app.models.user import User, UserRole, UserStatus                       # noqa: F401
from app.models.election import Election, ElectionStatus                    # noqa: F401
from app.models.target import Target, TargetType                            # noqa: F401
from app.models.candidate_committee import CandidateCommittee                # noqa: F401
from app.models.candidate import Candidate                                  # noqa: F401
from app.models.nomination import Nomination, NominationStatus              # noqa: F401
from app.models.announcement import Announcement, AnnouncementStatus        # noqa: F401
from app.models.vote import Vote                                            # noqa: F401
from app.models.payment import Payment, PaymentStatus                       # noqa: F401
from app.models.plan import Plan                                           # noqa: F401
from app.models.audit_log import AuditLog                                   # noqa: F401

__all__ = [
    "Base",
    "Tenant",
    "TenantStatus",
    "TenantPlan",
    "User",
    "UserRole",
    "UserStatus",
    "Election",
    "ElectionStatus",
    "Target",
    "TargetType",
    "CandidateCommittee",
    "Candidate",
    "Nomination",
    "NominationStatus",
    "Announcement",
    "AnnouncementStatus",
    "Vote",
    "Payment",
    "PaymentStatus",
    "Plan",
    "AuditLog",
]
