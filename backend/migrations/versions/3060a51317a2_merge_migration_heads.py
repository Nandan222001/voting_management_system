"""Merge migration heads

Revision ID: 3060a51317a2
Revises: 6a4f4f4be64f, 263ee35ca6cf
Create Date: 2026-05-31 01:30:28.340338

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '3060a51317a2'
down_revision = ('6a4f4f4be64f', '263ee35ca6cf')
branch_labels = None
depends_on = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
