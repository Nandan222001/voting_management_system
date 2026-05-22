"""Update role enum to include superadmin.

Revision ID: 005
Revises: 004
Create Date: 2026-05-22
"""

from alembic import op

revision = "005"
down_revision = "004"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # MySQL requires MODIFY COLUMN to change enum values
    op.execute(
        "ALTER TABLE users MODIFY COLUMN role "
        "ENUM('superadmin','admin','voter') NOT NULL DEFAULT 'voter'"
    )


def downgrade() -> None:
    # Remove superadmin — any superadmin rows must be cleaned up first
    op.execute(
        "UPDATE users SET role = 'admin' WHERE role = 'superadmin'"
    )
    op.execute(
        "ALTER TABLE users MODIFY COLUMN role "
        "ENUM('admin','voter') NOT NULL DEFAULT 'voter'"
    )
