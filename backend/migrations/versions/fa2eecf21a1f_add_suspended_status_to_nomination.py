"""add suspended status to nomination

Revision ID: fa2eecf21a1f
Revises: 9b7a6c5d4e3f
Create Date: 2026-06-01 12:15:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'fa2eecf21a1f'
down_revision = '9b7a6c5d4e3f'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Manual SQL for MySQL ENUM update
    op.execute("ALTER TABLE nominations MODIFY COLUMN status ENUM('pending', 'approved', 'rejected', 'suspended') NOT NULL DEFAULT 'pending'")


def downgrade() -> None:
    # Revert to original ENUM (ignoring 'suspended' values - they might need to be migrated first if they exist)
    op.execute("ALTER TABLE nominations MODIFY COLUMN status ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending'")
