"""
Authentication controller.

Provides the /api/v1/auth router with endpoints for registration, login,
OTP verification, token refresh, and current-user profile retrieval.
"""

from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import JSONResponse
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.config.database import get_db
from app.middlewares.auth_middleware import get_current_user, get_header_tenant_id
from app.models.user import User
from app.schemas.auth import (
    ForgotPasswordRequest,
    MessageResponse,
    OTPVerifyRequest,
    RegisterRequest,
    ResetPasswordRequest,
    TokenResponse,
)
from app.schemas.user import ChangePasswordRequest, UserResponse, UserSettingsUpdate
from app.services.auth_service import auth_service
from app.services.user_service import user_service
from app.utils.response import success_response

router = APIRouter(prefix="/auth", tags=["Authentication"])


# ---------------------------------------------------------------------------
# POST /register
# ---------------------------------------------------------------------------

@router.post(
    "/register",
    status_code=status.HTTP_201_CREATED,
    response_model=UserResponse,
    summary="Register a new internal member account",
)
def register(
    payload: RegisterRequest,
    header_tenant_id: Optional[int] = Depends(get_header_tenant_id),
    db: Session = Depends(get_db),
) -> JSONResponse:
    """
    Create a new internal member account.

    - Password is bcrypt-hashed before storage.
    - An OTP is generated and stored; in production it would be e-mailed to
      the user.
    - The account starts in ``pending`` status and ``is_verified=False``.
    - **Mobile clients** supply the tenant via the ``X-Tenant-ID`` header;
      ``payload.tenant_id`` (if set) takes precedence.
    """
    user: User = auth_service.register(db, payload, tenant_id=header_tenant_id)
    return success_response(
        data=UserResponse.model_validate(user).model_dump(mode="json"),
        message="Registration successful. Please verify your email with the OTP.",
        status_code=status.HTTP_201_CREATED
    )


# ---------------------------------------------------------------------------
# POST /login
# ---------------------------------------------------------------------------

@router.post(
    "/login",
    response_model=TokenResponse,
    summary="Log in and receive a JWT access token",
)
def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    header_tenant_id: Optional[int] = Depends(get_header_tenant_id),
    db: Session = Depends(get_db),
) -> JSONResponse:
    """
    Authenticate with email (``username`` field) and password.

    Returns a JWT access token and basic user information on success.
    Raises 401 for invalid credentials, 403 if the account is pending.
    """
    token_data = auth_service.login(
        db, 
        form_data.username, 
        form_data.password,
        header_tenant_id=header_tenant_id
    )
    return success_response(
        data=token_data.model_dump(mode="json"),
        message="Login successful"
    )


# ---------------------------------------------------------------------------
# POST /verify-otp
# ---------------------------------------------------------------------------

@router.post(
    "/verify-otp",
    response_model=TokenResponse,
    summary="Verify email address via OTP",
)
def verify_otp(
    payload: OTPVerifyRequest,
    db: Session = Depends(get_db),
) -> JSONResponse:
    """
    Verify a user's email address by submitting the OTP that was generated
    during registration.

    On success the account's ``is_verified`` flag is set to ``True`` and
    the OTP fields are cleared.
    
    Returns JWT tokens to log the user in immediately.
    """
    token_data = auth_service.verify_otp(db, payload.email, payload.otp_code)
    return success_response(
        data=token_data.model_dump(mode="json"),
        message="Email verified and logged in successfully."
    )


# ---------------------------------------------------------------------------
# POST /forgot-password
# ---------------------------------------------------------------------------

@router.post(
    "/forgot-password",
    response_model=MessageResponse,
    summary="Request a password reset OTP",
)
def forgot_password(
    payload: ForgotPasswordRequest,
    db: Session = Depends(get_db),
) -> MessageResponse:
    """
    Send a password reset OTP to the user's registered email address.
    Always returns a success message to prevent user enumeration.
    """
    auth_service.forgot_password(db, payload.email)
    return MessageResponse(
        message="If an account exists for this email, a password reset OTP has been sent."
    )


# ---------------------------------------------------------------------------
# POST /reset-password
# ---------------------------------------------------------------------------

@router.post(
    "/reset-password",
    response_model=MessageResponse,
    summary="Reset password using OTP",
)
def reset_password(
    payload: ResetPasswordRequest,
    db: Session = Depends(get_db),
) -> MessageResponse:
    """
    Verify the OTP and update the user's password.
    """
    auth_service.reset_password(
        db, 
        payload.email, 
        payload.otp_code, 
        payload.new_password
    )
    return MessageResponse(message="Password has been reset successfully.")


# ---------------------------------------------------------------------------
# POST /refresh-token
# ---------------------------------------------------------------------------

@router.post(
    "/refresh-token",
    response_model=TokenResponse,
    summary="Exchange a refresh token for a new access token",
)
def refresh_token(
    payload: dict,
    db: Session = Depends(get_db),
) -> TokenResponse:
    """
    Accept a refresh token in the request body under the key ``refresh_token``
    and return a new access token.
    """
    token: str | None = payload.get("refresh_token")
    if not token:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="refresh_token is required.",
        )
    return auth_service.refresh_token(db, token)


# ---------------------------------------------------------------------------
# GET /me
# ---------------------------------------------------------------------------

@router.get(
    "/me",
    summary="Retrieve the currently authenticated user's profile",
)
def get_me(
    current_user: User = Depends(get_current_user),
) -> JSONResponse:
    """
    Return the full profile of the authenticated user.

    Requires a valid Bearer token in the ``Authorization`` header.
    """
    return success_response(
        data=UserResponse.model_validate(current_user).model_dump(mode="json"),
        message="Profile retrieved."
    )


# ---------------------------------------------------------------------------
# PUT /me
# ---------------------------------------------------------------------------

@router.put(
    "/me",
    summary="Update the currently authenticated user's settings",
)
def update_me(
    payload: UserSettingsUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> JSONResponse:
    """
    Update self-service profile settings for the authenticated user.

    Email, role, status, tenant, and verification flags are not accepted here.
    """
    updated = user_service.update_own_settings(db, current_user.id, payload)
    return success_response(
        data=UserResponse.model_validate(updated).model_dump(mode="json"),
        message="Profile updated successfully."
    )


# ---------------------------------------------------------------------------
# PUT /me/password
# ---------------------------------------------------------------------------

@router.put(
    "/me/password",
    response_model=MessageResponse,
    summary="Change the currently authenticated user's password",
)
def change_my_password(
    payload: ChangePasswordRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> MessageResponse:
    """
    Change the authenticated user's password after verifying the current one.
    """
    user_service.change_password(
        db,
        current_user.id,
        payload.current_password,
        payload.new_password,
    )
    return MessageResponse(message="Password updated successfully.")
