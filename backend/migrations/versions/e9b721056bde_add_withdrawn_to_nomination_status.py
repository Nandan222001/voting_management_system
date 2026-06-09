"""add_withdrawn_to_nomination_status

Revision ID: e9b721056bde
Revises: fa2eecf21a1f
Create Date: 2026-06-02 00:22:00.833788

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'e9b721056bde'
down_revision = 'fa2eecf21a1f'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Manual SQL for MySQL ENUM update to include 'withdrawn'
    op.execute("ALTER TABLE nominations MODIFY COLUMN status ENUM('pending', 'approved', 'rejected', 'suspended', 'withdrawn') NOT NULL DEFAULT 'pending'")


def downgrade() -> None:
    # Revert to previous ENUM
    op.execute("ALTER TABLE nominations MODIFY COLUMN status ENUM('pending', 'approved', 'rejected', 'suspended') NOT NULL DEFAULT 'pending'")
