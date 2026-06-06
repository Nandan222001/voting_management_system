"""Expand candidate details for nomination

Revision ID: 4008e83140c8
Revises: 0f69675582e6
Create Date: 2026-05-31 02:45:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '4008e83140c8'
down_revision = '0f69675582e6'
branch_labels = None
depends_on = None


def upgrade() -> None:
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    cols = [c['name'] for c in inspector.get_columns('candidates')]

    new_cols = [
        ('email', sa.String(length=150)),
        ('phone', sa.String(length=20)),
        ('date_of_birth', sa.String(length=50)),
        ('gender', sa.String(length=20)),
        ('parent_name', sa.String(length=150)),
        ('kyc_type', sa.String(length=50)),
        ('voter_id_number', sa.String(length=50)),
        ('state', sa.String(length=100)),
        ('district', sa.String(length=100)),
        ('taluka', sa.String(length=100)),
        ('village', sa.String(length=100)),
        ('pincode', sa.String(length=20)),
        ('is_willing', sa.Boolean()),
        ('held_previously', sa.Boolean()),
        ('prev_position', sa.String(length=150)),
        ('prev_duration', sa.String(length=100)),
        ('is_disciplined', sa.Boolean()),
        ('discipline_details', sa.Text()),
        ('has_complaints', sa.Boolean()),
        ('agreed_constitution', sa.Boolean()),
        ('accepted_results', sa.Boolean()),
        ('signature_url', sa.String(length=500)),
    ]
    for col_name, col_type in new_cols:
        if col_name not in cols:
            op.add_column('candidates', sa.Column(col_name, col_type, nullable=True))


def downgrade() -> None:
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    cols = [c['name'] for c in inspector.get_columns('candidates')]

    drop_cols = [
        'signature_url', 'accepted_results', 'agreed_constitution', 'has_complaints',
        'discipline_details', 'is_disciplined', 'prev_duration', 'prev_position',
        'held_previously', 'is_willing', 'pincode', 'village', 'taluka', 'district',
        'state', 'voter_id_number', 'kyc_type', 'parent_name', 'gender',
        'date_of_birth', 'phone', 'email',
    ]
    for col_name in drop_cols:
        if col_name in cols:
            op.drop_column('candidates', col_name)
