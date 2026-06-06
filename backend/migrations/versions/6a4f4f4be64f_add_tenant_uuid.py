"""add_tenant_uuid

Revision ID: 6a4f4f4be64f
Revises: ca2ba2a6e465
Create Date: 2026-05-30 18:06:24.049360

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '6a4f4f4be64f'
down_revision = 'ca2ba2a6e465'
branch_labels = None
depends_on = None


def upgrade() -> None:
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    cols = [c['name'] for c in inspector.get_columns('tenants')]

    if 'uuid' not in cols:
        op.add_column('tenants', sa.Column('uuid', sa.String(length=100), nullable=True))
        try:
            op.create_index(op.f('ix_tenants_uuid'), 'tenants', ['uuid'], unique=True)
        except Exception:
            pass


def downgrade() -> None:
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    cols = [c['name'] for c in inspector.get_columns('tenants')]

    if 'uuid' in cols:
        try:
            op.drop_index(op.f('ix_tenants_uuid'), table_name='tenants')
        except Exception:
            pass
        op.drop_column('tenants', 'uuid')
