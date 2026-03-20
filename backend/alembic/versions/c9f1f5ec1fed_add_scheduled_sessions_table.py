"""add_scheduled_sessions_table

Revision ID: c9f1f5ec1fed
Revises: b8e0e4db0edc
Create Date: 2026-03-21 04:53:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = 'c9f1f5ec1fed'
down_revision: Union[str, Sequence[str], None] = 'b8e0e4db0edc'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Create scheduled_sessions table."""
    op.create_table('scheduled_sessions',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('user_id', sa.Uuid(), nullable=False),
        sa.Column('title', sa.String(length=255), nullable=False),
        sa.Column('type', sa.String(length=50), nullable=False),
        sa.Column('date', sa.String(length=10), nullable=False),
        sa.Column('time', sa.String(length=5), nullable=False),
        sa.Column('duration', sa.Integer(), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('location', sa.String(length=50), nullable=False),
        sa.Column('participants', sa.Integer(), nullable=False),
        sa.Column('reminder', sa.Boolean(), nullable=False),
        sa.Column('status', sa.String(length=20), nullable=False),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_scheduled_sessions_user_id'), 'scheduled_sessions', ['user_id'], unique=False)


def downgrade() -> None:
    """Drop scheduled_sessions table."""
    op.drop_index(op.f('ix_scheduled_sessions_user_id'), table_name='scheduled_sessions')
    op.drop_table('scheduled_sessions')
