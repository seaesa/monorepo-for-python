from collections import Counter

from app.main import create_app


def test_operation_ids_are_unique() -> None:
    schema = create_app().openapi()
    ids = [op["operationId"] for path in schema["paths"].values() for op in path.values()]
    duplicates = [name for name, count in Counter(ids).items() if count > 1]
    assert not duplicates, f"Rename route handlers, operationIds must be unique: {duplicates}"


def test_schemas_use_camel_case() -> None:
    schema = create_app().openapi()
    props = schema["components"]["schemas"]["TodoRead"]["properties"]
    assert "dueDate" in props
    assert "due_date" not in props
