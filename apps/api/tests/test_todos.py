from httpx import AsyncClient


async def test_todo_crud(auth_client: AsyncClient) -> None:
    response = await auth_client.post("/todos", json={"title": "Write tests"})
    assert response.status_code == 201
    todo = response.json()
    assert todo["completed"] is False

    response = await auth_client.patch(f"/todos/{todo['id']}", json={"completed": True})
    assert response.json()["completed"] is True

    response = await auth_client.get("/todos", params={"completed": True})
    page = response.json()
    assert page["total"] == 1
    assert page["pages"] == 1
    assert page["items"][0]["id"] == todo["id"]

    assert (await auth_client.delete(f"/todos/{todo['id']}")).status_code == 204
    assert (await auth_client.get(f"/todos/{todo['id']}")).status_code == 404


async def test_pagination_and_search(auth_client: AsyncClient) -> None:
    for i in range(5):
        await auth_client.post("/todos", json={"title": f"Task {i}"})
    await auth_client.post("/todos", json={"title": "Buy milk"})

    page = (await auth_client.get("/todos", params={"page": 2, "size": 4})).json()
    assert (page["total"], page["pages"], len(page["items"])) == (6, 2, 2)

    page = (await auth_client.get("/todos", params={"search": "milk"})).json()
    assert [t["title"] for t in page["items"]] == ["Buy milk"]


async def test_todos_are_isolated_per_owner(auth_client: AsyncClient) -> None:
    todo = (await auth_client.post("/todos", json={"title": "Private"})).json()

    other = (
        await auth_client.post(
            "/auth/register",
            json={"email": "other@example.com", "fullName": "Other", "password": "secret123"},
        )
    ).json()
    headers = {"Authorization": f"Bearer {other['accessToken']}"}
    assert (await auth_client.get(f"/todos/{todo['id']}", headers=headers)).status_code == 404
    assert (await auth_client.get("/todos", headers=headers)).json()["total"] == 0
