"""split_role_and_job_role

Revision ID: 52a5880a5326
Revises: 55e43420f69d
Create Date: 2026-05-16 11:43:34.546685

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '52a5880a5326'
down_revision: Union[str, Sequence[str], None] = '55e43420f69d'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Add job_role column
    op.add_column('users', sa.Column('job_role', sa.String(length=50), nullable=True))
    
    # 2. Data migration: Move current role (student/teacher/admin) to job_role
    # and set system role to user (or admin if they were already admin)
    op.execute("UPDATE users SET job_role = role")
    op.execute("UPDATE users SET role = 'admin' WHERE role = 'admin'")
    op.execute("UPDATE users SET role = 'user' WHERE role != 'admin'")
    
    # 3. Change server default for role to 'user'
    op.alter_column('users', 'role', server_default='user')


def downgrade() -> None:
    # 1. Change server default back to 'student'
    op.alter_column('users', 'role', server_default='student')
    
    # 2. Move job_role back to role (best effort)
    op.execute("UPDATE users SET role = job_role WHERE job_role IN ('student', 'teacher', 'admin')")
    
    # 3. Drop job_role column
    op.drop_column('users', 'job_role')
