# api

FastAPI modular monolith. See [AGENTS.md](./AGENTS.md) for architecture and rules.

```bash
cp .env.example .env
docker compose -f ../../docker-compose.yml up -d postgres redis
uv sync
uv run alembic upgrade head
uv run fastapi dev src/app/main.py     # http://localhost:8000/docs
uv run celery -A app.worker worker -l info
```
