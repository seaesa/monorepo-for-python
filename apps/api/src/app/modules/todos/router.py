import uuid
from typing import Annotated

from dishka.integrations.fastapi import DishkaRoute, FromDishka
from fastapi import APIRouter, Path, Query, status

from app.modules.auth.dependencies import CurrentUser
from app.modules.todos.schemas import TodoCreate, TodoFilter, TodoRead, TodoUpdate
from app.modules.todos.service import TodoService
from app.shared.schemas import Page

# Path params are camelCase on the wire, like every other field.
TodoId = Annotated[uuid.UUID, Path(alias="todoId")]

router = APIRouter(prefix="/todos", tags=["todos"], route_class=DishkaRoute)


@router.get("")
async def list_todos(
    params: Annotated[TodoFilter, Query()], user: CurrentUser, service: FromDishka[TodoService]
) -> Page[TodoRead]:
    return await service.list(user.id, params)


@router.post("", status_code=status.HTTP_201_CREATED)
async def create_todo(
    data: TodoCreate, user: CurrentUser, service: FromDishka[TodoService]
) -> TodoRead:
    return TodoRead.model_validate(await service.create(user.id, data))


@router.get("/{todoId}")
async def get_todo(
    todo_id: TodoId, user: CurrentUser, service: FromDishka[TodoService]
) -> TodoRead:
    return TodoRead.model_validate(await service.get(user.id, todo_id))


@router.patch("/{todoId}")
async def update_todo(
    todo_id: TodoId, data: TodoUpdate, user: CurrentUser, service: FromDishka[TodoService]
) -> TodoRead:
    return TodoRead.model_validate(await service.update(user.id, todo_id, data))


@router.delete("/{todoId}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_todo(todo_id: TodoId, user: CurrentUser, service: FromDishka[TodoService]) -> None:
    await service.delete(user.id, todo_id)
