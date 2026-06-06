"""Add geographical targets entity and link to elections candidates and users

Revision ID: e74e89c267f5
Revises: 6a4239f0d29d
Create Date: 2026-05-24 18:26:07.538134

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'e74e89c267f5'
down_revision = '6a4239f0d29d'
branch_labels = None
depends_on = None


def upgrade() -> None:
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    tables = inspector.get_table_names()

    # Create targets table if it doesn't exist
    if 'targets' not in tables:
        op.create_table(
            'targets',
            sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
            sa.Column('tenant_id', sa.Integer(), nullable=False),
            sa.Column('name', sa.String(length=150), nullable=False),
            sa.Column('type', sa.Enum('state', 'district', 'zone', 'ward', 'other', name='target_type_enum'), nullable=False),
            sa.Column('parent_id', sa.Integer(), nullable=True),
            sa.Column('created_at', sa.DateTime(), server_default=sa.func.now(), nullable=False),
            sa.Column('updated_at', sa.DateTime(), server_default=sa.func.now(), nullable=False),
            sa.ForeignKeyConstraint(['parent_id'], ['targets.id'], ondelete='SET NULL'),
            sa.ForeignKeyConstraint(['tenant_id'], ['tenants.id'], ondelete='CASCADE'),
            sa.PrimaryKeyConstraint('id'),
        )
        try:
            op.create_index(op.f('ix_targets_id'), 'targets', ['id'], unique=False)
        except Exception:
            pass
        try:
            op.create_index(op.f('ix_targets_parent_id'), 'targets', ['parent_id'], unique=False)
        except Exception:
            pass
        try:
            op.create_index(op.f('ix_targets_tenant_id'), 'targets', ['tenant_id'], unique=False)
        except Exception:
            pass

    # Add target_id to candidates
    cand_cols = [c['name'] for c in inspector.get_columns('candidates')]
    if 'target_id' not in cand_cols:
        op.add_column('candidates', sa.Column('target_id', sa.Integer(), nullable=True))
        try:
            op.create_index(op.f('ix_candidates_target_id'), 'candidates', ['target_id'], unique=False)
        except Exception:
            pass
        try:
            op.create_foreign_key(None, 'candidates', 'targets', ['target_id'], ['id'], ondelete='SET NULL')
        except Exception:
            pass

    # Add target_id to elections
    elec_cols = [c['name'] for c in inspector.get_columns('elections')]
    if 'target_id' not in elec_cols:
        op.add_column('elections', sa.Column('target_id', sa.Integer(), nullable=True))
        try:
            op.create_index(op.f('ix_elections_target_id'), 'elections', ['target_id'], unique=False)
        except Exception:
            pass
        try:
            op.create_foreign_key(None, 'elections', 'targets', ['target_id'], ['id'], ondelete='SET NULL')
        except Exception:
            pass

    # Add target_id to users
    user_cols = [c['name'] for c in inspector.get_columns('users')]
    if 'target_id' not in user_cols:
        op.add_column('users', sa.Column('target_id', sa.Integer(), nullable=True))
        try:
            op.create_index(op.f('ix_users_target_id'), 'users', ['target_id'], unique=False)
        except Exception:
            pass
        try:
            op.create_foreign_key(None, 'users', 'targets', ['target_id'], ['id'], ondelete='SET NULL')
        except Exception:
            pass


def downgrade() -> None:
    conn = op.get_bind()
    inspector = sa.inspect(conn)

    user_cols = [c['name'] for c in inspector.get_columns('users')]
    if 'target_id' in user_cols:
        fks = inspector.get_foreign_keys('users')
        for fk in fks:
            if fk.get('constrained_columns') == ['target_id']:
                try:
                    op.drop_constraint(fk['name'], 'users', type_='foreignkey')
                except Exception:
                    pass
        try:
            op.drop_index(op.f('ix_users_target_id'), table_name='users')
        except Exception:
            pass
        op.drop_column('users', 'target_id')

    elec_cols = [c['name'] for c in inspector.get_columns('elections')]
    if 'target_id' in elec_cols:
        fks = inspector.get_foreign_keys('elections')
        for fk in fks:
            if fk.get('constrained_columns') == ['target_id']:
                try:
                    op.drop_constraint(fk['name'], 'elections', type_='foreignkey')
                except Exception:
                    pass
        try:
            op.drop_index(op.f('ix_elections_target_id'), table_name='elections')
        except Exception:
            pass
        op.drop_column('elections', 'target_id')

    cand_cols = [c['name'] for c in inspector.get_columns('candidates')]
    if 'target_id' in cand_cols:
        fks = inspector.get_foreign_keys('candidates')
        for fk in fks:
            if fk.get('constrained_columns') == ['target_id']:
                try:
                    op.drop_constraint(fk['name'], 'candidates', type_='foreignkey')
                except Exception:
                    pass
        try:
            op.drop_index(op.f('ix_candidates_target_id'), table_name='candidates')
        except Exception:
            pass
        op.drop_column('candidates', 'target_id')

    tables = inspector.get_table_names()
    if 'targets' in tables:
        try:
            op.drop_index(op.f('ix_targets_tenant_id'), table_name='targets')
        except Exception:
            pass
        try:
            op.drop_index(op.f('ix_targets_parent_id'), table_name='targets')
        except Exception:
            pass
        try:
            op.drop_index(op.f('ix_targets_id'), table_name='targets')
        except Exception:
            pass
        op.drop_table('targets')
