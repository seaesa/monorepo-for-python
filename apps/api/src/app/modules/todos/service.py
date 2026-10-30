import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import NotFoundError
from app.core.realtime import RealtimePublisher
from app.modules.todos.events import TodoChanged
from app.modules.todos.models import Todo
from app.modules.todos.repository import TodoRepository
from app.modules.todos.schemas import TodoCreate, TodoFilter, TodoRead, TodoUpdate
from app.shared.schemas import Page


class TodoService:
    def __init__(
        self, session: AsyncSession, todos: TodoRepository, realtime: RealtimePublisher
    ) -> None:
        self.session = session
        self.todos = todos
        self.realtime = realtime

    async def _get_owned(self, owner_id: uuid.UUID, todo_id: uuid.UUID) -> Todo:
        todo = await self.todos.get(todo_id)
        if todo is None or todo.owner_id != owner_id:
            raise NotFoundError("Todo not found")
        return todo

    async def list(self, owner_id: uuid.UUID, params: TodoFilter) -> Page[TodoRead]:
        items, total = await self.todos.list_for_owner(owner_id, params)
        return Page[TodoRead].create(
            [TodoRead.model_validate(t) for t in items], total, params.page, params.size
        )

    async def get(self, owner_id: uuid.UUID, todo_id: uuid.UUID) -> Todo:
        return await self._get_owned(owner_id, todo_id)

    async def create(self, owner_id: uuid.UUID, data: TodoCreate) -> Todo:
        todo = await self.todos.create(owner_id=owner_id, **data.model_dump())
        await self.session.commit()
        await self.realtime.to_user(
            owner_id, TodoChanged(action="created", id=todo.id, todo=TodoRead.model_validate(todo))
        )
        return todo

    async def update(self, owner_id: uuid.UUID, todo_id: uuid.UUID, data: TodoUpdate) -> Todo:
        todo = await self._get_owned(owner_id, todo_id)
        todo = await self.todos.update(todo, **data.model_dump(exclude_unset=True))
        await self.session.commit()
        await self.realtime.to_user(
            owner_id, TodoChanged(action="updated", id=todo.id, todo=TodoRead.model_validate(todo))
        )
        return todo

    async def delete(self, owner_id: uuid.UUID, todo_id: uuid.UUID) -> None:
        await self.todos.delete(await self._get_owned(owner_id, todo_id))
        await self.session.commit()
        await self.realtime.to_user(owner_id, TodoChanged(action="deleted", id=todo_id))
