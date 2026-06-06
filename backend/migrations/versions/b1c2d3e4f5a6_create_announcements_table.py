"""create_announcements_table

Revision ID: b1c2d3e4f5a6
Revises: e9b721056bde
Create Date: 2026-06-02 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


revision = "b1c2d3e4f5a6"
down_revision = "e9b721056bde"
branch_labels = None
depends_on = None


def upgrade() -> None:
    conn = op.get_bind()
    inspector = sa.inspect(conn)

    if 'announcements' not in inspector.get_table_names():
        op.create_table(
            "announcements",
            sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
            sa.Column("tenant_id", sa.Integer(), nullable=False),
            sa.Column("created_by", sa.Integer(), nullable=True),
            sa.Column("title", sa.String(length=200), nullable=False),
            sa.Column("short_description", sa.String(length=500), nullable=False),
            sa.Column("content", sa.Text(), nullable=False),
            sa.Column("image_urls", sa.JSON(), nullable=False),
            sa.Column("attachment_urls", sa.JSON(), nullable=False),
            sa.Column("publish_date", sa.DateTime(), nullable=False),
            sa.Column(
                "status",
                sa.Enum("draft", "published", name="announcement_status_enum"),
                nullable=False,
            ),
            sa.Column("is_featured", sa.Boolean(), nullable=False),
            sa.Column("created_at", sa.DateTime(), server_default=sa.func.now(), nullable=False),
            sa.Column("updated_at", sa.DateTime(), server_default=sa.func.now(), nullable=False),
            sa.ForeignKeyConstraint(["created_by"], ["users.id"], ondelete="SET NULL"),
            sa.ForeignKeyConstraint(["tenant_id"], ["tenants.id"], ondelete="CASCADE"),
            sa.PrimaryKeyConstraint("id"),
        )
        op.create_index(op.f("ix_announcements_id"), "announcements", ["id"], unique=False)
        op.create_index(op.f("ix_announcements_tenant_id"), "announcements", ["tenant_id"], unique=False)
        op.create_index(op.f("ix_announcements_created_by"), "announcements", ["created_by"], unique=False)
        op.create_index(op.f("ix_announcements_publish_date"), "announcements", ["publish_date"], unique=False)
        op.create_index(op.f("ix_announcements_status"), "announcements", ["status"], unique=False)
        op.create_index(op.f("ix_announcements_is_featured"), "announcements", ["is_featured"], unique=False)


def downgrade() -> None:
    conn = op.get_bind()
    inspector = sa.inspect(conn)

    if 'announcements' in inspector.get_table_names():
        op.drop_index(op.f("ix_announcements_is_featured"), table_name="announcements")
        op.drop_index(op.f("ix_announcements_status"), table_name="announcements")
        op.drop_index(op.f("ix_announcements_publish_date"), table_name="announcements")
        op.drop_index(op.f("ix_announcements_created_by"), table_name="announcements")
        op.drop_index(op.f("ix_announcements_tenant_id"), table_name="announcements")
        op.drop_index(op.f("ix_announcements_id"), table_name="announcements")
        op.drop_table("announcements")
