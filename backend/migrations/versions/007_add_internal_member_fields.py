"""Add internal member and election district fields.

Revision ID: 007
Revises: 006
Create Date: 2026-05-24
"""

from alembic import op
import sqlalchemy as sa

revision = "007"
down_revision = "006"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("users", sa.Column("designation", sa.String(length=100), nullable=True))
    op.add_column("users", sa.Column("street_address", sa.String(length=300), nullable=True))
    op.add_column("users", sa.Column("city", sa.String(length=100), nullable=True))
    op.add_column("users", sa.Column("district", sa.String(length=100), nullable=True))
    op.add_column("users", sa.Column("state", sa.String(length=100), nullable=True))
    op.add_column("users", sa.Column("country", sa.String(length=100), nullable=True))
    op.add_column("users", sa.Column("pincode", sa.String(length=20), nullable=True))
    op.create_index("ix_users_district", "users", ["district"])

    op.add_column("elections", sa.Column("target_district", sa.String(length=100), nullable=True))
    op.create_index("ix_elections_target_district", "elections", ["target_district"])


def downgrade() -> None:
    op.drop_index("ix_elections_target_district", "elections")
    op.drop_column("elections", "target_district")

    op.drop_index("ix_users_district", "users")
    op.drop_column("users", "pincode")
    op.drop_column("users", "country")
    op.drop_column("users", "state")
    op.drop_column("users", "district")
    op.drop_column("users", "city")
    op.drop_column("users", "street_address")
    op.drop_column("users", "designation")
