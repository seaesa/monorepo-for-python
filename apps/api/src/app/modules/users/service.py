import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import ConflictError
from app.core.security import hash_password
from app.modules.users.models import User
from app.modules.users.repository import UserRepository
from app.modules.users.schemas import UserCreate, UserUpdate
from app.modules.users.tasks import send_welcome_email
from app.shared.schemas import ErrorCode


class UserService:
    """Public API of the users module. Other modules depend on this, never on the repository."""

    def __init__(self, session: AsyncSession, users: UserRepository) -> None:
        self.session = session
        self.users = users

    async def get(self, user_id: uuid.UUID) -> User | None:
        return await self.users.get(user_id)

    async def get_by_email(self, email: str) -> User | None:
        return await self.users.get_by_email(email)

    async def create(self, data: UserCreate) -> User:
        if await self.users.get_by_email(data.email):
            raise ConflictError(
                "Email already registered", code=ErrorCode.EMAIL_TAKEN, field="email"
            )
        user = await self.users.create(
            email=data.email.lower(),
            full_name=data.full_name,
            hashed_password=hash_password(data.password),
        )
        await self.session.commit()
        send_welcome_email.delay(str(user.id))
        return user

    async def update(self, user: User, data: UserUpdate) -> User:
        user = await self.users.update(user, **data.model_dump(exclude_unset=True))
        await self.session.commit()
        return user
