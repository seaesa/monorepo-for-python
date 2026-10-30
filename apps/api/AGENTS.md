# apps/api — FastAPI modular monolith

Python 3.13, managed by **uv** (never pip/poetry). Run everything with `uv run …` from this folder.

## Layout

```
src/app/
  main.py            create_app(): middleware, error handlers, routers, Socket.IO mount, DI
  worker.py          Celery app (task packages listed in autodiscover_tasks)
  core/              cross-cutting infra — no business logic
    config.py        Settings (pydantic-settings, env / .env)
    database.py      Base, UUIDPrimaryKeyMixin, TimestampMixin, engine/session factories
    ioc.py           Dishka InfrastructureProvider + create_container()
    realtime.py      Socket.IO server (Redis pub/sub), Event base, RealtimePublisher
    exceptions.py    AppError hierarchy (code + optional field), handlers, ERROR_RESPONSES
    security.py      password hashing (argon2), JWT TokenEncoder
    openapi.py       operationId = handler name; realtime events added to OpenAPI
    logging.py       structlog
  shared/
    schemas.py       Schema (camelCase base), Page[T], PageParams, ErrorCode, FieldError, ErrorResponse
    repository.py    BaseRepository[Model] (get/get_one/find_one/list/count/paginate/create/update/delete)
  modules/
    __init__.py      MODULE_PROVIDERS + MODULE_ROUTERS + REALTIME_EVENTS registry
    <module>/        models · schemas · repository · service · provider · router · tasks · events
migrations/          Alembic (async), file names prefixed by date
tests/               pytest against real Postgres + Redis (db `app_test`, redis db 15)
scripts/export_openapi.py   writes ../../packages/api-client/openapi.json
```

## Architecture: DI + repository + service

```
router  ──►  service  ──►  repository  ──►  DB          (inside one module)
               │
               └──►  other module's SERVICE  (never its repository, models or tables)
```

| Layer | May depend on | Must not |
| --- | --- | --- |
| `router.py` | its service, `CurrentUser`, schemas | touch repositories/session, contain logic, raise `HTTPException` |
| `service.py` | its repository, `AsyncSession` (commit), `RealtimePublisher`, **other modules' services** | import or query another module's repository, models or tables |
| `repository.py` | its own model, `BaseRepository` | commit, know about HTTP or other modules |
| `models.py` | `core.database` | ORM `relationship()` across modules (reference by id + FK only) |

`tests/test_architecture.py` fails if a module imports another module's repository. Everything is
wired by Dishka: each module's `provider.py` registers its repository and service; services get
their dependencies through `__init__`.

## Rules

- **Transactions:** repositories `flush()`; services call `await self.session.commit()` after a write. Side effects (Celery `.delay()`, realtime events) go **after** the commit. Read-only methods never commit.
- **Errors:** raise `NotFoundError`, `ConflictError`, `UnauthorizedError`, `ForbiddenError` or an `AppError` subclass. Codes come from the `ErrorCode` enum (`shared/schemas.py`) — add a member for each new case (clients translate by code; typecheck in `packages/i18n` forces the translation). Pass `field="<camelCaseField>"` when the error belongs to one input so forms show it under that field. `message` is an English fallback only; never rely on it for UI.
- **Schemas:** every request/response model inherits `app.shared.schemas.Schema` (camelCase aliases, `from_attributes`). Name them `<Entity>Read/Create/Update/Filter`. Put validation constraints on fields (`Field(min_length=…)`): they become Zod rules in the frontend.
- **Routers:** `APIRouter(prefix=…, tags=[…], route_class=DishkaRoute)`. Inject with `FromDishka[Service]`; auth with `user: CurrentUser`. Always annotate the return type (it becomes the response schema). Path params are camelCase: `Annotated[uuid.UUID, Path(alias="todoId")]` with `"/{todoId}"`.
- **operationId = handler function name**, and the TS SDK is named after it (`list_todos` → `listTodos`, `listTodosOptions`). Names must be unique across the API (`tests/test_openapi.py` checks this) and should be `verb_noun`.
- **DI:** each module has a `provider.py` (`Provider` with `scope = Scope.REQUEST`, `provide(Class)`); register it in `MODULE_PROVIDERS`. App-wide singletons (engine, Redis, settings, `RealtimePublisher`) live in `core/ioc.py`.
- **Background work:** Celery tasks in `<module>/tasks.py` (`@celery_app.task`), called via `.delay()` after commit. Add the module to `autodiscover_tasks` in `worker.py`. Tasks run eagerly when `ENVIRONMENT=test`.
- **Realtime:** Socket.IO at `/ws/socket.io` on the API origin; clients send `auth: { token }` and join room `user:<id>` (all their devices). Define payloads in `<module>/events.py` (subclass `Event`, set `event_name = "<module>.<what>"`), add them to `REALTIME_EVENTS`, inject `RealtimePublisher` in the service and call `await self.realtime.to_user(user_id, event)` after commit. Run `pnpm codegen` so the frontend gets the typed event.
- **Pagination:** accept `Annotated[<X>Filter, Query()]` (subclass of `PageParams`), return `Page[<X>Read]` built with `Page.create(...)`.

## Adding a module (checklist)

1. `modules/<name>/models.py` — inherit `UUIDPrimaryKeyMixin, TimestampMixin, Base`.
2. `schemas.py`, `repository.py` (subclass `BaseRepository[Model]`, set `model`), `service.py`, `provider.py`, `router.py`.
3. Register provider + router in `modules/__init__.py` (tasks in `worker.py`, events in `REALTIME_EVENTS`).
4. `uv run alembic revision --autogenerate -m "<change>"`, review the file, `uv run alembic upgrade head`.
5. Tests in `tests/test_<name>.py` using the `client` / `auth_client` fixtures.
6. From repo root: `pnpm codegen`.

## Commands

```bash
uv sync                                  # install
uv add <pkg> / uv add --dev <pkg>        # dependencies (updates uv.lock; commit it)
uv run fastapi dev src/app/main.py       # http://localhost:8000/docs
uv run celery -A app.worker worker -l info
uv run alembic upgrade head | uv run alembic check
uv run ruff check --fix . && uv run ruff format .
uv run mypy src                          # strict
uv run pytest                            # needs `pnpm infra:up`
```

Done = `ruff check`, `ruff format --check`, `mypy src`, `alembic check`, `pytest` all pass, and `pnpm codegen` was run if any schema/route changed.
