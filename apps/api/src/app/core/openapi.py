from collections.abc import Callable, Sequence
from typing import Any

from fastapi import FastAPI
from fastapi.routing import APIRoute
from pydantic.json_schema import models_json_schema

from app.core.realtime import Event


def generate_operation_id(route: APIRoute) -> str:
    """Use the handler function name as operationId.

    The generated TS client derives SDK / React Query names from it
    (`list_todos` -> `listTodos`, `listTodosOptions`), so handler names must be
    unique across the whole API. `tests/test_openapi.py` enforces this.
    """
    return route.name


def include_realtime_events(app: FastAPI, events: Sequence[type[Event]]) -> None:
    """Add realtime payload schemas + a `RealtimeEvents` map (event name -> payload) to OpenAPI.

    Socket events are not HTTP routes, so FastAPI cannot document them; this keeps them in the
    same contract, giving the frontend generated TS types/Zod schemas for every event.
    """
    base: Callable[[], dict[str, Any]] = app.openapi

    def openapi() -> dict[str, Any]:
        schema = base()
        schemas = schema.setdefault("components", {}).setdefault("schemas", {})
        if "RealtimeEvents" in schemas or not events:
            return schema
        _, defs = models_json_schema(
            [(event, "serialization") for event in events],
            by_alias=True,
            ref_template="#/components/schemas/{model}",
        )
        schemas.update(defs.get("$defs", {}))
        schemas["RealtimeEvents"] = {
            "type": "object",
            "description": "Socket.IO events sent by the server: event name -> payload.",
            "properties": {
                e.event_name: {"$ref": f"#/components/schemas/{e.__name__}"} for e in events
            },
            "required": [e.event_name for e in events],
        }
        return schema

    app.openapi = openapi  # type: ignore[method-assign]
