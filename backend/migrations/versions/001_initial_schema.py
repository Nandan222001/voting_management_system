"""Initial database schema.

Creates core tables: users, elections, candidates, votes, audit_logs.
tenant_id columns are NOT added here — migration 004 adds them after
the tenants table is created in migration 003.

Revision ID: 001
Revises:
Create Date: 2026-05-22
"""

from alembic import op
import sqlalchemy as sa

revision = "001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # ------------------------------------------------------------------ users
    op.create_table(
        "users",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("full_name", sa.String(150), nullable=False),
        sa.Column("email", sa.String(255), nullable=False),
        sa.Column("phone", sa.String(20), nullable=True),
        sa.Column("hashed_password", sa.String(255), nullable=False),
        sa.Column(
            "role",
            sa.Enum("admin", "voter", name="user_role_enum"),
            nullable=False,
            server_default="voter",
        ),
        sa.Column(
            "status",
            sa.Enum("active", "blocked", "pending", name="user_status_enum"),
            nullable=False,
            server_default="pending",
        ),
        sa.Column("otp_code", sa.String(10), nullable=True),
        sa.Column("otp_expires_at", sa.DateTime(), nullable=True),
        sa.Column("is_verified", sa.Boolean(), nullable=False, server_default="0"),
        sa.Column("created_at", sa.DateTime(), nullable=False,
                  server_default=sa.text("NOW()")),
        sa.Column("updated_at", sa.DateTime(), nullable=False,
                  server_default=sa.text("NOW() ON UPDATE NOW()")),
        sa.UniqueConstraint("email", name="uq_users_email"),
    )
    op.create_index("ix_users_id", "users", ["id"])
    op.create_index("ix_users_email", "users", ["email"], unique=True)

    # -------------------------------------------------------------- elections
    op.create_table(
        "elections",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("title", sa.String(255), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("start_date", sa.DateTime(), nullable=False),
        sa.Column("end_date", sa.DateTime(), nullable=False),
        sa.Column(
            "status",
            sa.Enum("draft", "active", "closed", "cancelled",
                    name="election_status_enum"),
            nullable=False,
            server_default="draft",
        ),
        sa.Column("created_by", sa.Integer(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False,
                  server_default=sa.text("NOW()")),
        sa.Column("updated_at", sa.DateTime(), nullable=False,
                  server_default=sa.text("NOW() ON UPDATE NOW()")),
        sa.ForeignKeyConstraint(["created_by"], ["users.id"],
                                name="fk_elections_created_by",
                                ondelete="SET NULL"),
    )
    op.create_index("ix_elections_id", "elections", ["id"])
    op.create_index("ix_elections_created_by", "elections", ["created_by"])

    # -------------------------------------------------------------- candidates
    op.create_table(
        "candidates",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("election_id", sa.Integer(), nullable=False),
        sa.Column("full_name", sa.String(150), nullable=False),
        sa.Column("party", sa.String(150), nullable=True),
        sa.Column("symbol", sa.String(100), nullable=True),
        sa.Column("image_url", sa.String(500), nullable=True),
        sa.Column("bio", sa.Text(), nullable=True),
        sa.Column("vote_count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("created_at", sa.DateTime(), nullable=False,
                  server_default=sa.text("NOW()")),
        sa.Column("updated_at", sa.DateTime(), nullable=False,
                  server_default=sa.text("NOW() ON UPDATE NOW()")),
        sa.ForeignKeyConstraint(["election_id"], ["elections.id"],
                                name="fk_candidates_election_id",
                                ondelete="CASCADE"),
    )
    op.create_index("ix_candidates_id", "candidates", ["id"])
    op.create_index("ix_candidates_election_id", "candidates", ["election_id"])

    # ------------------------------------------------------------------ votes
    op.create_table(
        "votes",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("election_id", sa.Integer(), nullable=False),
        sa.Column("candidate_id", sa.Integer(), nullable=False),
        sa.Column("voted_at", sa.DateTime(), nullable=False,
                  server_default=sa.text("NOW()")),
        sa.Column("ip_address", sa.String(45), nullable=True),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"],
                                name="fk_votes_user_id", ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["election_id"], ["elections.id"],
                                name="fk_votes_election_id", ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["candidate_id"], ["candidates.id"],
                                name="fk_votes_candidate_id", ondelete="CASCADE"),
        sa.UniqueConstraint("user_id", "election_id", name="uq_vote_user_election"),
    )
    op.create_index("ix_votes_id", "votes", ["id"])
    op.create_index("ix_votes_user_id", "votes", ["user_id"])
    op.create_index("ix_votes_election_id", "votes", ["election_id"])
    op.create_index("ix_votes_candidate_id", "votes", ["candidate_id"])

    # --------------------------------------------------------------- audit_logs
    op.create_table(
        "audit_logs",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("user_id", sa.Integer(), nullable=True),
        sa.Column("action", sa.String(100), nullable=False),
        sa.Column("entity_type", sa.String(100), nullable=True),
        sa.Column("entity_id", sa.Integer(), nullable=True),
        sa.Column("details", sa.Text(), nullable=True),
        sa.Column("ip_address", sa.String(45), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False,
                  server_default=sa.text("NOW()")),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"],
                                name="fk_audit_logs_user_id",
                                ondelete="SET NULL"),
    )
    op.create_index("ix_audit_logs_id", "audit_logs", ["id"])
    op.create_index("ix_audit_logs_user_id", "audit_logs", ["user_id"])
    op.create_index("ix_audit_logs_action", "audit_logs", ["action"])
    op.create_index("ix_audit_logs_created_at", "audit_logs", ["created_at"])


def downgrade() -> None:
    op.drop_table("audit_logs")
    op.drop_table("votes")
    op.drop_table("candidates")
    op.drop_table("elections")
    op.drop_table("users")
    # MySQL drops ENUMs automatically with the table; explicit DROP only for PG
    op.execute("DROP TYPE IF EXISTS election_status_enum")
    op.execute("DROP TYPE IF EXISTS user_role_enum")
    op.execute("DROP TYPE IF EXISTS user_status_enum")
