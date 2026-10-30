"""Operator commands: `uv run python -m app.cli set-role <email> <role>`."""

import argparse
import asyncio

from dishka import AsyncContainer

from app.core.worker_container import with_container
from app.modules.users.service import UserService
from app.shared.permissions import Role


async def set_role(container: AsyncContainer, email: str, role: Role) -> None:
    async with container() as request:
        users = await request.get(UserService)
        user = await users.get_by_email(email)
        if user is None:
            raise SystemExit(f"No user with email {email}")
        await users.set_role(user, role)
    print(f"{email} is now {role}")


def main() -> None:
    parser = argparse.ArgumentParser(prog="app.cli")
    commands = parser.add_subparsers(dest="command", required=True)
    role_cmd = commands.add_parser("set-role", help="Grant a role to an existing user")
    role_cmd.add_argument("email")
    role_cmd.add_argument("role", choices=[role.value for role in Role])
    args = parser.parse_args()
    if args.command == "set-role":
        role = Role(args.role)
        asyncio.run(with_container(lambda c: set_role(c, args.email, role)))


if __name__ == "__main__":
    main()
