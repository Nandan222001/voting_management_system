"""Add tenant_id columns to all tables.

Revision ID: 004
Revises: 003
Create Date: 2026-05-22
"""

from alembic import op
import sqlalchemy as sa

revision = "004"
down_revision = "003"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # users — nullable (superadmin has tenant_id = NULL)
    op.add_column("users", sa.Column("tenant_id", sa.Integer(), nullable=True))
    op.create_foreign_key(
        "fk_users_tenant_id", "users", "tenants", ["tenant_id"], ["id"],
        ondelete="SET NULL",
    )
    op.create_index("ix_users_tenant_id", "users", ["tenant_id"])

    # elections — nullable initially (data migration handles existing rows)
    op.add_column("elections", sa.Column("tenant_id", sa.Integer(), nullable=True))
    op.create_foreign_key(
        "fk_elections_tenant_id", "elections", "tenants", ["tenant_id"], ["id"],
        ondelete="CASCADE",
    )
    op.create_index("ix_elections_tenant_id", "elections", ["tenant_id"])

    # candidates
    op.add_column("candidates", sa.Column("tenant_id", sa.Integer(), nullable=True))
    op.create_foreign_key(
        "fk_candidates_tenant_id", "candidates", "tenants", ["tenant_id"], ["id"],
        ondelete="CASCADE",
    )
    op.create_index("ix_candidates_tenant_id", "candidates", ["tenant_id"])

    # votes
    op.add_column("votes", sa.Column("tenant_id", sa.Integer(), nullable=True))
    op.create_foreign_key(
        "fk_votes_tenant_id", "votes", "tenants", ["tenant_id"], ["id"],
        ondelete="CASCADE",
    )
    op.create_index("ix_votes_tenant_id", "votes", ["tenant_id"])

    # audit_logs — nullable (system events may have no tenant)
    op.add_column("audit_logs", sa.Column("tenant_id", sa.Integer(), nullable=True))
    op.create_foreign_key(
        "fk_audit_logs_tenant_id", "audit_logs", "tenants", ["tenant_id"], ["id"],
        ondelete="SET NULL",
    )
    op.create_index("ix_audit_logs_tenant_id", "audit_logs", ["tenant_id"])


def downgrade() -> None:
    op.drop_index("ix_audit_logs_tenant_id", "audit_logs")
    op.drop_constraint("fk_audit_logs_tenant_id", "audit_logs", type_="foreignkey")
    op.drop_column("audit_logs", "tenant_id")

    op.drop_index("ix_votes_tenant_id", "votes")
    op.drop_constraint("fk_votes_tenant_id", "votes", type_="foreignkey")
    op.drop_column("votes", "tenant_id")

    op.drop_index("ix_candidates_tenant_id", "candidates")
    op.drop_constraint("fk_candidates_tenant_id", "candidates", type_="foreignkey")
    op.drop_column("candidates", "tenant_id")

    op.drop_index("ix_elections_tenant_id", "elections")
    op.drop_constraint("fk_elections_tenant_id", "elections", type_="foreignkey")
    op.drop_column("elections", "tenant_id")

    op.drop_index("ix_users_tenant_id", "users")
    op.drop_constraint("fk_users_tenant_id", "users", type_="foreignkey")
    op.drop_column("users", "tenant_id")
