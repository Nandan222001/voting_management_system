"""
Authentication service.

Single Responsibility: Handles all authentication workflows — registration,
login, OTP verification, token refresh, and current-user resolution.

Dependency Inversion: Depends on ``UserRepository`` (an abstraction) and the
security utilities rather than on raw SQLAlchemy or Jose calls.
"""

from datetime import datetime, timedelta, timezone
from typing import Optional

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.user import User, UserRole, UserStatus
from app.repositories.user_repository import UserRepository
from app.repositories.tenant_repository import TenantRepository
from app.schemas.auth import AuthUserInfo, RegisterRequest, TokenResponse
from app.utils.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    generate_otp,
    hash_password,
    verify_password,
)
from app.utils.email import send_otp_email, send_registration_otp_email

# OTP is valid for 10 minutes by default.
_OTP_TTL_MINUTES: int = 10


class AuthService:
    """
    Orchestrates authentication use-cases.

    All methods accept an active ``Session`` rather than creating one
    internally, keeping transaction control in the caller's hands
    (Dependency Inversion / Interface Segregation).
    """

    # ------------------------------------------------------------------
    # Registration
    # ------------------------------------------------------------------

    def register(
        self,
        db: Session,
        register_data: RegisterRequest,
        tenant_id: Optional[int] = None,
    ) -> User:
        """
        Create a new internal member account.

        - Hashes the password before persistence.
        - Generates and stores an OTP for e-mail verification.
        - New accounts start with ``status=pending`` and ``is_verified=False``.
        - When *tenant_id* is provided the user is associated with that tenant;
          the tenant must exist and must not have exceeded its member limit.

        Args:
            db:            Active database session.
            register_data: Validated registration payload.
            tenant_id:     Optional tenant to assign the new user to.

        Returns:
            The newly created ``User`` ORM instance.

        Raises:
            HTTPException 404: If the specified tenant does not exist.
            HTTPException 402: If the tenant's voter limit has been exceeded.
            HTTPException 409: If the e-mail address is already registered.
        """
        repo = UserRepository(db)

        # Normalize email to lowercase for consistent storage and lookup
        normalized_email = register_data.email.lower()

        # Resolve tenant_id — prefer the value carried in the request body,
        # then fall back to the parameter (caller override).
        resolved_tenant_id: Optional[int] = (
            register_data.tenant_id if register_data.tenant_id is not None else tenant_id
        )

        if resolved_tenant_id is not None:
            tenant_repo = TenantRepository(db)
            tenant = tenant_repo.get_by_id(resolved_tenant_id)
            if tenant is None:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Tenant with id={resolved_tenant_id} not found.",
                )
            # Enforce member limit. The underlying tenant column is still named
            # max_voters for migration compatibility.
            from app.models.user import UserRole as _Role
            current_voter_count = (
                db.query(User)
                .filter(User.tenant_id == resolved_tenant_id, User.role == _Role.voter)
                .count()
            )
            if current_voter_count >= tenant.max_voters:
                raise HTTPException(
                    status_code=status.HTTP_402_PAYMENT_REQUIRED,
                    detail=(
                        f"Voter limit of {tenant.max_voters} has been reached "
                        "for this organisation. Please upgrade your plan."
                    ),
                )

        if repo.get_by_email(normalized_email):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="A user with this email address already exists.",
            )

        otp = generate_otp()
        otp_expires = datetime.now(timezone.utc) + timedelta(minutes=_OTP_TTL_MINUTES)

        user = User(
            full_name=register_data.full_name,
            email=normalized_email,
            phone=register_data.phone,
            date_of_birth=register_data.date_of_birth,
            gender=register_data.gender,
            parent_name=register_data.parent_name,
            voter_id=register_data.voter_id,
            designation=register_data.designation,
            
            # KYC
            kyc_type=register_data.kyc_type,
            kyc_front_url=register_data.kyc_front_url,
            kyc_back_url=register_data.kyc_back_url,

            # Address (Permanent)
            house_number=register_data.house_number,
            street_address=register_data.street_address,
            village=register_data.village,
            landmark=register_data.landmark,
            pincode=register_data.pincode,
            city=register_data.city,
            taluka=register_data.taluka,
            district=register_data.district,
            state=register_data.state,
            country=register_data.country,

            # Current Address
            current_street_address=register_data.current_street_address,
            current_city=register_data.current_city,
            current_district=register_data.current_district,
            current_state=register_data.current_state,
            current_pincode=register_data.current_pincode,

            # Mapping
            target_id=register_data.target_id,
            committee_id=register_data.committee_id,
            membership_plan_id=register_data.membership_plan_id,

            hashed_password=hash_password(register_data.password),
            role=UserRole.voter,
            status=UserStatus.pending,
            is_verified=False,
            otp_code=otp,
            otp_expires_at=otp_expires,
            tenant_id=resolved_tenant_id,
        )
        db.add(user)
        db.commit()
        db.refresh(user)

        # Send verification email
        send_registration_otp_email(user.email, otp)

        return user

    # ------------------------------------------------------------------
    # Login
    # ------------------------------------------------------------------

    def login(
        self, 
        db: Session, 
        email: str, 
        password: str,
        header_tenant_id: Optional[int] = None
    ) -> TokenResponse:
        """
        Authenticate a user and issue JWT tokens.

        Args:
            db:               Active database session.
            email:            Submitted e-mail address.
            password:         Plain-text password.
            header_tenant_id: Optional tenant ID from X-Tenant-ID header.

        Returns:
            A :class:`~app.schemas.auth.TokenResponse` containing the
            access token and basic user info.

        Raises:
            HTTPException 401: If credentials are invalid or account is blocked.
            HTTPException 403: If the account is pending admin approval,
                               tenant is suspended, or tenant mismatch.
        """
        repo = UserRepository(db)
        # Email is normalized to lowercase in get_by_email for case-insensitive lookup
        print(f"DEBUG: Attempting login for email: {email}")
        user: Optional[User] = repo.get_by_email(email)

        if user is None or not verify_password(password, user.hashed_password):
            print(f"DEBUG: Login failed for {email} - invalid credentials")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password.",
            )

        print(f"DEBUG: User found: {user.id}, role: {user.role}, tenant_id: {user.tenant_id}")

        if user.status == UserStatus.blocked:
            print(f"DEBUG: Login blocked for {email} - status: blocked")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Your account has been blocked. Contact an administrator.",
            )

        # Removed is_verified and pending checks to allow frontend to evaluate status.


        # Tenant Validation: If X-Tenant-ID was provided (mobile), ensure user belongs to it.
        # Superadmins are exempt as they are global.
        if header_tenant_id is not None and user.role != UserRole.superadmin:
            if user.tenant_id != header_tenant_id:
                print(f"DEBUG: Login blocked for {email} - tenant mismatch (User: {user.tenant_id}, Header: {header_tenant_id})")
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="You do not have access to this organisation.",
                )

        # Check whether the user's tenant is active.
        if user.tenant_id is not None:
            tenant_repo = TenantRepository(db)
            tenant = tenant_repo.get_by_id(user.tenant_id)
            if tenant is not None:
                if tenant.status.value == "suspended":
                    print(f"DEBUG: Login blocked for {email} - tenant suspended")
                    raise HTTPException(
                        status_code=status.HTTP_403_FORBIDDEN,
                        detail="Your organisation's account has been suspended.",
                    )
                if tenant.status.value in ("draft", "cancelled"):
                    print(f"DEBUG: Login blocked for {email} - tenant status: {tenant.status.value}")
                    raise HTTPException(
                        status_code=status.HTTP_403_FORBIDDEN,
                        detail=f"Your organisation's account is {tenant.status.value}.",
                    )

        print(f"DEBUG: Creating tokens for user {user.id}")
        token_payload = {
            "sub": str(user.id),
            "role": user.role.value,
            "tenant_id": user.tenant_id,
            "district": user.district,
            "designation": user.designation,
        }
        access_token = create_access_token(token_payload)
        refresh_token = create_refresh_token(token_payload)

        print(f"DEBUG: Tokens created. Validating user schema...")
        try:
            auth_user_info = AuthUserInfo.model_validate(user)
            print(f"DEBUG: Schema validation successful for user {user.id}")
        except Exception as e:
            print(f"DEBUG: Schema validation FAILED for user {user.id}: {str(e)}")
            raise e

        return TokenResponse(
            access_token=access_token,
            token_type="bearer",
            user=auth_user_info,
        )

    # ------------------------------------------------------------------
    # OTP verification
    # ------------------------------------------------------------------

    def verify_otp(self, db: Session, email: str, otp: str) -> TokenResponse:
        """
        Verify an OTP code for the given e-mail address and mark the user
        as verified on success.

        Args:
            db:    Active database session.
            email: E-mail address of the user attempting verification.
            otp:   The OTP code submitted by the user.

        Returns:
            A TokenResponse if verification succeeded.

        Raises:
            HTTPException 404: If no user exists for the supplied e-mail.
            HTTPException 400: If the OTP is missing, expired, or incorrect.
        """
        repo = UserRepository(db)
        user: Optional[User] = repo.get_by_email(email)

        if user is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found.",
            )

        if not user.otp_code or not user.otp_expires_at:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No pending OTP for this account.",
            )

        # Make both sides timezone-aware for a safe comparison.
        now = datetime.now(timezone.utc)
        expires = (
            user.otp_expires_at.replace(tzinfo=timezone.utc)
            if user.otp_expires_at.tzinfo is None
            else user.otp_expires_at
        )

        if now > expires:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="OTP has expired. Please request a new one.",
            )

        if user.otp_code != otp:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid OTP code.",
            )

        # Mark as verified and clear the OTP fields.
        user.is_verified = True
        user.otp_code = None
        user.otp_expires_at = None
        
        # New: If the user is a voter, activate them automatically upon verification
        # (Assuming registration sets them to pending)
        if user.role == UserRole.voter:
            user.status = UserStatus.active

        db.commit()
        db.refresh(user)

        # Issue tokens so the user is logged in immediately
        token_payload = {
            "sub": str(user.id),
            "role": user.role.value,
            "tenant_id": user.tenant_id,
            "district": user.district,
            "designation": user.designation,
        }
        access_token = create_access_token(token_payload)
        refresh_token = create_refresh_token(token_payload)

        return TokenResponse(
            access_token=access_token,
            token_type="bearer",
            user=AuthUserInfo.model_validate(user),
        )

    # ------------------------------------------------------------------
    # Forgot Password
    # ------------------------------------------------------------------

    def forgot_password(self, db: Session, email: str) -> bool:
        """
        Generate a password reset OTP and email it to the user.

        Args:
            db:    Active database session.
            email: User's registered e-mail address.

        Returns:
            Always returns True to avoid leaking whether an email exists.
        """
        repo = UserRepository(db)
        user: Optional[User] = repo.get_by_email(email)

        if user:
            otp = generate_otp()
            otp_expires = datetime.now(timezone.utc) + timedelta(minutes=_OTP_TTL_MINUTES)
            
            user.otp_code = otp
            user.otp_expires_at = otp_expires
            db.commit()
            
            # Send the OTP via email
            send_otp_email(user.email, otp)
        
        return True

    # ------------------------------------------------------------------
    # Reset Password
    # ------------------------------------------------------------------

    def reset_password(self, db: Session, email: str, otp: str, new_password: str) -> bool:
        """
        Verify the OTP and update the user's password.

        Args:
            db:           Active database session.
            email:        User's registered e-mail address.
            otp:          The OTP code submitted.
            new_password: The new password to set.

        Returns:
            True if reset succeeded.

        Raises:
            HTTPException 404: If user not found.
            HTTPException 400: If OTP is invalid or expired.
        """
        repo = UserRepository(db)
        user: Optional[User] = repo.get_by_email(email)

        if user is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found.",
            )

        if not user.otp_code or not user.otp_expires_at:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No pending password reset request.",
            )

        now = datetime.now(timezone.utc)
        expires = (
            user.otp_expires_at.replace(tzinfo=timezone.utc)
            if user.otp_expires_at.tzinfo is None
            else user.otp_expires_at
        )

        if now > expires:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="OTP has expired. Please request a new one.",
            )

        if user.otp_code != otp:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid OTP code.",
            )

        # Update password and clear OTP fields
        user.hashed_password = hash_password(new_password)
        user.otp_code = None
        user.otp_expires_at = None
        
        # Also ensure user is marked as verified if they reset their password
        user.is_verified = True
        
        db.commit()
        return True

    # ------------------------------------------------------------------
    # Token refresh
    # ------------------------------------------------------------------

    def refresh_token(self, db: Session, token: str) -> TokenResponse:
        """
        Issue a new access token given a valid refresh token.

        Args:
            db:    Active database session.
            token: The refresh JWT string.

        Returns:
            A new :class:`~app.schemas.auth.TokenResponse`.

        Raises:
            HTTPException 401: If the token is invalid, expired, or not a
                               refresh token.
            HTTPException 404: If the referenced user no longer exists.
        """
        from jose import JWTError

        try:
            payload = decode_token(token)
        except JWTError:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired refresh token.",
            )

        if payload.get("type") != "refresh":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token is not a refresh token.",
            )

        user_id: Optional[str] = payload.get("sub")
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Malformed token: missing subject.",
            )

        repo = UserRepository(db)
        user: Optional[User] = repo.get_by_id(int(user_id))

        if user is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found.",
            )

        token_payload = {
            "sub": str(user.id),
            "role": user.role.value,
            "tenant_id": user.tenant_id,
            "district": user.district,
            "designation": user.designation,
        }
        new_access_token = create_access_token(token_payload)

        return TokenResponse(
            access_token=new_access_token,
            token_type="bearer",
            user=AuthUserInfo.model_validate(user),
        )

    # ------------------------------------------------------------------
    # Current-user resolution
    # ------------------------------------------------------------------

    def get_current_user(self, db: Session, token: str) -> User:
        """
        Decode a JWT access token and return the corresponding ``User``.

        Args:
            db:    Active database session.
            token: Bearer access token extracted from the ``Authorization``
                   header.

        Returns:
            The authenticated ``User`` ORM instance.

        Raises:
            HTTPException 401: If the token is invalid, expired, or the user
                               cannot be found / is inactive.
        """
        from jose import JWTError

        credentials_exception = HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials.",
            headers={"WWW-Authenticate": "Bearer"},
        )

        try:
            payload = decode_token(token)
        except JWTError:
            raise credentials_exception

        if payload.get("type") != "access":
            raise credentials_exception

        user_id: Optional[str] = payload.get("sub")
        if not user_id:
            raise credentials_exception

        repo = UserRepository(db)
        user: Optional[User] = repo.get_by_id(int(user_id))

        if user is None:
            raise credentials_exception

        if user.status == UserStatus.blocked:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Your account has been blocked.",
            )

        return user


# ---------------------------------------------------------------------------
# Module-level singleton — import and use directly in route dependencies.
# ---------------------------------------------------------------------------
auth_service = AuthService()
