"""update target hierarchy and remove party

Revision ID: f8d5e1b2c3a4
Revises: e74e89c267f5
Create Date: 2026-05-25 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import mysql

# revision identifiers, used by Alembic.
revision = 'f8d5e1b2c3a4'
down_revision = 'e74e89c267f5'
branch_labels = None
depends_on = None


def upgrade() -> None:
    conn = op.get_bind()
    inspector = sa.inspect(conn)

    # Remove party from candidates if it still exists
    cand_cols = [c['name'] for c in inspector.get_columns('candidates')]
    if 'party' in cand_cols:
        op.drop_column('candidates', 'party')

    # Make tenant_id nullable in targets
    try:
        op.alter_column(
            'targets', 'tenant_id',
            existing_type=mysql.INTEGER(display_width=11),
            nullable=True,
        )
    except Exception:
        pass

    # Convert targets.type from Enum to String(50)
    try:
        op.alter_column(
            'targets', 'type',
            existing_type=sa.Enum('state', 'district', 'zone', 'ward', 'other', name='target_type_enum'),
            type_=sa.String(50),
            existing_nullable=False,
        )
    except Exception:
        pass


def downgrade() -> None:
    conn = op.get_bind()
    inspector = sa.inspect(conn)

    try:
        op.alter_column(
            'targets', 'type',
            existing_type=sa.String(50),
            type_=sa.Enum('state', 'district', 'zone', 'ward', 'other', name='target_type_enum'),
            existing_nullable=False,
        )
    except Exception:
        pass

    try:
        op.alter_column(
            'targets', 'tenant_id',
            existing_type=mysql.INTEGER(display_width=11),
            nullable=False,
        )
    except Exception:
        pass

    cand_cols = [c['name'] for c in inspector.get_columns('candidates')]
    if 'party' not in cand_cols:
        op.add_column('candidates', sa.Column('party', sa.String(length=150), nullable=True))
