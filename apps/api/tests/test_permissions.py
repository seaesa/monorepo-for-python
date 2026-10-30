"""Access is granted by permission: members cannot list users, admins can."""

from dishka import AsyncContainer
from httpx import AsyncClient

from app.modules.users.service import UserService
from app.shared.permissions import Role


async def _grant(container: AsyncContainer, email: str, role: Role) -> None:
    async with container() as request:
        users = await request.get(UserService)
        user = await users.get_by_email(email)
        assert user is not None
        await users.set_role(user, role)


async def test_members_have_no_admin_permissions(auth_client: AsyncClient) -> None:
    me = (await auth_client.get("/users/me")).json()
    assert me["role"] == "member"
    assert me["permissions"] == []

    response = await auth_client.get("/users")
    assert response.status_code == 403
    assert response.json()["code"] == "forbidden"


async def test_admins_can_list_users(auth_client: AsyncClient, container: AsyncContainer) -> None:
    await _grant(container, "jane@example.com", Role.ADMIN)

    me = (await auth_client.get("/users/me")).json()
    assert "users:read" in me["permissions"]

    response = await auth_client.get("/users")
    assert response.status_code == 200
    assert [user["email"] for user in response.json()["items"]] == ["jane@example.com"]
