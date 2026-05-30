from app.config.database import SessionLocal, engine
from app.models.plan import Plan
from app.models.tenant import Tenant
from sqlalchemy import text

def seed_plans():
    db = SessionLocal()
    try:
        print("Truncating 'plans' table...")
        # Disable foreign key checks for truncate if needed, but plans is a leaf usually
        # Use execute text for TRUNCATE as it's more direct
        db.execute(text("TRUNCATE TABLE plans"))
        db.commit()
        print("Table truncated.")

        tenants = db.query(Tenant).all()
        if not tenants:
            print("No tenants found to attach plans to.")
            return

        plans_to_add = [
            {
                "name": "Active Member",
                "price": 200.0,
                "currency": "INR",
                "period": "year",
                "description": "Annual membership for active participation in jurisdictional elections.",
                "features": "1 Year Validity, Standard Voting Access, Result Notifications",
                "is_active": True,
                "is_highlighted": True
            },
            {
                "name": "Life Member",
                "price": 5000.0,
                "currency": "INR",
                "period": "one-time",
                "description": "Lifetime membership with full access and elite status.",
                "features": "Lifetime Validity, VIP Verified Badge, Priority Support, Unlimited Analytics",
                "is_active": True,
                "is_highlighted": False
            }
        ]

        for tenant in tenants:
            print(f"Adding plans for tenant ID: {tenant.id} ({tenant.name})")
            for p_data in plans_to_add:
                plan = Plan(
                    tenant_id=tenant.id,
                    name=p_data["name"],
                    price=p_data["price"],
                    currency=p_data["currency"],
                    period=p_data["period"],
                    description=p_data["description"],
                    features=p_data["features"],
                    is_active=p_data["is_active"],
                    is_highlighted=p_data["is_highlighted"]
                )
                db.add(plan)
        
        db.commit()
        print("Successfully added fixed plans for all tenants.")
    except Exception as e:
        print(f"Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_plans()
