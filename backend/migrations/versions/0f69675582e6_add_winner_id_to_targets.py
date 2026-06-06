"""Add winner_id to targets

Revision ID: 0f69675582e6
Revises: 3060a51317a2
Create Date: 2026-05-31 02:08:25.662410

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '0f69675582e6'
down_revision = '3060a51317a2'
branch_labels = None
depends_on = None


def upgrade() -> None:
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    cols = [c['name'] for c in inspector.get_columns('targets')]

    if 'winner_id' not in cols:
        op.add_column('targets', sa.Column('winner_id', sa.Integer(), nullable=True))
        try:
            op.create_index(op.f('ix_targets_winner_id'), 'targets', ['winner_id'], unique=False)
        except Exception:
            pass
        try:
            op.create_foreign_key(
                'fk_targets_winner_user', 'targets', 'users',
                ['winner_id'], ['id'], ondelete='SET NULL',
            )
        except Exception:
            pass


def downgrade() -> None:
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    cols = [c['name'] for c in inspector.get_columns('targets')]

    if 'winner_id' in cols:
        try:
            op.drop_constraint('fk_targets_winner_user', 'targets', type_='foreignkey')
        except Exception:
            pass
        try:
            op.drop_index(op.f('ix_targets_winner_id'), table_name='targets')
        except Exception:
            pass
        op.drop_column('targets', 'winner_id')
