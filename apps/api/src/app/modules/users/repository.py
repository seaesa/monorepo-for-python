from collections.abc import Sequence

from sqlalchemy import tuple_

from app.modules.users.models import User
from app.shared.pagination import CursorParams
from app.shared.repository import BaseRepository


class UserRepository(BaseRepository[User]):
    model = User

    async def get_by_email(self, email: str) -> User | None:
        return await self.find_one(User.email == email.lower())

    async def list_page(self, params: CursorParams) -> Sequence[User]:
        """Newest first; fetches `limit + 1` rows so the caller can tell if more exist."""
        after = params.after
        filters = [tuple_(User.created_at, User.id) < tuple_(*after)] if after else []
        return await self.list(
            *filters, order_by=[User.created_at.desc(), User.id.desc()], limit=params.limit + 1
        )
