"""add payment gst and refund fields

Revision ID: f1e2d3c4b5a6
Revises: c1d2e3f4a5b6
Create Date: 2026-06-05 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'f1e2d3c4b5a6'
down_revision = 'c1d2e3f4a5b6'
branch_labels = None
depends_on = None


def upgrade() -> None:
    conn = op.get_bind()
    inspector = sa.inspect(conn)

    columns = [c['name'] for c in inspector.get_columns('payments')]

    # GST / Tax columns
    if 'gst_rate' not in columns:
        op.add_column('payments', sa.Column('gst_rate', sa.Float(), nullable=True, server_default='0.0'))
    if 'gst_amount' not in columns:
        op.add_column('payments', sa.Column('gst_amount', sa.Float(), nullable=True, server_default='0.0'))

    # Refund tracking columns
    if 'refund_id' not in columns:
        op.add_column('payments', sa.Column('refund_id', sa.String(length=100), nullable=True))
        op.create_index(op.f('ix_payments_refund_id'), 'payments', ['refund_id'], unique=False)
    if 'refund_amount' not in columns:
        op.add_column('payments', sa.Column('refund_amount', sa.Float(), nullable=True))
    if 'refunded_at' not in columns:
        op.add_column('payments', sa.Column('refunded_at', sa.DateTime(), nullable=True))
    if 'refund_reason' not in columns:
        op.add_column('payments', sa.Column('refund_reason', sa.String(length=255), nullable=True))


def downgrade() -> None:
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    columns = [c['name'] for c in inspector.get_columns('payments')]

    if 'refund_reason' in columns:
        op.drop_column('payments', 'refund_reason')
    if 'refunded_at' in columns:
        op.drop_column('payments', 'refunded_at')
    if 'refund_amount' in columns:
        op.drop_column('payments', 'refund_amount')
    if 'refund_id' in columns:
        try:
            op.drop_index(op.f('ix_payments_refund_id'), table_name='payments')
        except Exception:
            pass
        op.drop_column('payments', 'refund_id')
    if 'gst_amount' in columns:
        op.drop_column('payments', 'gst_amount')
    if 'gst_rate' in columns:
        op.drop_column('payments', 'gst_rate')
