from sqlalchemy import create_engine, select
from sqlalchemy.orm import Session
from app.config.settings import settings
from app.models.target import Target
from app.models.candidate_committee import CandidateCommittee

engine = create_engine(settings.DATABASE_URL)

def check_data():
    with Session(engine) as session:
        print("--- TARGETS ---")
        targets = session.execute(select(Target)).scalars().all()
        for t in targets:
            print(f"ID: {t.id}, Name: {t.name}, Type: {t.type}")
            
        print("\n--- COMMITTEES ---")
        committees = session.execute(select(CandidateCommittee)).scalars().all()
        for c in committees:
            print(f"ID: {c.id}, Name: {c.name}")

if __name__ == "__main__":
    check_data()
