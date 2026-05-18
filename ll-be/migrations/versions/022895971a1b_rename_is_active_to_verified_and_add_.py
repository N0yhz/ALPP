"""rename is_active to verified and add new is_active

Revision ID: 022895971a1b
Revises: 3ce4fd430e9f
Create Date: 2026-05-14 13:38:54.001755

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '022895971a1b'
down_revision: Union[str, Sequence[str], None] = '3ce4fd430e9f'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Rename is_active to verified
    op.alter_column('users', 'is_active', new_column_name='verified')
    # Add new is_active column
    op.add_column('users', sa.Column('is_active', sa.Boolean(), nullable=False, server_default=sa.text('true')))


def downgrade() -> None:
    # Remove is_active column
    op.drop_column('users', 'is_active')
    # Rename verified back to is_active
    op.alter_column('users', 'verified', new_column_name='is_active')
