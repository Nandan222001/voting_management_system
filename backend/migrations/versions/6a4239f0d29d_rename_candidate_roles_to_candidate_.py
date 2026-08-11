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
    # 1. Drop existing FK
    op.drop_constraint('candidates_ibfk_3', 'candidates', type_='foreignkey')
    
    # 2. Drop existing index
    op.drop_index('ix_candidates_role_id', table_name='candidates')
    
    # 3. Rename the column in candidates
    op.alter_column('candidates', 'role_id', new_column_name='committee_id', existing_type=sa.Integer())
    
    # 4. Rename the main table
    op.rename_table('candidate_roles', 'candidate_committees')
    
    # 5. Rename indexes on the renamed table (MySQL keeps old index names)
    op.execute('ALTER TABLE candidate_committees RENAME INDEX ix_candidate_roles_id TO ix_candidate_committees_id')
    op.execute('ALTER TABLE candidate_committees RENAME INDEX ix_candidate_roles_tenant_id TO ix_candidate_committees_tenant_id')
    
    # 6. Create new index on candidates
    op.create_index(op.f('ix_candidates_committee_id'), 'candidates', ['committee_id'], unique=False)
    
    # 7. Create new FK on candidates
    op.create_foreign_key('fk_candidates_committee', 'candidates', 'candidate_committees', ['committee_id'], ['id'], ondelete='SET NULL')


def downgrade() -> None:
    # 1. Drop new FK
    op.drop_constraint('fk_candidates_committee', 'candidates', type_='foreignkey')
    
    # 2. Drop new index
    op.drop_index(op.f('ix_candidates_committee_id'), table_name='candidates')
    
    # 3. Rename table back
    op.rename_table('candidate_committees', 'candidate_roles')
    
    # 4. Rename column back
    op.alter_column('candidates', 'committee_id', new_column_name='role_id', existing_type=sa.Integer())
    
    # 5. Create old index
    op.create_index('ix_candidates_role_id', 'candidates', ['role_id'], unique=False)
    
    # 6. Create old FK
    op.create_foreign_key('candidates_ibfk_3', 'candidates', 'candidate_roles', ['role_id'], ['id'], ondelete='SET NULL')
