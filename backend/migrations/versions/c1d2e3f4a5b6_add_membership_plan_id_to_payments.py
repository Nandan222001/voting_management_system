"""add membership plan id to payments

Revision ID: c1d2e3f4a5b6
Revises: 38f5000d2531
Create Date: 2026-06-03 10:30:00.000000

"""
from alembic import op
import sqlalchemy as sa


revision = "c1d2e3f4a5b6"
down_revision = "38f5000d2531"
branch_labels = None
depends_on = None


def upgrade() -> None:
    conn = op.get_bind()
    dialect = conn.dialect.name
    inspector = sa.inspect(conn)
    tables = inspector.get_table_names()
    if "payments" not in tables:
        return

    columns = [column["name"] for column in inspector.get_columns("payments")]
    if "membership_plan_id" not in columns:
        op.add_column(
            "payments",
            sa.Column("membership_plan_id", sa.Integer(), nullable=True),
        )
        op.create_index(
            op.f("ix_payments_membership_plan_id"),
            "payments",
            ["membership_plan_id"],
            unique=False,
        )
        if dialect != "sqlite":
            op.create_foreign_key(
                "fk_payments_membership_plan_id_plans",
                "payments",
                "plans",
                ["membership_plan_id"],
                ["id"],
                ondelete="SET NULL",
            )


def downgrade() -> None:
    conn = op.get_bind()
    dialect = conn.dialect.name
    inspector = sa.inspect(conn)
    tables = inspector.get_table_names()
    if "payments" not in tables:
        return

    columns = [column["name"] for column in inspector.get_columns("payments")]
    if "membership_plan_id" in columns:
        if dialect != "sqlite":
            op.drop_constraint(
                "fk_payments_membership_plan_id_plans",
                "payments",
                type_="foreignkey",
            )
        op.drop_index(op.f("ix_payments_membership_plan_id"), table_name="payments")
        op.drop_column("payments", "membership_plan_id")
