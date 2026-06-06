"""expand_user_for_multi_step_registration

Revision ID: ca2ba2a6e465
Revises: a1b2c3d4e5f6
Create Date: 2026-05-30 16:56:37.336002

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import mysql

# revision identifiers, used by Alembic.
revision = 'ca2ba2a6e465'
down_revision = 'a1b2c3d4e5f6'
branch_labels = None
depends_on = None


def upgrade() -> None:
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    cols = [c['name'] for c in inspector.get_columns('users')]

    new_cols = [
        ('gender', sa.String(length=20)),
        ('parent_name', sa.String(length=150)),
        ('kyc_type', sa.String(length=50)),
        ('kyc_front_url', sa.String(length=500)),
        ('kyc_back_url', sa.String(length=500)),
        ('house_number', sa.String(length=100)),
        ('village', sa.String(length=100)),
        ('landmark', sa.String(length=200)),
        ('taluka', sa.String(length=100)),
        ('current_street_address', sa.String(length=300)),
        ('current_city', sa.String(length=100)),
        ('current_district', sa.String(length=100)),
        ('current_state', sa.String(length=100)),
        ('current_pincode', sa.String(length=20)),
        ('committee_id', sa.Integer()),
        ('membership_plan_id', sa.Integer()),
    ]
    for col_name, col_type in new_cols:
        if col_name not in cols:
            op.add_column('users', sa.Column(col_name, col_type, nullable=True))

    try:
        op.alter_column(
            'users', 'date_of_birth',
            existing_type=sa.DATE(),
            type_=sa.String(length=20),
            existing_nullable=True,
        )
    except Exception:
        pass

    try:
        op.alter_column(
            'users', 'voter_id',
            existing_type=mysql.VARCHAR(length=255),
            type_=sa.String(length=50),
            existing_nullable=True,
        )
    except Exception:
        pass

    try:
        op.create_index(op.f('ix_users_committee_id'), 'users', ['committee_id'], unique=False)
    except Exception:
        pass

    try:
        op.create_index(op.f('ix_users_membership_plan_id'), 'users', ['membership_plan_id'], unique=False)
    except Exception:
        pass

    try:
        op.create_index(op.f('ix_users_voter_id'), 'users', ['voter_id'], unique=True)
    except Exception:
        pass

    try:
        op.create_foreign_key('fk_users_plans', 'users', 'plans', ['membership_plan_id'], ['id'], ondelete='SET NULL')
    except Exception:
        pass

    try:
        op.create_foreign_key('fk_users_committees', 'users', 'candidate_committees', ['committee_id'], ['id'], ondelete='SET NULL')
    except Exception:
        pass


def downgrade() -> None:
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    cols = [c['name'] for c in inspector.get_columns('users')]

    try:
        op.drop_constraint('fk_users_committees', 'users', type_='foreignkey')
    except Exception:
        pass
    try:
        op.drop_constraint('fk_users_plans', 'users', type_='foreignkey')
    except Exception:
        pass
    try:
        op.drop_index(op.f('ix_users_voter_id'), table_name='users')
    except Exception:
        pass
    try:
        op.drop_index(op.f('ix_users_membership_plan_id'), table_name='users')
    except Exception:
        pass
    try:
        op.drop_index(op.f('ix_users_committee_id'), table_name='users')
    except Exception:
        pass

    drop_cols = [
        'membership_plan_id', 'committee_id', 'current_pincode', 'current_state',
        'current_district', 'current_city', 'current_street_address', 'taluka',
        'landmark', 'village', 'house_number', 'kyc_back_url', 'kyc_front_url',
        'kyc_type', 'parent_name', 'gender',
    ]
    for col_name in drop_cols:
        if col_name in cols:
            op.drop_column('users', col_name)
