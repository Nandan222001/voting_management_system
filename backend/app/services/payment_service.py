import hashlib
import hmac
import json
import secrets
from datetime import datetime
from typing import Optional, Tuple

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.payment import Payment, PaymentStatus
from app.models.plan import Plan
from app.models.user import User
from app.repositories.audit_log_repository import AuditLogRepository
from app.repositories.payment_repository import PaymentRepository
from app.repositories.plan_repository import PlanRepository
from app.repositories.tenant_repository import TenantRepository
from app.schemas.payment import (
    PaymentAnalytics,
    PaymentUpdate,
    RefundRequest,
    RevenueSummary,
    RazorpayPaymentVerify,
    PaymentFailure,
)
from app.schemas.tenant import TenantPaymentSettings

# 18% GST applied on top of plan price
GST_RATE = 0.18


class PaymentService:
    """
    Handles business logic for revenue management and payment integration.
    """

    def get_tenant_revenue(
        self, db: Session, tenant_id: int, page: int = 1, page_size: int = 20
    ) -> Tuple[list[Payment], int, RevenueSummary]:
        """
        Build a complete revenue overview for a tenant.
        """
        repo = PaymentRepository(db)
        skip = (page - 1) * page_size
        
        items, total = repo.get_by_tenant(tenant_id, skip=skip, limit=page_size)
        summary_data = repo.get_revenue_summary(tenant_id)
        
        return items, total, RevenueSummary(**summary_data)

    def update_payment_settings(
        self, db: Session, tenant_id: int, settings: TenantPaymentSettings
    ) -> bool:
        """
        Update Razorpay credentials for a tenant.
        """
        tenant_repo = TenantRepository(db)
        tenant = tenant_repo.get_by_id(tenant_id)
        if not tenant:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Tenant not found",
            )
            
        tenant_repo.update(tenant, settings)
        return True

    def get_payment_settings(self, db: Session, tenant_id: int) -> dict:
        """
        Retrieve Razorpay credentials for a tenant.
        """
        tenant_repo = TenantRepository(db)
        tenant = tenant_repo.get_by_id(tenant_id)
        if not tenant:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Tenant not found",
            )
            
        return {
            "razorpay_key_id": tenant.razorpay_key_id,
            "razorpay_key_secret": tenant.razorpay_key_secret,
        }

    def create_razorpay_order(
        self, db: Session, tenant_id: int, user_id: int, amount: float, description: str = None
    ) -> dict:
        """
        Create a Razorpay order using the tenant's credentials.
        """
        tenant_repo = TenantRepository(db)
        tenant = tenant_repo.get_by_id(tenant_id)
        
        if not tenant or not (tenant.razorpay_key_id and tenant.razorpay_key_secret):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Razorpay credentials not configured for this organization.",
            )

        # Amount in paise
        amount_paise = int(amount * 100)
        
        # Simulation Bypass for Development
        if tenant.razorpay_key_id == "rzp_test_dummy":
            import secrets
            order_id = f"order_sim_{secrets.token_hex(8)}"
            razorpay_order = {"id": order_id}
        else:
            import razorpay
            client = razorpay.Client(auth=(tenant.razorpay_key_id, tenant.razorpay_key_secret))
            try:
                razorpay_order = client.order.create({
                    "amount": amount_paise,
                    "currency": "INR",
                    "payment_capture": 1 # Auto-capture
                })
            except Exception as e:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail=f"Razorpay order creation failed: {str(e)}",
                )

        # Create local record
        repo = PaymentRepository(db)
        payment = repo.create({
            "tenant_id": tenant_id,
            "user_id": user_id,
            "membership_plan_id": db.query(User).filter(User.id == user_id).first().membership_plan_id,
            "amount": amount,
            "currency": "INR",
            "description": description or "Membership Payment",
            "status": PaymentStatus.pending,
            "razorpay_order_id": razorpay_order["id"]
        })

        return {
            "payment_id": payment.id,
            "razorpay_order_id": razorpay_order["id"],
            "order_id": razorpay_order["id"],
            "amount": amount_paise,
            "currency": "INR",
            "key_id": tenant.razorpay_key_id
        }

    def create_membership_payment_order(
        self,
        db: Session,
        current_user: User,
        membership_plan_id: int,
    ) -> dict:
        """
        Create a Razorpay order for the current user's selected membership plan.
        """
        if current_user.tenant_id is None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Tenant is required for membership payments.",
            )
        if current_user.membership_plan_id is None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Please select a Membership Plan first.",
            )
        if current_user.membership_plan_id != membership_plan_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Requested plan does not match your selected Membership Plan.",
            )

        plan = PlanRepository(db).get_by_id_and_tenant(membership_plan_id, current_user.tenant_id)
        if not plan or not plan.is_active:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Membership Plan not found.",
            )
        if plan.price <= 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="This Membership Plan does not require payment.",
            )

        tenant = TenantRepository(db).get_by_id(current_user.tenant_id)
        if not tenant or not (tenant.razorpay_key_id and tenant.razorpay_key_secret):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Razorpay credentials not configured for this organization.",
            )

        amount_paise = int(round(plan.price * 100))
        if tenant.razorpay_key_id == "rzp_test_dummy":
            import secrets
            razorpay_order = {"id": f"order_sim_{secrets.token_hex(8)}"}
        else:
            import razorpay
            client = razorpay.Client(auth=(tenant.razorpay_key_id, tenant.razorpay_key_secret))
            try:
                razorpay_order = client.order.create({
                    "amount": amount_paise,
                    "currency": plan.currency or "INR",
                    "payment_capture": 1,
                    "notes": {
                        "tenant_id": str(current_user.tenant_id),
                        "user_id": str(current_user.id),
                        "membership_plan_id": str(plan.id),
                    },
                })
            except Exception as exc:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail=f"Razorpay order creation failed: {str(exc)}",
                ) from exc

        payment = PaymentRepository(db).create({
            "tenant_id": current_user.tenant_id,
            "user_id": current_user.id,
            "membership_plan_id": plan.id,
            "amount": plan.price,
            "currency": plan.currency or "INR",
            "description": f"{plan.name} Membership Payment",
            "status": PaymentStatus.pending,
            "razorpay_order_id": razorpay_order["id"],
        })

        try:
            AuditLogRepository(db).log_action(
                user_id=current_user.id,
                tenant_id=current_user.tenant_id,
                action="payment.order_created",
                entity_type="payment",
                entity_id=payment.id,
                details={
                    "razorpay_order_id": razorpay_order["id"],
                    "membership_plan_id": plan.id,
                    "amount": plan.price,
                    "currency": plan.currency or "INR",
                },
            )
        except Exception:
            pass

        return {
            "payment_id": payment.id,
            "razorpay_order_id": razorpay_order["id"],
            "order_id": razorpay_order["id"],
            "amount": amount_paise,
            "currency": plan.currency or "INR",
            "key_id": tenant.razorpay_key_id,
        }

    def create_registration_order(
        self,
        db: Session,
        tenant_id: int,
        membership_plan_id: int,
    ) -> dict:
        """
        Create a Razorpay order for a new user registration (before user record exists).
        """
        plan = PlanRepository(db).get_by_id_and_tenant(membership_plan_id, tenant_id)
        if not plan or not plan.is_active:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Membership Plan not found.",
            )
        if plan.price <= 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="This Membership Plan does not require payment.",
            )

        tenant = TenantRepository(db).get_by_id(tenant_id)
        if not tenant or not (tenant.razorpay_key_id and tenant.razorpay_key_secret):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Razorpay credentials not configured for this organization.",
            )

        amount_paise = int(round(plan.price * 100))
        
        # Simulation Bypass
        if tenant.razorpay_key_id == "rzp_test_dummy":
            import secrets
            razorpay_order = {"id": f"order_sim_{secrets.token_hex(8)}"}
        else:
            import razorpay
            client = razorpay.Client(auth=(tenant.razorpay_key_id, tenant.razorpay_key_secret))
            try:
                razorpay_order = client.order.create({
                    "amount": amount_paise,
                    "currency": plan.currency or "INR",
                    "payment_capture": 1,
                    "notes": {
                        "tenant_id": str(tenant_id),
                        "membership_plan_id": str(plan.id),
                        "type": "registration_payment"
                    },
                })
            except Exception as exc:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail=f"Razorpay order creation failed: {str(exc)}",
                ) from exc

        # Create local record without user_id
        payment = PaymentRepository(db).create({
            "tenant_id": tenant_id,
            "membership_plan_id": plan.id,
            "amount": plan.price,
            "currency": plan.currency or "INR",
            "description": f"Registration: {plan.name}",
            "status": PaymentStatus.pending,
            "razorpay_order_id": razorpay_order["id"],
        })

        return {
            "payment_id": payment.id,
            "razorpay_order_id": razorpay_order["id"],
            "order_id": razorpay_order["id"],
            "amount": amount_paise,
            "currency": plan.currency or "INR",
            "key_id": tenant.razorpay_key_id,
        }

    def verify_membership_payment(
        self,
        db: Session,
        current_user: User,
        payload: RazorpayPaymentVerify,
    ) -> dict:
        """
        Verify Razorpay signature and capture the local membership payment record.
        """
        if current_user.tenant_id is None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Tenant is required for membership payments.",
            )

        repo = PaymentRepository(db)
        payment = repo.get_by_order_for_user(
            current_user.tenant_id,
            current_user.id,
            payload.razorpay_order_id,
        )
        if payment is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Payment record not found.",
            )

        tenant = TenantRepository(db).get_by_id(current_user.tenant_id)
        if not tenant or not (tenant.razorpay_key_id and tenant.razorpay_key_secret):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Razorpay credentials not configured for this organization.",
            )

        if tenant.razorpay_key_id != "rzp_test_dummy":
            import razorpay
            client = razorpay.Client(auth=(tenant.razorpay_key_id, tenant.razorpay_key_secret))
            try:
                client.utility.verify_payment_signature({
                    "razorpay_order_id": payload.razorpay_order_id,
                    "razorpay_payment_id": payload.razorpay_payment_id,
                    "razorpay_signature": payload.razorpay_signature,
                })
            except Exception as exc:
                repo.update(payment, {"status": PaymentStatus.failed})
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Payment signature verification failed.",
                ) from exc

        repo.update(payment, {
            "status": PaymentStatus.captured,
            "razorpay_payment_id": payload.razorpay_payment_id,
            "razorpay_signature": payload.razorpay_signature,
        })

        try:
            AuditLogRepository(db).log_action(
                user_id=current_user.id,
                tenant_id=current_user.tenant_id,
                action="payment.verified",
                entity_type="payment",
                entity_id=payment.id,
                details={
                    "razorpay_order_id": payload.razorpay_order_id,
                    "razorpay_payment_id": payload.razorpay_payment_id,
                    "membership_plan_id": payment.membership_plan_id,
                },
            )
        except Exception:
            pass

        return {"success": True, "message": "Payment verified successfully."}

    def check_voting_eligibility(self, db: Session, current_user: User) -> dict:
        """
        Return whether the current user may submit a vote.
        """
        if current_user.membership_plan_id is None:
            return {
                "can_vote": False,
                "membership_selected": False,
                "payment_completed": False,
                "message": "To participate in voting, please select a Membership Plan first.",
            }

        payment_completed = self.has_completed_membership_payment(db, current_user)
        if not payment_completed:
            return {
                "can_vote": False,
                "membership_selected": True,
                "payment_completed": False,
                "message": "Membership payment is pending.",
            }

        return {
            "can_vote": True,
            "membership_selected": True,
            "payment_completed": True,
            "message": "Voting eligibility verified.",
        }

    def get_current_payment_status(self, db: Session, current_user: User) -> dict:
        """
        Return the latest payment status for the user's selected membership plan.
        """
        if current_user.tenant_id is None or current_user.membership_plan_id is None:
            return {"status": None, "payment_completed": False}

        latest_payment = PaymentRepository(db).get_latest_by_user(
            current_user.tenant_id,
            current_user.id,
            current_user.membership_plan_id,
        )
        payment_completed = self.has_completed_membership_payment(db, current_user)
        return {
            "status": "captured" if payment_completed else (latest_payment.status.value if latest_payment else None),
            "payment_completed": payment_completed,
        }

    def has_completed_membership_payment(self, db: Session, current_user: User) -> bool:
        """
        A membership payment is complete only after backend signature verification.
        """
        if current_user.membership_plan_id is None:
            return False

        plan_query = db.query(Plan).filter(Plan.id == current_user.membership_plan_id)
        if current_user.tenant_id is not None:
            plan_query = plan_query.filter(Plan.tenant_id == current_user.tenant_id)
        plan = plan_query.first()
        if plan and plan.price <= 0:
            return True

        if current_user.tenant_id is None:
            return False

        return PaymentRepository(db).has_captured_payment_for_user(
            current_user.tenant_id,
            current_user.id,
            current_user.membership_plan_id,
        )

    def get_my_membership_status(self, db: Session, current_user: User) -> dict:
        """
        Return whether the current user's selected membership plan is paid.
        """
        if current_user.membership_plan_id is None:
            return {
                "membership_plan_id": None,
                "has_membership_plan": False,
                "payment_required": True,
                "payment_completed": False,
                "latest_payment_status": None,
                "plan_details": None,
            }

        # Interconnect with Plan table to check price
        from app.models.plan import Plan
        plan = db.query(Plan).filter(Plan.id == current_user.membership_plan_id).first()
        
        payment_required = True
        if plan and plan.price == 0:
            payment_required = False

        if current_user.tenant_id is None:
            return {
                "membership_plan_id": current_user.membership_plan_id,
                "has_membership_plan": True,
                "payment_required": payment_required,
                "payment_completed": not payment_required,
                "latest_payment_status": None,
                "plan_details": {
                    "id": plan.id,
                    "name": plan.name,
                    "price": plan.price,
                    "currency": plan.currency
                } if plan else None,
            }

        repo = PaymentRepository(db)
        latest_payment = repo.get_latest_by_user(
            current_user.tenant_id,
            current_user.id,
            current_user.membership_plan_id,
        )
        
        # If payment not required (free plan), it's always "completed"
        if not payment_required:
            payment_completed = True
        else:
            payment_completed = repo.has_captured_payment_for_user(
                current_user.tenant_id,
                current_user.id,
                current_user.membership_plan_id
            )

        return {
            "membership_plan_id": current_user.membership_plan_id,
            "has_membership_plan": True,
            "payment_required": payment_required,
            "payment_completed": payment_completed,
            "latest_payment_status": latest_payment.status.value if latest_payment else None,
            "plan_details": {
                "id": plan.id,
                "name": plan.name,
                "price": plan.price,
                "currency": plan.currency
            } if plan else None,
        }

    def update_payment_status(
        self, db: Session, payment_id: int, tenant_id: int, data: PaymentUpdate
    ) -> Payment:
        """
        Verify signature (if provided) and update payment status.
        """
        repo = PaymentRepository(db)
        payment = repo.get_by_id(payment_id)
        
        if not payment or payment.tenant_id != tenant_id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Payment record not found.",
            )

        # Verification Logic
        if data.razorpay_signature:
            tenant_repo = TenantRepository(db)
            tenant = tenant_repo.get_by_id(tenant_id)
            if not tenant or not (tenant.razorpay_key_id and tenant.razorpay_key_secret):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Razorpay credentials not configured for this organization.",
                )
            
            if tenant.razorpay_key_id != "rzp_test_dummy":
                import razorpay
                client = razorpay.Client(auth=(tenant.razorpay_key_id, tenant.razorpay_key_secret))
                
                try:
                    client.utility.verify_payment_signature({
                        'razorpay_order_id': payment.razorpay_order_id,
                        'razorpay_payment_id': data.razorpay_payment_id,
                        'razorpay_signature': data.razorpay_signature
                    })
                except Exception:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="Payment signature verification failed.",
                    )

        return repo.update(payment, data.model_dump(exclude_unset=True))

    def record_payment_failure(
        self,
        db: Session,
        current_user: User,
        payload: PaymentFailure,
    ) -> bool:
        """
        Mark a pending payment as failed and log the reason.
        """
        repo = PaymentRepository(db)
        
        # If we have an order id, try to find the specific payment record
        payment = None
        if payload.razorpay_order_id:
            payment = repo.get_by_order_for_user(
                current_user.tenant_id,
                current_user.id,
                payload.razorpay_order_id
            )
        
        # Fallback to latest pending for this plan if order_id was missing or not found
        if not payment:
            payment = repo.get_latest_by_user(
                current_user.tenant_id,
                current_user.id,
                payload.membership_plan_id
            )

        if payment and payment.status == PaymentStatus.pending:
            repo.update(payment, {
                "status": PaymentStatus.failed,
                "description": f"{payment.description or ''} | Error: {payload.error_message}"[:255]
            })
            
            try:
                AuditLogRepository(db).log_action(
                    user_id=current_user.id,
                    tenant_id=current_user.tenant_id,
                    action="payment.failed",
                    entity_type="payment",
                    entity_id=payment.id,
                    details={
                        "error": payload.error_message,
                        "razorpay_order_id": payload.razorpay_order_id,
                        "membership_plan_id": payload.membership_plan_id,
                    },
                )
            except Exception:
                pass
            
        return True


# ---------------------------------------------------------------------------
# Module-level singleton
# ---------------------------------------------------------------------------
payment_service = PaymentService()
