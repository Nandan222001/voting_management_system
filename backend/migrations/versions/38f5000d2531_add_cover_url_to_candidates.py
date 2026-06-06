"""Add cover_url to candidates

Revision ID: 38f5000d2531
Revises: b1c2d3e4f5a6
Create Date: 2026-06-02 02:09:56.426719

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '38f5000d2531'
down_revision = 'b1c2d3e4f5a6'
branch_labels = None
depends_on = None


def upgrade() -> None:
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    cols = [c['name'] for c in inspector.get_columns('candidates')]

    if 'cover_url' not in cols:
        op.add_column('candidates', sa.Column('cover_url', sa.String(length=500), nullable=True))


def downgrade() -> None:
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    cols = [c['name'] for c in inspector.get_columns('candidates')]

    if 'cover_url' in cols:
        op.drop_column('candidates', 'cover_url')
