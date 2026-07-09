#!/usr/bin/env python3
"""
Seeder script to create upcoming and live elections with candidates.

Creates:
- 10 upcoming elections (elections that haven't started yet) with 5 candidates each
- 5 live elections (currently active) with 5 candidates each
"""

from datetime import datetime, timedelta
import random

from sqlalchemy.orm import Session
from sqlalchemy import text

from app.config.database import SessionLocal, engine
from app.models.election import Election, ElectionStatus
from app.models.candidate import Candidate
from app.models.tenant import Tenant
from app.models.user import User, UserRole


def seed_elections():
    db = SessionLocal()
    try:
        print("Deleting existing candidates and elections...")
        # Delete in correct order due to FK constraints (MariaDB compatible)
        db.query(Candidate).delete()
        db.query(Election).delete()
        db.commit()
        print("Tables cleared.")
        
        # Reset auto-increment counters
        db.execute(text("ALTER TABLE candidates AUTO_INCREMENT = 1"))
        db.execute(text("ALTER TABLE elections AUTO_INCREMENT = 1"))
        db.commit()
        print("Auto-increment counters reset.")

        # Get the first tenant (or create one if needed)
        tenant = db.query(Tenant).first()
        if not tenant:
            print("No tenant found. Creating a default tenant...")
            tenant = Tenant(
                name="Default Organization",
                slug="default-org",
                status="active",
                plan="professional"
            )
            db.add(tenant)
            db.commit()
            db.refresh(tenant)
            print(f"Created tenant: {tenant.name} (ID: {tenant.id})")

        # Get an admin user
        admin_user = db.query(User).filter(User.role == UserRole.admin).first()
        if not admin_user:
            # If no admin, get any user
            admin_user = db.query(User).first()
        
        now = datetime.utcnow()
        
        # Candidate names for seeding
        first_names = ["Raj", "Amit", "Suresh", "Ramesh", "Priya", "Anita", "Kavita", "Manish", "Arun", "Vijay", 
                     "Neha", "Pooja", "Deepak", "Rahul", "Sanjay", "Kiran", "Meera", "Lakshmi", "Usha", "Preeti"]
        last_names = ["Kumar", "Sharma", "Patel", "Singh", "Gupta", "Verma", "Mehta", "Desai", "Nair", "Reddy",
                      "Roy", "Das", "Banerjee", "Chauhan", "Malhotra", "Joshi", "Kapoor", "Khan", "Pandey", "Mishra"]
        
        positions = ["President", "Vice President", "Secretary", "Treasurer", "Coordinator", "Chairperson", 
                   "Member", "Representative", "Director", "Manager"]
        
        symbols = ["🐘", "🦁", " Tiger", "🐘", "🦅", "🐕", "🐱", "🐴", "🐓", "🐢", "🦀", "🦁", "🐘", "🐯", "🐅"]
        
        def generate_candidate_name():
            return f"{random.choice(first_names)} {random.choice(last_names)}"
        
        elections_added = []
        
        # Create 10 upcoming elections
        print("\nCreating 10 upcoming elections...")
        for i in range(10):
            election = Election(
                title=f"Upcoming Election {i+1}",
                description=f"This is the upcoming election number {i+1}. Voting will start soon.",
                start_date=now + timedelta(days=random.randint(5, 30)),
                end_date=now + timedelta(days=random.randint(35, 60)),
                nomination_start_date=now - timedelta(days=random.randint(10, 20)),
                nomination_end_date=now + timedelta(days=random.randint(1, 4)),
                status=ElectionStatus.active if random.random() > 0.5 else ElectionStatus.draft,
                tenant_id=tenant.id,
                created_by=admin_user.id if admin_user else None,
            )
            db.add(election)
            db.flush()  # Get the ID without committing
            
            # Add 5 candidates for this election
            for j in range(5):
                candidate = Candidate(
                    election_id=election.id,
                    tenant_id=tenant.id,
                    full_name=generate_candidate_name(),
                    position_name=random.choice(positions),
                    symbol=random.choice(symbols),
                    email=f"candidate{j+1}.election{i+1}@example.com",
                    phone=f"+919{random.randint(100000000, 999999999)}",
                    vote_count=0,
                    is_willing=True,
                    held_previously=random.choice([True, False]),
                )
                db.add(candidate)
            
            elections_added.append(election)
            print(f"  Created: {election.title} with 5 candidates")
        
        # Create 5 live elections (currently active)
        print("\nCreating 5 live elections...")
        for i in range(5):
            election = Election(
                title=f"Live Election {i+1}",
                description=f"This is a live ongoing election number {i+1}. Vote now!",
                start_date=now - timedelta(days=random.randint(1, 10)),
                end_date=now + timedelta(days=random.randint(5, 20)),
                nomination_start_date=now - timedelta(days=30),
                nomination_end_date=now - timedelta(days=random.randint(2, 15)),
                status=ElectionStatus.active,
                tenant_id=tenant.id,
                created_by=admin_user.id if admin_user else None,
            )
            db.add(election)
            db.flush()
            
            # Add 5 candidates for this election
            for j in range(5):
                candidate = Candidate(
                    election_id=election.id,
                    tenant_id=tenant.id,
                    full_name=generate_candidate_name(),
                    position_name=random.choice(positions),
                    symbol=random.choice(symbols),
                    email=f"livecandidate{j+1}.{i+1}@example.com",
                    phone=f"+918{random.randint(100000000, 999999999)}",
                    vote_count=random.randint(10, 500),  # Live elections have votes
                    is_willing=True,
                    held_previously=random.choice([True, False]),
                )
                db.add(candidate)
            
            elections_added.append(election)
            print(f"  Created: {election.title} with 5 candidates")
        
        db.commit()
        
        print(f"\n✓ Successfully added {len(elections_added)} elections with {len(elections_added) * 5} candidates total.")
        
        # Print summary
        upcoming_count = db.query(Election).filter(Election.end_date > now).count()
        live_count = db.query(Election).filter(
            Election.start_date <= now,
            Election.end_date > now
        ).count()
        
        print(f"\nSummary:")
        print(f"  - Upcoming elections: {upcoming_count}")
        print(f"  - Live/Active elections: {live_count}")
        print(f"  - Total candidates: {db.query(Candidate).count()}")
        
    except Exception as e:
        print(f"Error: {e}")
        db.rollback()
    finally:
        db.close()


if __name__ == "__main__":
    seed_elections()