"""add_voting_type_and_votes_allowed_to_elections

Revision ID: 6af289881267
Revises: 40615694a47a
Create Date: 2026-07-19 01:05:22.936816

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '6af289881267'
down_revision = '40615694a47a'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add voting_type column with enum
    op.add_column('elections', sa.Column('voting_type', sa.Enum('SINGLE_CANDIDATE', 'MULTIPLE_MEMBER', name='voting_type_enum'), server_default='SINGLE_CANDIDATE', nullable=False))
    # Add votes_allowed_per_voter column with default 1
    op.add_column('elections', sa.Column('votes_allowed_per_voter', sa.Integer(), server_default='1', nullable=False))


def downgrade() -> None:
    op.drop_column('elections', 'votes_allowed_per_voter')
    op.drop_column('elections', 'voting_type')