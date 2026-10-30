import uuid
from typing import ClassVar, Literal

from app.core.realtime import Event
from app.modules.todos.schemas import TodoRead


class TodoChanged(Event):
    """Sent to the owner (all their devices) after any todo write."""

    event_name: ClassVar[str] = "todo.changed"

    action: Literal["created", "updated", "deleted"]
    id: uuid.UUID
    todo: TodoRead | None = None
