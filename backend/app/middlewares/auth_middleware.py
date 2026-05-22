"""
Authentication middleware / FastAPI dependencies.

Single Responsibility: Provides reusable FastAPI ``Depends`` callables that
validate JWT tokens and enforce role-based access control (RBAC).

Roles
-----
* ``superadmin`` — platform-level administrator with cross-tenant access.
* ``admin``      — tenant-level administrator; can manage their own tenant.
* ``voter``      — end-user who participates in elections within a tenant.
"""

from typing import Optional

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError
from sqlalchemy.orm import Session

from app.config.database import get_db
from app.models.user import User, UserRole
from app.utils.security import decode_token

# ---------------------------------------------------------------------------
# OAuth2 schemes
# ---------------------------------------------------------------------------

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")

# A variant that returns ``None`` instead of raising 401 when no token is
# present; used by endpoints that are publicly accessible but optionally
# tenant-scoped when the caller is authenticated.
oauth2_scheme_optional = OAuth2PasswordBearer(
    tokenUrl="/api/v1/auth/login",
    auto_error=False,
)


# ---------------------------------------------------------------------------
# Base dependency — token decoding + user resolution
# ---------------------------------------------------------------------------


def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> User:
    """
    Decode the Bearer JWT and return the authenticated ``User`` instance.

    Args:
        token: JWT access token extracted from the ``Authorization`` header.
        db:    Database session provided by :func:`app.config.database.get_db`.

    Returns:
        The authenticated :class:`app.models.user.User` ORM instance.

    Raises:
        HTTPException(401): If the token is missing, malformed, expired, or
                            the referenced user does not exist.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        payload = decode_token(token)
        user_id: int | None = payload.get("sub")
        token_type: str | None = payload.get("type")

        if user_id is None or token_type != "access":
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    user: User | None = db.query(User).filter(User.id == int(user_id)).first()
    if user is None:
        raise credentials_exception

    if not user.is_verified:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Account email not verified",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return user


# ---------------------------------------------------------------------------
# Role-enforcement dependencies
# ---------------------------------------------------------------------------


def require_admin(current_user: User = Depends(get_current_user)) -> User:
    """
    Assert that the caller has ``admin`` OR ``superadmin`` role.

    Both tenant admins and the platform superadmin are permitted to perform
    admin-level operations within a tenant context.

    Args:
        current_user: The authenticated user provided by
                      :func:`get_current_user`.

    Returns:
        The same ``User`` instance, guaranteed to have an admin-level role.

    Raises:
        HTTPException(403): If the authenticated user is a plain ``voter``.
    """
    if current_user.role not in (UserRole.admin, UserRole.superadmin):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin privileges required",
        )
    return current_user


def require_superadmin(current_user: User = Depends(get_current_user)) -> User:
    """
    Assert that the caller has the ``superadmin`` role.

    This dependency guards platform-level operations (tenant management,
    global statistics) that must not be accessible to ordinary tenant admins.

    Args:
        current_user: The authenticated user provided by
                      :func:`get_current_user`.

    Returns:
        The same ``User`` instance, guaranteed to have ``role == superadmin``.

    Raises:
        HTTPException(403): If the authenticated user is not a superadmin.
    """
    if current_user.role != UserRole.superadmin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Superadmin privileges required",
        )
    return current_user


def require_tenant_admin(current_user: User = Depends(get_current_user)) -> User:
    """
    Assert that the caller has ``admin`` OR ``superadmin`` role.

    Semantically equivalent to :func:`require_admin` but named for clarity
    at call sites where the intention is explicitly tenant-administration.

    Args:
        current_user: The authenticated user provided by
                      :func:`get_current_user`.

    Returns:
        The same ``User`` instance, guaranteed to have an admin-level role.

    Raises:
        HTTPException(403): If the authenticated user's role is ``voter``.
    """
    if current_user.role not in (UserRole.admin, UserRole.superadmin):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Tenant admin privileges required",
        )
    return current_user


# ---------------------------------------------------------------------------
# Tenant context helper
# ---------------------------------------------------------------------------


def get_tenant_context(
    current_user: User = Depends(get_current_user),
) -> Optional[int]:
    """
    Extract the tenant scope from the authenticated user.

    * For ``admin`` and ``voter`` roles this is the ``tenant_id`` stored on
      the user record (always non-``None`` for properly provisioned accounts).
    * For ``superadmin`` this returns ``None`` — superadmins operate
      cross-tenant and must pass a ``tenant_id`` explicitly through the
      request (path parameter or query parameter).

    Args:
        current_user: The authenticated user provided by
                      :func:`get_current_user`.

    Returns:
        The integer ``tenant_id`` for tenant-scoped users, or ``None`` for
        superadmins.
    """
    if current_user.role == UserRole.superadmin:
        return None
    return current_user.tenant_id
