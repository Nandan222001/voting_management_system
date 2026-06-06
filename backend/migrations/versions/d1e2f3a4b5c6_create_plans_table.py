"""create plans table

Revision ID: d1e2f3a4b5c6
Revises: 38f5000d2531
Create Date: 2026-06-06 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


revision = 'd1e2f3a4b5c6'
down_revision = '38f5000d2531'
branch_labels = None
depends_on = None


def upgrade() -> None:
    conn = op.get_bind()
    inspector = sa.inspect(conn)

    if 'plans' not in inspector.get_table_names():
        op.create_table(
            'plans',
            sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
            sa.Column('tenant_id', sa.Integer(), nullable=False),
            sa.Column('name', sa.String(length=100), nullable=False),
            sa.Column('price', sa.Float(), nullable=False, server_default='0.0'),
            sa.Column('currency', sa.String(length=3), nullable=False, server_default='INR'),
            sa.Column('period', sa.String(length=20), nullable=False, server_default='month'),
            sa.Column('description', sa.Text(), nullable=True),
            sa.Column('features', sa.Text(), nullable=True),
            sa.Column('is_active', sa.Boolean(), nullable=False, server_default='1'),
            sa.Column('is_highlighted', sa.Boolean(), nullable=False, server_default='0'),
            sa.Column('created_at', sa.DateTime(), server_default=sa.func.now(), nullable=False),
            sa.Column('updated_at', sa.DateTime(), server_default=sa.func.now(), nullable=False),
            sa.ForeignKeyConstraint(['tenant_id'], ['tenants.id'], ondelete='CASCADE'),
            sa.PrimaryKeyConstraint('id'),
        )
        try:
            op.create_index(op.f('ix_plans_id'), 'plans', ['id'], unique=False)
        except Exception:
            pass
        try:
            op.create_index(op.f('ix_plans_tenant_id'), 'plans', ['tenant_id'], unique=False)
        except Exception:
            pass


def downgrade() -> None:
    conn = op.get_bind()
    inspector = sa.inspect(conn)

    if 'plans' in inspector.get_table_names():
        try:
            op.drop_index(op.f('ix_plans_tenant_id'), table_name='plans')
        except Exception:
            pass
        try:
            op.drop_index(op.f('ix_plans_id'), table_name='plans')
        except Exception:
            pass
        op.drop_table('plans')
