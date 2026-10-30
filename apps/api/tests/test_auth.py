from httpx import AsyncClient

USER = {"email": "john@example.com", "fullName": "John", "password": "secret123"}


async def test_register_login_me(client: AsyncClient) -> None:
    response = await client.post("/auth/register", json=USER)
    assert response.status_code == 201
    assert {"accessToken", "refreshToken", "expiresIn"} <= response.json().keys()

    response = await client.post(
        "/auth/login", json={"email": USER["email"], "password": USER["password"]}
    )
    assert response.status_code == 200
    token = response.json()["accessToken"]

    response = await client.get("/users/me", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 200
    assert response.json()["fullName"] == "John"


async def test_duplicate_email_conflict(client: AsyncClient) -> None:
    await client.post("/auth/register", json=USER)
    response = await client.post("/auth/register", json=USER)
    assert response.status_code == 409
    body = response.json()
    assert body["code"] == "email_taken"
    # Field-targeted: the form shows it under the email input.
    assert body["details"] == [
        {
            "field": "email",
            "code": "email_taken",
            "message": "Email already registered",
            "params": None,
        }
    ]


async def test_wrong_password(client: AsyncClient) -> None:
    await client.post("/auth/register", json=USER)
    response = await client.post("/auth/login", json={"email": USER["email"], "password": "nope"})
    assert response.status_code == 401
    assert response.json()["code"] == "invalid_credentials"


async def test_me_requires_auth(client: AsyncClient) -> None:
    response = await client.get("/users/me")
    assert response.status_code == 401
    assert response.json() == {
        "code": "unauthorized",
        "message": "Not authenticated",
        "details": None,
    }


async def test_refresh_rotates_and_logout_revokes(client: AsyncClient) -> None:
    tokens = (await client.post("/auth/register", json=USER)).json()

    response = await client.post("/auth/refresh", json={"refreshToken": tokens["refreshToken"]})
    assert response.status_code == 200
    new_refresh = response.json()["refreshToken"]

    # Old refresh token is single-use.
    response = await client.post("/auth/refresh", json={"refreshToken": tokens["refreshToken"]})
    assert response.status_code == 401

    assert (
        await client.post("/auth/logout", json={"refreshToken": new_refresh})
    ).status_code == 204
    response = await client.post("/auth/refresh", json={"refreshToken": new_refresh})
    assert response.status_code == 401


async def test_validation_error_shape(client: AsyncClient) -> None:
    response = await client.post("/auth/register", json={"email": "bad", "password": "x"})
    assert response.status_code == 422
    body = response.json()
    assert body["code"] == "validation_error"
    by_field = {d["field"]: d for d in body["details"]}
    assert by_field.keys() >= {"email", "password", "fullName"}
    assert by_field["fullName"]["code"] == "missing"
    assert by_field["password"]["code"] == "string_too_short"
    assert by_field["password"]["params"] == {"min_length": 8}
