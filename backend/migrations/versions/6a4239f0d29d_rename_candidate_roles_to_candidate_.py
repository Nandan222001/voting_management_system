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

    # Rename candidate_roles -> candidate_committees if needed
    if 'candidate_roles' in tables and 'candidate_committees' not in tables:
        op.rename_table('candidate_roles', 'candidate_committees')

    # Rename role_id -> committee_id in candidates if needed
    columns = [c['name'] for c in inspector.get_columns('candidates')]
    if 'role_id' in columns and 'committee_id' not in columns:
        # Drop FK referencing role_id
        fks = inspector.get_foreign_keys('candidates')
        for fk in fks:
            if fk.get('constrained_columns') == ['role_id']:
                try:
                    op.drop_constraint(fk['name'], 'candidates', type_='foreignkey')
                except Exception:
                    pass
        # Drop old index
        try:
            op.drop_index('ix_candidates_role_id', table_name='candidates')
        except Exception:
            pass
        # Rename column
        op.alter_column('candidates', 'role_id', new_column_name='committee_id', existing_type=sa.Integer())

    # Ensure new index on committee_id exists
    try:
        op.create_index(op.f('ix_candidates_committee_id'), 'candidates', ['committee_id'], unique=False)
    except Exception:
        pass

    # Ensure new FK exists
    try:
        op.create_foreign_key(
            'fk_candidates_committee', 'candidates', 'candidate_committees',
            ['committee_id'], ['id'], ondelete='SET NULL'
        )
    except Exception:
        pass

    # Ensure candidate_committees has correct indexes
    if 'candidate_committees' in inspector.get_table_names():
        try:
            op.create_index(op.f('ix_candidate_committees_id'), 'candidate_committees', ['id'], unique=False)
        except Exception:
            pass
        try:
            op.create_index(op.f('ix_candidate_committees_tenant_id'), 'candidate_committees', ['tenant_id'], unique=False)
        except Exception:
            pass


def downgrade() -> None:
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    tables = inspector.get_table_names()

    try:
        op.drop_constraint('fk_candidates_committee', 'candidates', type_='foreignkey')
    except Exception:
        pass
    try:
        op.drop_index(op.f('ix_candidates_committee_id'), table_name='candidates')
    except Exception:
        pass

    if 'candidate_committees' in tables and 'candidate_roles' not in tables:
        op.rename_table('candidate_committees', 'candidate_roles')

    columns = [c['name'] for c in inspector.get_columns('candidates')]
    if 'committee_id' in columns and 'role_id' not in columns:
        op.alter_column('candidates', 'committee_id', new_column_name='role_id', existing_type=sa.Integer())

    try:
        op.create_index('ix_candidates_role_id', 'candidates', ['role_id'], unique=False)
    except Exception:
        pass
    try:
        op.create_foreign_key(
            'candidates_ibfk_3', 'candidates', 'candidate_roles',
            ['role_id'], ['id'], ondelete='SET NULL'
        )
    except Exception:
        pass
