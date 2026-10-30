"""An explicit `null` for a non-nullable field must be a 422, never a database error."""

from httpx import AsyncClient


async def test_patch_todo_title_null_is_validation_error(auth_client: AsyncClient) -> None:
    todo = (await auth_client.post("/todos", json={"title": "write tests"})).json()

    response = await auth_client.patch(f"/todos/{todo['id']}", json={"title": None})

    assert response.status_code == 422
    details = response.json()["details"]
    assert details[0]["field"] == "title"
    assert details[0]["code"] == "null_not_allowed"


async def test_patch_todo_completed_null_is_validation_error(auth_client: AsyncClient) -> None:
    todo = (await auth_client.post("/todos", json={"title": "write tests"})).json()

    response = await auth_client.patch(f"/todos/{todo['id']}", json={"completed": None})

    assert response.status_code == 422
    assert response.json()["details"][0]["field"] == "completed"


async def test_patch_todo_description_null_clears_it(auth_client: AsyncClient) -> None:
    todo = (
        await auth_client.post("/todos", json={"title": "write tests", "description": "later"})
    ).json()

    response = await auth_client.patch(f"/todos/{todo['id']}", json={"description": None})

    assert response.status_code == 200
    assert response.json()["description"] is None


async def test_patch_me_full_name_null_is_validation_error(auth_client: AsyncClient) -> None:
    response = await auth_client.patch("/users/me", json={"fullName": None})

    assert response.status_code == 422
    details = response.json()["details"]
    assert details[0]["field"] == "fullName"
    assert details[0]["code"] == "null_not_allowed"


async def test_patch_todo_omitted_fields_stay_untouched(auth_client: AsyncClient) -> None:
    todo = (
        await auth_client.post("/todos", json={"title": "keep me", "description": "still here"})
    ).json()

    response = await auth_client.patch(f"/todos/{todo['id']}", json={"completed": True})

    assert response.status_code == 200
    body = response.json()
    assert body["title"] == "keep me"
    assert body["description"] == "still here"
    assert body["completed"] is True
