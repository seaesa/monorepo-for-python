"""Refresh tokens are single-use: rotation is atomic and reuse kills the session family."""

import asyncio

from httpx import AsyncClient, Response

USER = {"email": "rotate@example.com", "fullName": "Rotate", "password": "secret123"}
LOGIN = {"email": USER["email"], "password": USER["password"]}


async def _register(client: AsyncClient) -> dict[str, str]:
    response = await client.post("/auth/register", json=USER)
    assert response.status_code == 201
    return dict(response.json())


async def _login(client: AsyncClient) -> dict[str, str]:
    response = await client.post("/auth/login", json=LOGIN)
    assert response.status_code == 200
    return dict(response.json())


async def _refresh(client: AsyncClient, token: str) -> Response:
    return await client.post("/auth/refresh", json={"refreshToken": token})


async def test_concurrent_refresh_issues_exactly_one_pair(client: AsyncClient) -> None:
    tokens = await _register(client)

    first, second = await asyncio.gather(
        _refresh(client, tokens["refreshToken"]),
        _refresh(client, tokens["refreshToken"]),
    )

    assert sorted([first.status_code, second.status_code]) == [200, 401]


async def test_replay_of_rotated_token_revokes_the_family(client: AsyncClient) -> None:
    tokens = await _register(client)

    rotated = await _refresh(client, tokens["refreshToken"])
    assert rotated.status_code == 200

    # Replaying the consumed token is treated as theft...
    assert (await _refresh(client, tokens["refreshToken"])).status_code == 401
    # ...so the sibling handed out moments ago dies too.
    assert (await _refresh(client, rotated.json()["refreshToken"])).status_code == 401


async def test_logout_keeps_other_sessions_alive(client: AsyncClient) -> None:
    await _register(client)
    first = await _login(client)
    second = await _login(client)

    response = await client.post("/auth/logout", json={"refreshToken": first["refreshToken"]})

    assert response.status_code == 204
    assert (await _refresh(client, first["refreshToken"])).status_code == 401
    assert (await _refresh(client, second["refreshToken"])).status_code == 200


async def test_logout_all_devices_kills_every_session(client: AsyncClient) -> None:
    await _register(client)
    first = await _login(client)
    second = await _login(client)

    response = await client.post(
        "/auth/logout?allDevices=true", json={"refreshToken": first["refreshToken"]}
    )

    assert response.status_code == 204
    assert (await _refresh(client, first["refreshToken"])).status_code == 401
    assert (await _refresh(client, second["refreshToken"])).status_code == 401
