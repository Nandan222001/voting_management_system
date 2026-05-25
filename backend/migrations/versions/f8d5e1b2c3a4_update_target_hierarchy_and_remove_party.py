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
    # 1. Remove party from candidates
    op.drop_column('candidates', 'party')

    # 2. Make tenant_id nullable in targets
    op.alter_column('targets', 'tenant_id',
               existing_type=mysql.INTEGER(display_width=11),
               nullable=True)

    # 3. Update TargetType enum/type
    # Since it might be an Enum type in some DBs, we'll alter it to handle the new types.
    # For MySQL, Enum is just a specialized string.
    op.alter_column('targets', 'type',
               existing_type=sa.Enum('state', 'district', 'zone', 'ward', 'other', name='target_type_enum'),
               type_=sa.String(50),
               existing_nullable=False)


def downgrade() -> None:
    # Reverse changes
    op.alter_column('targets', 'type',
               existing_type=sa.String(50),
               type_=sa.Enum('state', 'district', 'zone', 'ward', 'other', name='target_type_enum'),
               existing_nullable=False)

    op.alter_column('targets', 'tenant_id',
               existing_type=mysql.INTEGER(display_width=11),
               nullable=False)

    op.add_column('candidates', sa.Column('party', sa.String(length=150), nullable=True))
