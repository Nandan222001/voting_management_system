"""Rename candidate roles to candidate committees

Revision ID: 6a4239f0d29d
Revises: 3eae9dedd70a
Create Date: 2026-05-24 17:44:54.737901

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import mysql

# revision identifiers, used by Alembic.
revision = '6a4239f0d29d'
down_revision = '3eae9dedd70a'
branch_labels = None
depends_on = None


def upgrade() -> None:
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    tables = inspector.get_table_names()

    # Step 1: Ensure committee_id exists in candidates
    columns = [c['name'] for c in inspector.get_columns('candidates')]
    if 'role_id' in columns and 'committee_id' not in columns:
        # Drop any FK referencing role_id
        fks = inspector.get_foreign_keys('candidates')
        for fk in fks:
            if fk.get('constrained_columns') == ['role_id']:
                try:
                    op.drop_constraint(fk['name'], 'candidates', type_='foreignkey')
                except Exception:
                    pass
        try:
            op.drop_index('ix_candidates_role_id', table_name='candidates')
        except Exception:
            pass
        try:
            op.alter_column('candidates', 'role_id', new_column_name='committee_id', existing_type=sa.Integer())
        except Exception:
            pass

    # Step 2: Ensure candidate_committees table exists.
    # We CREATE + copy instead of RENAME TABLE because RENAME requires DROP privilege
    # which may not be available on shared hosting. The old candidate_roles table is
    # left in place as an unused orphan.
    if 'candidate_committees' not in tables:
        op.create_table(
            'candidate_committees',
            sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
            sa.Column('tenant_id', sa.Integer(), nullable=False),
            sa.Column('name', sa.String(length=150), nullable=False),
            sa.Column('created_at', sa.DateTime(), server_default=sa.func.now(), nullable=False),
            sa.Column('updated_at', sa.DateTime(), server_default=sa.func.now(), nullable=False),
            sa.ForeignKeyConstraint(['tenant_id'], ['tenants.id'], ondelete='CASCADE'),
            sa.PrimaryKeyConstraint('id'),
        )
        # Copy existing data from candidate_roles if it exists
        if 'candidate_roles' in tables:
            try:
                op.execute(
                    'INSERT INTO candidate_committees (id, tenant_id, name, created_at, updated_at) '
                    'SELECT id, tenant_id, name, created_at, updated_at FROM candidate_roles'
                )
            except Exception:
                pass

    # Step 3: Ensure indexes on candidate_committees
    try:
        op.create_index(op.f('ix_candidate_committees_id'), 'candidate_committees', ['id'], unique=False)
    except Exception:
        pass
    try:
        op.create_index(op.f('ix_candidate_committees_tenant_id'), 'candidate_committees', ['tenant_id'], unique=False)
    except Exception:
        pass

    # Step 4: Ensure index on candidates.committee_id
    try:
        op.create_index(op.f('ix_candidates_committee_id'), 'candidates', ['committee_id'], unique=False)
    except Exception:
        pass

    # Step 5: Ensure FK from candidates.committee_id -> candidate_committees
    try:
        op.create_foreign_key(
            'fk_candidates_committee', 'candidates', 'candidate_committees',
            ['committee_id'], ['id'], ondelete='SET NULL',
        )
    except Exception:
        pass


def downgrade() -> None:
    conn = op.get_bind()
    inspector = sa.inspect(conn)

    try:
        op.drop_constraint('fk_candidates_committee', 'candidates', type_='foreignkey')
    except Exception:
        pass
    try:
        op.drop_index(op.f('ix_candidates_committee_id'), table_name='candidates')
    except Exception:
        pass

    columns = [c['name'] for c in inspector.get_columns('candidates')]
    if 'committee_id' in columns and 'role_id' not in columns:
        try:
            op.alter_column('candidates', 'committee_id', new_column_name='role_id', existing_type=sa.Integer())
        except Exception:
            pass

    try:
        op.create_index('ix_candidates_role_id', 'candidates', ['role_id'], unique=False)
    except Exception:
        pass
    try:
        op.create_foreign_key(
            'candidates_ibfk_3', 'candidates', 'candidate_roles',
            ['role_id'], ['id'], ondelete='SET NULL',
        )
    except Exception:
        pass
