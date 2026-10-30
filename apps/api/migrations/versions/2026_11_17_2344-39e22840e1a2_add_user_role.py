"""add user role

Revision ID: 39e22840e1a2
Revises: 5f0e115d36c6
Create Date: 2026-11-17 23:44:49.479288

"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "39e22840e1a2"
down_revision: str | Sequence[str] | None = "5f0e115d36c6"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column(
        "users", sa.Column("role", sa.String(length=32), server_default="member", nullable=False)
    )


def downgrade() -> None:
    op.drop_column("users", "role")
