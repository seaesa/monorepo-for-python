import uuid
from datetime import UTC, datetime

from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import ConflictError
from app.core.security import hash_password_async
from app.modules.users.models import User
from app.modules.users.repository import UserRepository
from app.modules.users.schemas import UserCreate, UserRead, UserUpdate
from app.shared.pagination import CursorParams, encode_cursor
from app.shared.permissions import Role
from app.shared.schemas import CursorPage, ErrorCode


class UserService:
    """Public API of the users module. Other modules depend on this, never on the repository."""

    def __init__(self, session: AsyncSession, users: UserRepository) -> None:
        self.session = session
        self.users = users

    async def get(self, user_id: uuid.UUID) -> User | None:
        return await self.users.get(user_id)

    async def get_by_email(self, email: str) -> User | None:
        return await self.users.get_by_email(email)

    async def list(self, params: CursorParams) -> CursorPage[UserRead]:
        rows = await self.users.list_page(params)
        return CursorPage[UserRead].create(
            [UserRead.model_validate(user) for user in rows],
            params.limit,
            lambda user: encode_cursor(user.created_at, user.id),
        )

    async def set_role(self, user: User, role: Role) -> User:
        await self.users.update(user, role=role)
        await self.session.commit()
        return user

    async def create(self, data: UserCreate) -> User:
        if await self.users.get_by_email(data.email):
            raise ConflictError(
                "Email already registered", code=ErrorCode.EMAIL_TAKEN, field="email"
            )
        try:
            user = await self.users.create(
                email=data.email.lower(),
                full_name=data.full_name,
                hashed_password=await hash_password_async(data.password),
            )
            await self.session.commit()
        except IntegrityError:
            # Another request committed the same email between the check and the insert.
            await self.session.rollback()
            raise ConflictError(
                "Email already registered", code=ErrorCode.EMAIL_TAKEN, field="email"
            ) from None
        return user

    async def update(self, user: User, data: UserUpdate) -> User:
        user = await self.users.update(user, **data.model_dump(exclude_unset=True))
        await self.session.commit()
        return user

    async def mark_verified(self, user: User) -> User:
        user = await self.users.update(user, email_verified_at=datetime.now(UTC))
        await self.session.commit()
        return user

    async def set_password(self, user: User, password: str) -> User:
        """Replace the password and invalidate every token issued so far."""
        user = await self.users.update(
            user,
            hashed_password=await hash_password_async(password),
            token_version=user.token_version + 1,
        )
        await self.session.commit()
        return user

    async def delete(self, user: User) -> None:
        await self.users.delete(user)
        await self.session.commit()
