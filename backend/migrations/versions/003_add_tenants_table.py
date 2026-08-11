"""Add tenants table.

Revision ID: 003
Revises: 002
Create Date: 2026-05-22
"""

from alembic import op
import sqlalchemy as sa

# ---------------------------------------------------------------------------
# Revision identifiers
# ---------------------------------------------------------------------------
revision = "003"
down_revision = "002"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "tenants",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("slug", sa.String(100), nullable=False),
        sa.Column("domain", sa.String(255), nullable=True),
        sa.Column("logo_url", sa.String(500), nullable=True),
        sa.Column(
            "primary_color",
            sa.String(7),
            nullable=False,
            server_default="#0051D5",        ),
        sa.Column(
            "status",
            sa.Enum(
                "draft",
                "active",
                "suspended",
                "cancelled",
                name="tenant_status_enum",
            ),
            nullable=False,
            server_default="draft",
        ),
        sa.Column(
            "plan",
            sa.Enum(
                "starter",
                "professional",
                "enterprise",
                name="tenant_plan_enum",
            ),
            nullable=False,
            server_default="starter",
        ),
        sa.Column(
            "max_elections", sa.Integer(), nullable=False, server_default="5"
        ),
        sa.Column(
            "max_voters", sa.Integer(), nullable=False, server_default="1000"
        ),
        sa.Column("contact_email", sa.String(255), nullable=True),
        sa.Column("contact_phone", sa.String(20), nullable=True),
        sa.Column("created_by", sa.Integer(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(),
            nullable=False,
            server_default=sa.func.now(),
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(),
            nullable=False,
            server_default=sa.func.now(),
        ),
        # Constraints
        sa.UniqueConstraint("slug", name="uq_tenants_slug"),
        sa.ForeignKeyConstraint(
            ["created_by"],
            ["users.id"],
            name="fk_tenants_created_by_users",
            ondelete="SET NULL",
        ),
    )

    # Indexes
    op.create_index("ix_tenants_slug", "tenants", ["slug"], unique=True)
    op.create_index("ix_tenants_id", "tenants", ["id"], unique=False)


def downgrade() -> None:
    op.drop_index("ix_tenants_slug", table_name="tenants")
    op.drop_index("ix_tenants_id", table_name="tenants")
    op.drop_table("tenants")

    # Drop custom ENUM types (required for PostgreSQL; harmless on MySQL)
    op.execute("DROP TYPE IF EXISTS tenant_status_enum")
    op.execute("DROP TYPE IF EXISTS tenant_plan_enum")
