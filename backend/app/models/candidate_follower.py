from sqlalchemy import Column, Integer, ForeignKey, UniqueConstraint
from app.config.database import Base

class CandidateFollower(Base):
    """
    Junction table for tracking candidate followers.
    Maps Many-to-Many relationship between Users and Candidates.
    """
    __tablename__ = "candidate_followers"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    candidate_id = Column(Integer, ForeignKey("candidates.id", ondelete="CASCADE"), nullable=False)
    tenant_id = Column(Integer, ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False)

    __table_args__ = (
        UniqueConstraint("user_id", "candidate_id", name="uq_user_candidate_follow"),
    )

    def __repr__(self) -> str:
        return f"<CandidateFollower user_id={self.user_id} candidate_id={self.candidate_id}>"
