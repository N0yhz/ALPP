"""add_names_and_role_to_user

Revision ID: 55e43420f69d
Revises: 022895971a1b
Create Date: 2026-05-15 01:39:10.155971

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '55e43420f69d'
down_revision: Union[str, Sequence[str], None] = '022895971a1b'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column('users', sa.Column('first_name', sa.String(length=100), nullable=True))
    op.add_column('users', sa.Column('last_name', sa.String(length=100), nullable=True))
    op.add_column('users', sa.Column('role', sa.String(length=50), server_default='student', nullable=False))


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('users', 'role')
    op.drop_column('users', 'last_name')
    op.drop_column('users', 'first_name')
