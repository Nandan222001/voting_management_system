"""Seed default tenant admin user.

Revision ID: 002
Revises: 001
Create Date: 2026-05-22
"""

from datetime import datetime
from alembic import op
import sqlalchemy as sa
from sqlalchemy.sql import table, column

revision = "002"
down_revision = "001"
branch_labels = None
depends_on = None


def _hash(password: str) -> str:
    import bcrypt as _bcrypt
    return _bcrypt.hashpw(password.encode("utf-8"), _bcrypt.gensalt()).decode("utf-8")


def upgrade() -> None:
    users_table = table(
        "users",
        column("full_name", sa.String),
        column("email", sa.String),
        column("hashed_password", sa.String),
        column("role", sa.String),
        column("status", sa.String),
        column("is_verified", sa.Boolean),
        column("created_at", sa.DateTime),
        column("updated_at", sa.DateTime),
    )
    op.bulk_insert(users_table, [
        {
            "full_name": "Default Admin",
            "email": "admin@voting.com",
            "hashed_password": _hash("Admin@123"),
            "role": "admin",
            "status": "active",
            "is_verified": True,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
        }
    ])


def downgrade() -> None:
    conn = op.get_bind()
    conn.execute(sa.text("DELETE FROM users WHERE email = 'admin@voting.com'"))
