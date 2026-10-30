from httpx import AsyncClient

from app.core.mail import OutboxEmailSender
from tests.helpers import register_verified


async def test_todo_crud(auth_client: AsyncClient) -> None:
    response = await auth_client.post("/todos", json={"title": "Write tests"})
    assert response.status_code == 201
    todo = response.json()
    assert todo["completed"] is False

    response = await auth_client.patch(f"/todos/{todo['id']}", json={"completed": True})
    assert response.json()["completed"] is True

    response = await auth_client.get("/todos", params={"completed": True})
    body = response.json()
    assert [todo_["id"] for todo_ in body["items"]] == [todo["id"]]
    assert body["nextCursor"] is None

    assert (await auth_client.delete(f"/todos/{todo['id']}")).status_code == 204
    assert (await auth_client.get(f"/todos/{todo['id']}")).status_code == 404


async def test_todos_are_isolated_per_owner(
    auth_client: AsyncClient, outbox: OutboxEmailSender
) -> None:
    todo = (await auth_client.post("/todos", json={"title": "Private"})).json()

    other = await register_verified(auth_client, outbox, "other@example.com", full_name="Other")
    headers = {"Authorization": f"Bearer {other['accessToken']}"}
    assert (await auth_client.get(f"/todos/{todo['id']}", headers=headers)).status_code == 404
    assert (await auth_client.get("/todos", headers=headers)).json()["items"] == []
