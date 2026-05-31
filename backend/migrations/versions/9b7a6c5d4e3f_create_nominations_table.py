"""Create nominations table

Revision ID: 9b7a6c5d4e3f
Revises: 4008e83140c8
Create Date: 2026-05-31 19:15:00.000000

"""
from alembic import op
import sqlalchemy as sa


revision = "9b7a6c5d4e3f"
down_revision = "4008e83140c8"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "nominations",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("election_id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("tenant_id", sa.Integer(), nullable=False),
        sa.Column("committee_id", sa.Integer(), nullable=True),
        sa.Column("target_id", sa.Integer(), nullable=True),
        sa.Column("full_name", sa.String(length=150), nullable=False),
        sa.Column("position_name", sa.String(length=100), nullable=True),
        sa.Column("email", sa.String(length=150), nullable=True),
        sa.Column("phone", sa.String(length=20), nullable=True),
        sa.Column("date_of_birth", sa.String(length=50), nullable=True),
        sa.Column("gender", sa.String(length=20), nullable=True),
        sa.Column("parent_name", sa.String(length=150), nullable=True),
        sa.Column("kyc_type", sa.String(length=50), nullable=True),
        sa.Column("voter_id_number", sa.String(length=50), nullable=True),
        sa.Column("state", sa.String(length=100), nullable=True),
        sa.Column("district", sa.String(length=100), nullable=True),
        sa.Column("taluka", sa.String(length=100), nullable=True),
        sa.Column("village", sa.String(length=100), nullable=True),
        sa.Column("pincode", sa.String(length=20), nullable=True),
        sa.Column("image_url", sa.String(length=500), nullable=True),
        sa.Column("bio", sa.Text(), nullable=True),
        sa.Column("is_willing", sa.Boolean(), nullable=True),
        sa.Column("held_previously", sa.Boolean(), nullable=True),
        sa.Column("prev_position", sa.String(length=150), nullable=True),
        sa.Column("prev_duration", sa.String(length=100), nullable=True),
        sa.Column("is_disciplined", sa.Boolean(), nullable=True),
        sa.Column("discipline_details", sa.Text(), nullable=True),
        sa.Column("has_complaints", sa.Boolean(), nullable=True),
        sa.Column("agreed_constitution", sa.Boolean(), nullable=True),
        sa.Column("accepted_results", sa.Boolean(), nullable=True),
        sa.Column("signature_url", sa.String(length=500), nullable=True),
        sa.Column(
            "status",
            sa.Enum("pending", "approved", "rejected", name="nomination_status_enum"),
            nullable=False,
        ),
        sa.Column("created_at", sa.DateTime(), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["committee_id"], ["candidate_committees.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["election_id"], ["elections.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["target_id"], ["targets.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["tenant_id"], ["tenants.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("election_id", "user_id", name="uq_nominations_election_user"),
    )
    op.create_index(op.f("ix_nominations_committee_id"), "nominations", ["committee_id"], unique=False)
    op.create_index(op.f("ix_nominations_election_id"), "nominations", ["election_id"], unique=False)
    op.create_index(op.f("ix_nominations_id"), "nominations", ["id"], unique=False)
    op.create_index(op.f("ix_nominations_target_id"), "nominations", ["target_id"], unique=False)
    op.create_index(op.f("ix_nominations_tenant_id"), "nominations", ["tenant_id"], unique=False)
    op.create_index(op.f("ix_nominations_user_id"), "nominations", ["user_id"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_nominations_user_id"), table_name="nominations")
    op.drop_index(op.f("ix_nominations_tenant_id"), table_name="nominations")
    op.drop_index(op.f("ix_nominations_target_id"), table_name="nominations")
    op.drop_index(op.f("ix_nominations_id"), table_name="nominations")
    op.drop_index(op.f("ix_nominations_election_id"), table_name="nominations")
    op.drop_index(op.f("ix_nominations_committee_id"), table_name="nominations")
    op.drop_table("nominations")
