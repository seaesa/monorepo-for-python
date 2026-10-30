# api

FastAPI modular monolith. Rules and architecture: [AGENTS.md](./AGENTS.md).

```bash
pnpm infra:up                          # from the root: Postgres + Redis + Mailpit
uv sync
uv run alembic upgrade head
uv run fastapi dev src/app/main.py     # http://localhost:8000/docs
uv run celery -A app.worker worker -l info
```

Development settings come from the committed `.env.development`; override locally in `.env`.
