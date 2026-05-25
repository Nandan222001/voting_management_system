"""add revenue management and razorpay keys

Revision ID: a1b2c3d4e5f6
Revises: f8d5e1b2c3a4
Create Date: 2026-05-25 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import mysql
from sqlalchemy.engine.reflection import Inspector

# revision identifiers, used by Alembic.
revision = 'a1b2c3d4e5f6'
down_revision = 'f8d5e1b2c3a4'
branch_labels = None
depends_on = None


def upgrade() -> None:
    conn = op.get_bind()
    inspector = Inspector.from_engine(conn)
    tables = inspector.get_table_names()

    # 1. Add Razorpay keys to tenants if they don't exist
    columns = [c['name'] for c in inspector.get_columns('tenants')]
    if 'razorpay_key_id' not in columns:
        op.add_column('tenants', sa.Column('razorpay_key_id', sa.String(length=255), nullable=True))
    if 'razorpay_key_secret' not in columns:
        op.add_column('tenants', sa.Column('razorpay_key_secret', sa.String(length=255), nullable=True))

    # 2. Create payments table if it doesn't exist
    if 'payments' not in tables:
        op.create_table('payments',
            sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
            sa.Column('tenant_id', sa.Integer(), nullable=False),
            sa.Column('amount', sa.Float(), nullable=False),
            sa.Column('currency', sa.String(length=3), nullable=False),
            sa.Column('status', sa.Enum('pending', 'authorized', 'captured', 'failed', 'refunded', name='payment_status_enum'), nullable=False),
            sa.Column('description', sa.String(length=255), nullable=True),
            sa.Column('razorpay_order_id', sa.String(length=100), nullable=True),
            sa.Column('razorpay_payment_id', sa.String(length=100), nullable=True),
            sa.Column('razorpay_signature', sa.String(length=255), nullable=True),
            sa.Column('user_id', sa.Integer(), nullable=True),
            sa.Column('created_at', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
            sa.Column('updated_at', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
            sa.ForeignKeyConstraint(['tenant_id'], ['tenants.id'], ondelete='CASCADE'),
            sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='SET NULL'),
            sa.PrimaryKeyConstraint('id')
        )
        op.create_index(op.f('ix_payments_id'), 'payments', ['id'], unique=False)
        op.create_index(op.f('ix_payments_razorpay_order_id'), 'payments', ['razorpay_order_id'], unique=False)
        op.create_index(op.f('ix_payments_razorpay_payment_id'), 'payments', ['razorpay_payment_id'], unique=False)
        op.create_index(op.f('ix_payments_tenant_id'), 'payments', ['tenant_id'], unique=False)
        op.create_index(op.f('ix_payments_user_id'), 'payments', ['user_id'], unique=False)


def downgrade() -> None:
    conn = op.get_bind()
    inspector = Inspector.from_engine(conn)
    tables = inspector.get_table_names()

    if 'payments' in tables:
        op.drop_index(op.f('ix_payments_user_id'), table_name='payments')
        op.drop_index(op.f('ix_payments_tenant_id'), table_name='payments')
        op.drop_index(op.f('ix_payments_razorpay_payment_id'), table_name='payments')
        op.drop_index(op.f('ix_payments_razorpay_order_id'), table_name='payments')
        op.drop_index(op.f('ix_payments_id'), table_name='payments')
        op.drop_table('payments')
    
    columns = [c['name'] for c in inspector.get_columns('tenants')]
    if 'razorpay_key_secret' in columns:
        op.drop_column('tenants', 'razorpay_key_secret')
    if 'razorpay_key_id' in columns:
        op.drop_column('tenants', 'razorpay_key_id')
