"""add_profile_data_to_users

Revision ID: b8e0e4db0edc
Revises: 8427a7d90acb
Create Date: 2026-03-21 04:52:38.010900

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = 'b8e0e4db0edc'
down_revision: Union[str, Sequence[str], None] = '8427a7d90acb'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add profile_data JSONB column to users table."""
    op.add_column('users', sa.Column('profile_data', postgresql.JSONB(astext_type=sa.Text()), nullable=True))


def downgrade() -> None:
    """Remove profile_data column from users table."""
    op.drop_column('users', 'profile_data')
