"""
Authentication service.

Single Responsibility: Handles all authentication workflows — registration,
login, OTP verification, token refresh, and current-user resolution.

Dependency Inversion: Depends on ``UserRepository`` (an abstraction) and the
security utilities rather than on raw SQLAlchemy or Jose calls.
"""

import logging
from datetime import datetime, timedelta, timezone
from typing import Optional

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.payment import Payment, PaymentStatus
from app.models.plan import Plan
from app.models.tenant import Tenant
from app.models.user import User, UserRole, UserStatus
from app.repositories.user_repository import UserRepository
from app.repositories.tenant_repository import TenantRepository
from app.repositories.payment_repository import PaymentRepository
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
from app.utils.helpers import get_plan_expiry, calculate_expiry_from_period

# OTP is valid for 10 minutes by default.
_OTP_TTL_MINUTES: int = 10

logger = logging.getLogger(__name__)


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
        print(f"DEBUG: Registering new user: {register_data.email}")
        repo = UserRepository(db)

        # Normalize email to lowercase for consistent storage and lookup
        normalized_email = register_data.email.lower()

        # Resolve tenant_id — prefer the value carried in the request body,
        # then fall back to the parameter (caller override).
        resolved_tenant_id: Optional[int] = (
            register_data.tenant_id if register_data.tenant_id is not None else tenant_id
        )

        if resolved_tenant_id is not None:
            print(f"DEBUG: Resolving tenant_id: {resolved_tenant_id}")
            tenant_repo = TenantRepository(db)
            tenant = tenant_repo.get_by_id(resolved_tenant_id)
            if tenant is None:
                print(f"DEBUG: Tenant {resolved_tenant_id} not found")
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
            print(f"DEBUG: Current voter count for tenant {resolved_tenant_id}: {current_voter_count} / {tenant.max_voters}")
            if current_voter_count >= tenant.max_voters:
                raise HTTPException(
                    status_code=status.HTTP_402_PAYMENT_REQUIRED,
                    detail=(
                        f"Voter limit of {tenant.max_voters} has been reached "
                        "for this organisation. Please upgrade your plan."
                    ),
                )

        existing_user = repo.get_by_email(normalized_email)
        if existing_user:
            if existing_user.hashed_password:
                # Full account already exists
                print(f"DEBUG: User with email {normalized_email} already exists")
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="A user with this email address already exists.",
                )
            # Temporary record from send-otp - we'll update it instead of creating new
            print(f"DEBUG: Found temporary record for {normalized_email}, will update it")

        if register_data.voter_id:
            existing_voter = db.query(User).filter(User.voter_id == register_data.voter_id).first()
            if existing_voter:
                print(f"DEBUG: User with voter_id {register_data.voter_id} already exists")
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="A user with this Voter ID already exists.",
                )

        # Secure Payment Verification for Paid Membership Plans
        if register_data.membership_plan_id:
            print(f"DEBUG: Verifying payment for plan: {register_data.membership_plan_id}")
            plan = db.query(Plan).filter(Plan.id == register_data.membership_plan_id).first()
            if plan and plan.price > 0:
                # Require payment details
                if not (register_data.razorpay_order_id and register_data.razorpay_payment_id and register_data.razorpay_signature):
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="Payment details are required for this membership plan."
                    )
                
                # Fetch tenant credentials for signature verification
                tenant = db.query(Tenant).filter(Tenant.id == resolved_tenant_id).first()
                if not tenant or not tenant.razorpay_key_secret:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="Payment gateway not configured for this organization."
                    )
                
                # Verify Razorpay Signature (Skip for simulation keys)
                if tenant.razorpay_key_id != "rzp_test_dummy":
                    import razorpay
                    client = razorpay.Client(auth=(tenant.razorpay_key_id, tenant.razorpay_key_secret))
                    try:
                        client.utility.verify_payment_signature({
                            'razorpay_order_id': register_data.razorpay_order_id,
                            'razorpay_payment_id': register_data.razorpay_payment_id,
                            'razorpay_signature': register_data.razorpay_signature
                        })
                    except Exception as e:
                        print(f"DEBUG: Payment signature verification failed: {str(e)}")
                        raise HTTPException(
                            status_code=status.HTTP_400_BAD_REQUEST,
                            detail="Payment signature verification failed. Please try again or contact support."
                        )

        otp = generate_otp()
        otp_expires = datetime.now(timezone.utc) + timedelta(minutes=_OTP_TTL_MINUTES)

        # Normalize empty strings to None for optional unique fields
        voter_id = register_data.voter_id if register_data.voter_id and register_data.voter_id.strip() != "" else None

        if existing_user:
            # Update the existing temporary record with full registration data
            print(f"DEBUG: Updating existing temporary user record for {normalized_email}")
            user = existing_user
            user.full_name = register_data.full_name
            user.phone = register_data.phone
            user.date_of_birth = register_data.date_of_birth
            user.gender = register_data.gender
            user.parent_name = register_data.parent_name
            user.voter_id = voter_id
            user.designation = register_data.designation
            user.kyc_type = register_data.kyc_type
            user.kyc_front_url = register_data.kyc_front_url
            user.kyc_back_url = register_data.kyc_back_url
            user.house_number = register_data.house_number
            user.street_address = register_data.street_address
            user.village = register_data.village
            user.landmark = register_data.landmark
            user.pincode = register_data.pincode
            user.city = register_data.city
            user.taluka = register_data.taluka
            user.district = register_data.district
            user.state = register_data.state
            user.country = register_data.country
            user.current_street_address = register_data.current_street_address
            user.current_city = register_data.current_city
            user.current_district = register_data.current_district
            user.current_state = register_data.current_state
            user.current_pincode = register_data.current_pincode
            user.target_id = register_data.target_id
            user.committee_id = register_data.committee_id
            user.membership_plan_id = register_data.membership_plan_id
            user.hashed_password = hash_password(register_data.password)
            user.tenant_id = resolved_tenant_id
            # Preserve existing OTP if already verified, otherwise set new one
            if not user.is_verified:
                user.otp_code = otp
                user.otp_expires_at = otp_expires
            db.flush()
            print(f"DEBUG: Temporary user updated successfully. ID: {user.id}")
        else:
            print(f"DEBUG: Creating User object for {normalized_email}")
            try:
                user = User(
                    full_name=register_data.full_name,
                    email=normalized_email,
                    phone=register_data.phone,
                    date_of_birth=register_data.date_of_birth,
                    gender=register_data.gender,
                    parent_name=register_data.parent_name,
                    voter_id=voter_id,
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
                print("DEBUG: User object instantiated successfully")
            except Exception as e:
                print(f"DEBUG: Failed to instantiate User object: {str(e)}")
                raise e

            print("DEBUG: Adding user to session and flushing...")
            db.add(user)
            try:
                db.flush() # Get user.id
                print(f"DEBUG: User flushed successfully. ID: {user.id}")
            except Exception as e:
                print(f"DEBUG: Database flush failed: {str(e)}")
                db.rollback()
                raise e

        # Create or update payment record to 'captured' and link to user
        is_payment_captured = False
        if register_data.membership_plan_id and register_data.razorpay_order_id:
            print(f"DEBUG: Linking payment record for order: {register_data.razorpay_order_id}")
            payment_repo = PaymentRepository(db)
            payment = payment_repo.get_by_order_for_registration(resolved_tenant_id, register_data.razorpay_order_id)
            if payment:
                payment_repo.update(payment, {
                    "user_id": user.id,
                    "status": PaymentStatus.captured,
                    "razorpay_payment_id": register_data.razorpay_payment_id,
                    "razorpay_signature": register_data.razorpay_signature
                })
                is_payment_captured = True

        # Set membership_expires_at based on plan period
        if register_data.membership_plan_id and is_payment_captured:
            expiry = get_plan_expiry(db, register_data.membership_plan_id)
            if expiry:
                user.membership_expires_at = expiry
                print(f"DEBUG: Set membership_expires_at to {expiry}")
        elif register_data.membership_plan_id:
            # Free plan: set expiry as well
            plan = db.query(Plan).filter(Plan.id == register_data.membership_plan_id).first()
            if plan and plan.price <= 0:
                from app.utils.helpers import calculate_expiry_from_period
                user.membership_expires_at = calculate_expiry_from_period(plan.period)
                print(f"DEBUG: Set membership_expires_at for free plan to {user.membership_expires_at}")

        print("DEBUG: Committing transaction...")
        db.commit()
        db.refresh(user)
        print("DEBUG: Transaction committed successfully")

        # Send verification email
        try:
            print(f"DEBUG: Sending registration OTP email to {user.email}")
            send_registration_otp_email(user.email, otp)
            print("DEBUG: Registration email sent successfully")
        except Exception as e:
            # If email fails, we allow registration to complete but log the error.
            # This prevents 500 errors when SMTP is not configured or misconfigured.
            logger.error(f"Failed to send registration email: {str(e)}")
            print(f"DEBUG: !!! EMAIL SENDING FAILED: {str(e)}")
            print(f"DEBUG: !!! USER CREATED SUCCESSFULLY. OTP IS: {otp}")
            # We don't raise an exception here so the user can still proceed.

        return user

    # ------------------------------------------------------------------
    # Login
    # ------------------------------------------------------------------

    def login(
        self,
        db: Session,
        email: str,
        password: str,
        header_tenant_id: Optional[int] = None,
    ) -> TokenResponse:
        """
        Authenticate user and issue JWT token.

        Web Login:
            - Only admin & superadmin.

        Mobile Login:
            - Only voter.
        """

        repo = UserRepository(db)

        print(f"DEBUG: Attempting login for email: {email}")

        # Find user
        user: Optional[User] = repo.get_by_email(email)

        # Validate credentials
        if user is None or not verify_password(password, user.hashed_password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password.",
            )

        print(
            f"DEBUG: User found -> "
            f"ID={user.id}, "
            f"Role={user.role}, "
            f"Tenant={user.tenant_id}"
        )

        # Blocked account
        if user.status == UserStatus.blocked:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Your account has been blocked. Contact administrator.",
            )

        # ---------------------------------------------------------
        # ROLE VALIDATION
        # ---------------------------------------------------------

        # WEB LOGIN
        if header_tenant_id is None:

            if user.role not in [UserRole.admin, UserRole.superadmin]:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Only Admin and Super Admin can login.",
                )

        # MOBILE LOGIN
        else:

            if user.role != UserRole.voter:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Only Voters can login.",
                )

            # Tenant Validation
            if user.tenant_id != header_tenant_id:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="You do not have access to this organisation.",
                )

        # ---------------------------------------------------------
        # Tenant Status
        # ---------------------------------------------------------
        if user.tenant_id is not None:

            tenant_repo = TenantRepository(db)
            tenant = tenant_repo.get_by_id(user.tenant_id)

            if tenant:

                if tenant.status.value == "suspended":
                    raise HTTPException(
                        status_code=status.HTTP_403_FORBIDDEN,
                        detail="Your organisation's account has been suspended.",
                    )

                if tenant.status.value in ("draft", "cancelled"):
                    raise HTTPException(
                        status_code=status.HTTP_403_FORBIDDEN,
                        detail=f"Your organisation's account is {tenant.status.value}.",
                    )

        # ---------------------------------------------------------
        # Create JWT
        # ---------------------------------------------------------
        token_payload = {
            "sub": str(user.id),
            "role": user.role.value,
            "tenant_id": user.tenant_id,
            "district": user.district,
            "designation": user.designation,
        }

        access_token = create_access_token(token_payload)
        refresh_token = create_refresh_token(token_payload)

        auth_user_info = AuthUserInfo.model_validate(user)

        return TokenResponse(
            access_token=access_token,
            token_type="bearer",
            user=auth_user_info,
        )

    # ------------------------------------------------------------------
    # Send OTP (pre-registration email verification)
    # ------------------------------------------------------------------

    def send_otp(self, db: Session, email: str) -> bool:
        """
        Generate and send an OTP to the given email address for
        pre-registration verification.

        Creates a temporary user record with the email and OTP so that
        the existing ``verify_otp`` endpoint can find and verify it.
        If a temporary record already exists (e.g. from a previous
        send-otp request), its OTP is refreshed.

        Args:
            db:    Active database session.
            email: The email address to send the OTP to.

        Returns:
            True if the OTP was sent successfully.

        Raises:
            HTTPException 409: If the email is already registered
                               with a fully-created account.
            HTTPException 500: If sending the email fails.
        """
        repo = UserRepository(db)
        normalized_email = email.lower().strip()

        # Check if email is already registered with a full account
        existing = repo.get_by_email(normalized_email)
        if existing and existing.hashed_password:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="This email is already registered. Please use a different email or login.",
            )

        otp = generate_otp()
        otp_expires = datetime.now(timezone.utc) + timedelta(minutes=_OTP_TTL_MINUTES)

        if existing:
            # Refresh OTP on existing temporary record
            existing.otp_code = otp
            existing.otp_expires_at = otp_expires
            db.commit()
            temp_user = existing
        else:
            # Create a minimal temporary user record to hold the OTP
            temp_user = User(
                email=normalized_email,
                full_name="",
                phone="",
                hashed_password="",
                role=UserRole.voter,
                status=UserStatus.pending,
                is_verified=False,
                otp_code=otp,
                otp_expires_at=otp_expires,
            )
            db.add(temp_user)
            db.commit()
            db.refresh(temp_user)

        # Send the OTP via email
        try:
            from app.utils.email import send_registration_otp_email
            send_registration_otp_email(normalized_email, otp)
            logger.info(f"OTP sent to {normalized_email}")
        except Exception as e:
            logger.error(f"Failed to send OTP email to {normalized_email}: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to send OTP email: {str(e)}",
            )

        return True

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

        # Check if this is a fully registered user or a pre-registration temp user
        is_fully_registered = bool(user.hashed_password)

        # Mark as verified and clear the OTP fields.
        user.is_verified = True
        user.otp_code = None
        user.otp_expires_at = None

        if is_fully_registered:
            # Fully registered user: activate them upon verification
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
        else:
            # Pre-registration temp user: just mark email as verified
            # Keep status as pending — they still need to complete registration
            # and get admin approval. Return a TokenResponse with empty token.
            db.commit()
            db.refresh(user)

            # Return an empty TokenResponse — the mobile app checks for
            # access_token to decide whether login happened. No token means
            # the user still needs to complete registration.
            return TokenResponse(
                access_token="",
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
            True if OTP was sent.

        Raises:
            HTTPException 404: If the e-mail address is not registered.
        """
        repo = UserRepository(db)
        user: Optional[User] = repo.get_by_email(email)

        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Account does not exist with this email address.",
            )

        otp = generate_otp()
        otp_expires = datetime.now(timezone.utc) + timedelta(minutes=_OTP_TTL_MINUTES)
        
        user.otp_code = otp
        user.otp_expires_at = otp_expires
        db.commit()
        
        # Send the OTP via email
        try:
            send_otp_email(user.email, otp)
        except Exception as e:
            logger.error(f"Failed to send password reset email: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to send password reset email: {str(e)}"
            )
        
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
