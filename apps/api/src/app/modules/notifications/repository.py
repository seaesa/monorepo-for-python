import uuid
from collections.abc import Sequence

from sqlalchemy import delete, select

from app.modules.notifications.models import PushDevice
from app.shared.repository import BaseRepository


class PushDeviceRepository(BaseRepository[PushDevice]):
    model = PushDevice

    async def get_by_token(self, token: str) -> PushDevice | None:
        return await self.find_one(PushDevice.token == token)

    async def list_for_user(self, user_id: uuid.UUID) -> Sequence[PushDevice]:
        result = await self.session.scalars(select(PushDevice).where(PushDevice.user_id == user_id))
        return result.all()

    async def delete_for_user(self, user_id: uuid.UUID) -> None:
        await self.session.execute(delete(PushDevice).where(PushDevice.user_id == user_id))

    async def delete_tokens(
        self, tokens: Sequence[str], *, user_id: uuid.UUID | None = None
    ) -> None:
        statement = delete(PushDevice).where(PushDevice.token.in_(tokens))
        if user_id is not None:
            statement = statement.where(PushDevice.user_id == user_id)
        await self.session.execute(statement)
