"""Module registry.

Adding a module = create `app/modules/<name>/` (models, schemas, repository,
service, provider, router, tasks, events) and register it below. Celery tasks are
also listed in `app/worker.py`.
"""

from fastapi import APIRouter

from app.core.realtime import Event
from app.modules.auth.provider import AuthProvider
from app.modules.auth.router import router as auth_router
from app.modules.health.router import router as health_router
from app.modules.todos.events import TodoChanged
from app.modules.todos.provider import TodosProvider
from app.modules.todos.router import router as todos_router
from app.modules.users.provider import UsersProvider
from app.modules.users.router import router as users_router

MODULE_PROVIDERS = [UsersProvider, AuthProvider, TodosProvider]

MODULE_ROUTERS: list[APIRouter] = [health_router, auth_router, users_router, todos_router]

# Socket.IO payloads, exported to OpenAPI so the frontend gets typed events.
REALTIME_EVENTS: list[type[Event]] = [TodoChanged]
