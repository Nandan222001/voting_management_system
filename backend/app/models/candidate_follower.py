from sqlalchemy import Column, Integer, JSON
from app.config.database import Base

class CandidateFollower(Base):
    """
    ORM model for tracking candidate followers.
    Stores followers for each candidate in a single row using JSON.
    """
    __tablename__ = "candidate_followers"

    candidate_id = Column(Integer, primary_key=True, index=True)
    follower_ids = Column(JSON, nullable=False, default=list)

    def __repr__(self) -> str:
        return f"<CandidateFollower candidate_id={self.candidate_id}>"
