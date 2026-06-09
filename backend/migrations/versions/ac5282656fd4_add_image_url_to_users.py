"""add image_url to users

Revision ID: ac5282656fd4
Revises: f1e2d3c4b5a6
Create Date: 2026-06-08 23:49:44.088286

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'ac5282656fd4'
down_revision = 'f1e2d3c4b5a6'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column('users', sa.Column('image_url', sa.String(length=500), nullable=True))


def downgrade() -> None:
    op.drop_column('users', 'image_url')
