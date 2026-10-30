"""add push devices

Revision ID: 5f0e115d36c6
Revises: 4fb3d677a10e
Create Date: 2026-11-17 23:10:05.880441

"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "5f0e115d36c6"
down_revision: str | Sequence[str] | None = "4fb3d677a10e"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table(
        "push_devices",
        sa.Column("user_id", sa.Uuid(), nullable=False),
        sa.Column("token", sa.String(length=255), nullable=False),
        sa.Column("platform", sa.String(length=16), nullable=False),
        sa.Column("locale", sa.String(length=8), server_default="en", nullable=False),
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(
            ["user_id"],
            ["users.id"],
            name=op.f("fk_push_devices_user_id_users"),
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_push_devices")),
        sa.UniqueConstraint("token", name=op.f("uq_push_devices_token")),
    )
    op.create_index(op.f("ix_push_devices_user_id"), "push_devices", ["user_id"], unique=False)


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index(op.f("ix_push_devices_user_id"), table_name="push_devices")
    op.drop_table("push_devices")
