import uuid
from collections.abc import Sequence

from sqlalchemy import ColumnElement, tuple_

from app.modules.todos.models import Todo
from app.modules.todos.schemas import TodoFilter
from app.shared.repository import BaseRepository


class TodoRepository(BaseRepository[Todo]):
    model = Todo

    async def list_for_owner(self, owner_id: uuid.UUID, params: TodoFilter) -> Sequence[Todo]:
        """One page of the owner's todos, newest first, using the keyset index.

        Fetches `limit + 1` rows so the service can tell whether another page exists.
        """
        filters: list[ColumnElement[bool]] = [Todo.owner_id == owner_id]
        if params.completed is not None:
            filters.append(Todo.completed == params.completed)
        after = params.after
        if after is not None:
            filters.append(tuple_(Todo.created_at, Todo.id) < tuple_(after[0], after[1]))
        return await self.list(
            *filters,
            order_by=[Todo.created_at.desc(), Todo.id.desc()],
            limit=params.limit + 1,
        )
