import uuid
from collections.abc import Sequence

from sqlalchemy import ColumnElement

from app.modules.todos.models import Todo
from app.modules.todos.schemas import TodoFilter
from app.shared.repository import BaseRepository


class TodoRepository(BaseRepository[Todo]):
    model = Todo

    async def list_for_owner(
        self, owner_id: uuid.UUID, params: TodoFilter
    ) -> tuple[Sequence[Todo], int]:
        filters: list[ColumnElement[bool]] = [Todo.owner_id == owner_id]
        if params.completed is not None:
            filters.append(Todo.completed == params.completed)
        if params.search:
            filters.append(Todo.title.ilike(f"%{params.search}%"))
        return await self.paginate(
            *filters,
            offset=params.offset,
            limit=params.size,
            order_by=[Todo.completed, Todo.created_at.desc()],
        )
