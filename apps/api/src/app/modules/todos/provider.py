from dishka import Provider, Scope, provide

from app.modules.todos.repository import TodoRepository
from app.modules.todos.service import TodoService


class TodosProvider(Provider):
    scope = Scope.REQUEST

    repository = provide(TodoRepository)
    service = provide(TodoService)
