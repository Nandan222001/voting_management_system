"""add president_id to targets

Revision ID: 263ee35ca6cf
Revises: a1b2c3d4e5f6
Create Date: 2026-05-30 22:40:14.165747

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '263ee35ca6cf'
down_revision = 'a1b2c3d4e5f6'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # 1. Add president_id column to targets
    op.add_column('targets', sa.Column('president_id', sa.Integer(), nullable=True))
    op.create_index(op.f('ix_targets_president_id'), 'targets', ['president_id'], unique=True)
    op.create_foreign_key('fk_targets_president_id_users', 'targets', 'users', ['president_id'], ['id'], ondelete='SET NULL')


def downgrade() -> None:
    op.drop_constraint('fk_targets_president_id_users', 'targets', type_='foreignkey')
    op.drop_index(op.f('ix_targets_president_id'), table_name='targets')
    op.drop_column('targets', 'president_id')
