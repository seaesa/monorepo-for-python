"""`GET /todos` is keyset-paginated: stable pages, no duplicates, no total count."""

from httpx import AsyncClient


async def _seed(client: AsyncClient, count: int) -> list[str]:
    created = []
    for index in range(count):
        response = await client.post("/todos", json={"title": f"todo {index}"})
        created.append(response.json()["id"])
    return created


async def test_first_page_returns_the_limit_and_a_cursor(auth_client: AsyncClient) -> None:
    await _seed(auth_client, 5)

    response = await auth_client.get("/todos", params={"limit": "2"})

    assert response.status_code == 200
    body = response.json()
    assert len(body["items"]) == 2
    assert body["nextCursor"] is not None


async def test_walking_pages_yields_every_todo_exactly_once(auth_client: AsyncClient) -> None:
    created = await _seed(auth_client, 5)

    seen: list[str] = []
    pages = 0
    cursor: str | None = None
    while True:
        params = {"limit": "2", "cursor": cursor} if cursor else {"limit": "2"}
        body = (await auth_client.get("/todos", params=params)).json()
        seen.extend(item["id"] for item in body["items"])
        pages += 1
        cursor = body["nextCursor"]
        if cursor is None:
            break

    assert pages == 3
    assert seen == list(reversed(created))
    assert len(set(seen)) == 5


async def test_last_page_has_no_cursor(auth_client: AsyncClient) -> None:
    await _seed(auth_client, 4)

    first = (await auth_client.get("/todos", params={"limit": "2"})).json()
    last = (
        await auth_client.get("/todos", params={"limit": "2", "cursor": first["nextCursor"]})
    ).json()

    assert len(last["items"]) == 2
    assert last["nextCursor"] is None


async def test_invalid_cursor_is_a_validation_error(auth_client: AsyncClient) -> None:
    response = await auth_client.get("/todos", params={"cursor": "not-a-cursor"})

    assert response.status_code == 422
    detail = response.json()["details"][0]
    assert detail["field"] == "cursor"
    assert detail["code"] == "invalid_cursor"


async def test_filters_apply_across_pages(auth_client: AsyncClient) -> None:
    for index in range(3):
        todo = (await auth_client.post("/todos", json={"title": f"done {index}"})).json()
        await auth_client.patch(f"/todos/{todo['id']}", json={"completed": True})
    for index in range(3):
        await auth_client.post("/todos", json={"title": f"open {index}"})

    params = {"completed": "true", "limit": "2"}
    body = (await auth_client.get("/todos", params=params)).json()

    assert [item["title"] for item in body["items"]] == ["done 2", "done 1"]
    assert body["nextCursor"] is not None
