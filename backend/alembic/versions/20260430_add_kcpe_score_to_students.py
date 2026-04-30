"""add kcpe_score to students

Revision ID: 20260430
Revises: 20260421_01_add_fee_management_tables
Create Date: 2026-04-30

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '20260430'
down_revision = '20260421_01_add_fee_management_tables'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column('students', sa.Column('kcpe_score', sa.Integer(), nullable=True))


def downgrade() -> None:
    op.drop_column('students', 'kcpe_score')
