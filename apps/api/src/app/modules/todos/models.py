import uuid

from sqlalchemy import ForeignKey, Index, String, Text, desc
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base, TimestampMixin, UUIDPrimaryKeyMixin


class Todo(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "todos"
    __table_args__ = (
        # Keyset pagination: `where owner_id = :id order by created_at desc, id desc`.
        Index("ix_todos_owner_created_at_id", "owner_id", desc("created_at"), desc("id")),
    )

    # Cross-module reference by id only — no ORM relationship to `users`.
    # Indexed through `ix_todos_owner_created_at_id`, which starts with this column.
    owner_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"))
    title: Mapped[str] = mapped_column(String(255))
    description: Mapped[str | None] = mapped_column(Text)
    completed: Mapped[bool] = mapped_column(default=False)
