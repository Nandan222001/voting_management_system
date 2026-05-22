"""
Authentication middleware / FastAPI dependencies.

Single Responsibility: Provides reusable FastAPI ``Depends`` callables that
validate JWT tokens and enforce role-based access control (RBAC).
"""

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError
from sqlalchemy.orm import Session

from app.config.database import get_db
from app.models.user import User, UserRole
from app.utils.security import decode_token

# ---------------------------------------------------------------------------
# OAuth2 scheme
# ---------------------------------------------------------------------------

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")


# ---------------------------------------------------------------------------
# Dependencies
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


def require_admin(current_user: User = Depends(get_current_user)) -> User:
    """
    Extend :func:`get_current_user` by asserting that the caller is an admin.

    Args:
        current_user: The authenticated user provided by
                      :func:`get_current_user`.

    Returns:
        The same ``User`` instance, guaranteed to have ``role == admin``.

    Raises:
        HTTPException(403): If the authenticated user is not an admin.
    """
    if current_user.role != UserRole.admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin privileges required",
        )
    return current_user
