"""Add candidate roles table and link to candidates

Revision ID: 3eae9dedd70a
Revises: 007
Create Date: 2026-05-24 17:33:30.984512

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '3eae9dedd70a'
down_revision = '007'
branch_labels = None
depends_on = None


def upgrade() -> None:
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    tables = inspector.get_table_names()

    # Create candidate_roles table if it doesn't exist
    if 'candidate_roles' not in tables and 'candidate_committees' not in tables:
        op.create_table(
            'candidate_roles',
            sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
            sa.Column('tenant_id', sa.Integer(), nullable=False),
            sa.Column('name', sa.String(length=150), nullable=False),
            sa.Column('created_at', sa.DateTime(), server_default=sa.func.now(), nullable=False),
            sa.Column('updated_at', sa.DateTime(), server_default=sa.func.now(), nullable=False),
            sa.ForeignKeyConstraint(['tenant_id'], ['tenants.id'], ondelete='CASCADE'),
            sa.PrimaryKeyConstraint('id'),
        )
        try:
            op.create_index(op.f('ix_candidate_roles_id'), 'candidate_roles', ['id'], unique=False)
        except Exception:
            pass
        try:
            op.create_index(op.f('ix_candidate_roles_tenant_id'), 'candidate_roles', ['tenant_id'], unique=False)
        except Exception:
            pass

    # Add role_id to candidates if neither role_id nor committee_id exists
    columns = [c['name'] for c in inspector.get_columns('candidates')]
    if 'role_id' not in columns and 'committee_id' not in columns:
        op.add_column('candidates', sa.Column('role_id', sa.Integer(), nullable=True))
        try:
            op.create_index(op.f('ix_candidates_role_id'), 'candidates', ['role_id'], unique=False)
        except Exception:
            pass
        try:
            ref_table = 'candidate_roles' if 'candidate_roles' in tables else 'candidate_committees'
            op.create_foreign_key(None, 'candidates', ref_table, ['role_id'], ['id'], ondelete='SET NULL')
        except Exception:
            pass


def downgrade() -> None:
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    columns = [c['name'] for c in inspector.get_columns('candidates')]

    if 'role_id' in columns:
        fks = inspector.get_foreign_keys('candidates')
        for fk in fks:
            if fk.get('constrained_columns') == ['role_id']:
                try:
                    op.drop_constraint(fk['name'], 'candidates', type_='foreignkey')
                except Exception:
                    pass
        try:
            op.drop_index(op.f('ix_candidates_role_id'), table_name='candidates')
        except Exception:
            pass
        op.drop_column('candidates', 'role_id')
