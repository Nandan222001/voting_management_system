import os
import sys
import random
from datetime import datetime, timedelta, timezone

# --- PREREQUISITES ---
# pip install faker sqlalchemy pymysql passlib bcrypt

# Add backend to path to allow importing models and utilities
backend_path = os.path.join(os.getcwd(), 'backend')
if backend_path not in sys.path:
    sys.path.append(backend_path)

try:
    from faker import Faker
    from sqlalchemy import create_engine
    from sqlalchemy.orm import sessionmaker
    
    # Import ORM Models
    from app.models.tenant import Tenant, TenantStatus, TenantPlan
    from app.models.target import Target, TargetType
    from app.models.user import User, UserRole, UserStatus
    from app.models.election import Election, ElectionStatus
    from app.models.candidate import Candidate
    from app.models.vote import Vote
    from app.models.announcement import Announcement, AnnouncementStatus
    from app.utils.security import hash_password
except ImportError as e:
    print(f"Error: Missing dependencies or path issue. {e}")
    print("Please run: pip install faker sqlalchemy pymysql passlib bcrypt")
    sys.exit(1)

# Database Connection (XAMPP Default)
DATABASE_URL = "mysql+pymysql://root:@localhost:3306/voting_db"
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(bind=engine)
db = SessionLocal()

# Initialize Faker with Indian Locale
fake = Faker('en_IN')

def seed_data():
    print("🚀 Starting data generation for tenant_id = 1...")

    # 1. Ensure Tenant with ID 1 exists
    tenant = db.query(Tenant).filter(Tenant.id == 1).first()
    if not tenant:
        print("➕ Creating Tenant ID 1...")
        tenant = Tenant(
            id=1,
            name="Digital Voting India Org",
            slug="digital-voting-india",
            domain="india.voting.com",
            status=TenantStatus.active,
            plan=TenantPlan.enterprise,
            contact_email="admin@indiavoting.com",
            contact_phone="9876543210"
        )
        db.add(tenant)
        db.commit()
    
    # 2. Generate Targets (Districts/Cities in India)
    print("➕ Generating Targets...")
    targets = []
    for _ in range(15):
        target_name = fake.city()
        # Check if target name already exists
        existing_target = db.query(Target).filter(Target.name == target_name).first()
        if not existing_target:
            target = Target(
                tenant_id=1,
                name=target_name,
                type=TargetType.district
            )
            db.add(target)
            db.flush() # Flush to get ID
            targets.append(target)
        else:
            targets.append(existing_target)
    db.commit()

    # 3. Generate Users (Voters)
    print("➕ Generating Users...")
    users = []
    # Add one admin for the tenant
    admin_email = "admin@indiavoting.com"
    admin_user = db.query(User).filter(User.email == admin_email).first()
    if not admin_user:
        admin_user = User(
            tenant_id=1,
            full_name="Tenant Admin",
            email=admin_email,
            phone="9999999999",
            hashed_password=hash_password("Admin@123"),
            role=UserRole.admin,
            status=UserStatus.active,
            is_verified=True,
            district=random.choice(targets).name if targets else "Default"
        )
        db.add(admin_user)
        db.flush()
    users.append(admin_user)

    # Add 20 Voters
    for _ in range(20):
        target = random.choice(targets) if targets else None
        email = fake.unique.email()
        user = User(
            tenant_id=1,
            full_name=fake.name(),
            email=email,
            phone=fake.phone_number()[:20],
            date_of_birth=fake.date_of_birth(minimum_age=18, maximum_age=80).strftime("%Y-%m-%d"),
            gender=random.choice(["Male", "Female", "Other"]),
            voter_id=fake.unique.bothify(text='??#########').upper(),
            hashed_password=hash_password("Voter@123"),
            role=UserRole.voter,
            status=UserStatus.active,
            is_verified=True,
            target_id=target.id if target else None,
            district=target.name if target else None,
            state="Maharashtra",  # Example state
            pincode=fake.postcode(),
            street_address=fake.street_address()
        )
        db.add(user)
        users.append(user)
    db.commit()

    # 4. Generate Elections
    print("➕ Generating Elections...")
    elections = []
    for i in range(10):
        start_date = datetime.now() + timedelta(days=random.randint(1, 10))
        end_date = start_date + timedelta(days=2)
        election = Election(
            tenant_id=1,
            title=f"{fake.word().capitalize()} Election 2026",
            description=fake.sentence(nb_words=10),
            start_date=start_date,
            end_date=end_date,
            status=ElectionStatus.active,
            created_by=admin_user.id,
            target_id=random.choice(targets).id
        )
        db.add(election)
        elections.append(election)
    db.commit()

    # 5. Generate Candidates
    print("➕ Generating Candidates...")
    candidates = []
    for election in elections:
        # Create 2-3 candidates per election
        for _ in range(random.randint(2, 3)):
            candidate = Candidate(
                tenant_id=1,
                election_id=election.id,
                full_name=fake.name(),
                phone=fake.phone_number()[:20],
                bio=fake.text(max_nb_chars=200),
                symbol=random.choice(["Lotus", "Hand", "Elephant", "Cycle", "Broom"]),
                vote_count=0,
                target_id=election.target_id
            )
            db.add(candidate)
            candidates.append(candidate)
    db.commit()

    # 6. Generate Votes (Avoiding duplicates for unique constraint)
    print("➕ Generating Votes...")
    voter_pool = [u for u in users if u.role == UserRole.voter]
    vote_count = 0
    for election in elections:
        election_candidates = [c for c in candidates if c.election_id == election.id]
        if not election_candidates:
            continue
            
        # Select random subset of voters for this election
        sampled_voters = random.sample(voter_pool, min(len(voter_pool), 15))
        for voter in sampled_voters:
            candidate = random.choice(election_candidates)
            vote = Vote(
                tenant_id=1,
                user_id=voter.id,
                election_id=election.id,
                candidate_id=candidate.id,
                voted_at=datetime.now(timezone.utc),
                ip_address=fake.ipv4()
            )
            db.add(vote)
            # Update denormalized vote count
            candidate.vote_count += 1
            vote_count += 1
    db.commit()

    # 7. Generate Announcements
    print("➕ Generating Announcements...")
    for _ in range(12):
        announcement = Announcement(
            tenant_id=1,
            title=fake.sentence(nb_words=6),
            short_description=fake.sentence(nb_words=15),
            content=fake.paragraph(nb_sentences=3),
            publish_date=datetime.now() - timedelta(days=random.randint(0, 30)),
            status=AnnouncementStatus.published,
            created_by=admin_user.id
        )
        db.add(announcement)
    db.commit()

    print(f"\n✅ Data generation complete!")
    print(f"Summary:")
    print(f"- Targets: 15")
    print(f"- Users: {len(users)}")
    print(f"- Elections: 10")
    print(f"- Candidates: {len(candidates)}")
    print(f"- Votes Cast: {vote_count}")
    print(f"- Announcements: 12")

if __name__ == "__main__":
    try:
        seed_data()
    except Exception as e:
        print(f"❌ Error during seeding: {e}")
        db.rollback()
    finally:
        db.close()
