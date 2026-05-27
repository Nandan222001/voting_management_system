"""Seed superadmin user and default platform tenant.

Revision ID: 006
Revises: 005
Create Date: 2026-05-22
"""

from datetime import datetime
from alembic import op
import sqlalchemy as sa
from sqlalchemy.sql import table, column

revision = "006"
down_revision = "005"
branch_labels = None
depends_on = None


def _hash(password: str) -> str:
    import bcrypt as _bcrypt
    return _bcrypt.hashpw(password.encode("utf-8"), _bcrypt.gensalt()).decode("utf-8")


def upgrade() -> None:
    tenants_table = table(
        "tenants",
        column("id", sa.Integer),
        column("name", sa.String),
        column("slug", sa.String),
        column("contact_email", sa.String),
        column("status", sa.String),
        column("plan", sa.String),
        column("max_elections", sa.Integer),
        column("max_voters", sa.Integer),
        column("primary_color", sa.String),
        column("created_at", sa.DateTime),
        column("updated_at", sa.DateTime),
    )
    op.bulk_insert(tenants_table, [
        {
            "name": "TechElect Solutions",
            "slug": "techElect",
            "contact_email": "superadmin@techElect.com",
            "status": "active",
            "plan": "enterprise",
            "max_elections": 9999,
            "max_voters": 9999999,
            "primary_color": "#0051D5",
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
        }
    ])

    # Get the tenant id just inserted
    conn = op.get_bind()
    tenant_row = conn.execute(
        sa.text("SELECT id FROM tenants WHERE slug = 'techElect' LIMIT 1")
    ).fetchone()
    tenant_id = tenant_row[0]

    # Insert superadmin (tenant_id = NULL — global user)
    users_table = table(
        "users",
        column("full_name", sa.String),
        column("email", sa.String),
        column("hashed_password", sa.String),
        column("role", sa.String),
        column("status", sa.String),
        column("is_verified", sa.Boolean),
        column("tenant_id", sa.Integer),
        column("created_at", sa.DateTime),
        column("updated_at", sa.DateTime),
    )
    op.bulk_insert(users_table, [
        {
            "full_name": "Platform SuperAdmin",
            "email": "superadmin@techElect.com",
            "hashed_password": _hash("Super@Admin123"),
            "role": "superadmin",
            "status": "active",
            "is_verified": True,
            "tenant_id": None,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
        }
    ])

    # Assign existing admin (from migration 002) to default tenant
    conn.execute(
        sa.text(
            "UPDATE users SET tenant_id = :tid WHERE email = 'admin@voting.com'"
        ),
        {"tid": tenant_id},
    )


def downgrade() -> None:
    conn = op.get_bind()
    conn.execute(sa.text("DELETE FROM users WHERE email = 'superadmin@techElect.com'"))
    conn.execute(sa.text("UPDATE users SET tenant_id = NULL WHERE email = 'admin@voting.com'"))
    conn.execute(sa.text("DELETE FROM tenants WHERE slug = 'techElect'"))
