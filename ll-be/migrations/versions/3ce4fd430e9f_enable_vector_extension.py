"""enable_vector_extension

Revision ID: 3ce4fd430e9f
Revises: 622b3bc23503
Create Date: 2026-05-14 11:33:56.384035

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '3ce4fd430e9f'
down_revision: Union[str, Sequence[str], None] = '622b3bc23503'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.execute("CREATE EXTENSION IF NOT EXISTS vector;")


def downgrade() -> None:
    """Downgrade schema."""
    op.execute("DROP EXTENSION IF EXISTS vector;")
