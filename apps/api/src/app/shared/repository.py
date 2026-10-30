import uuid
from collections.abc import Sequence
from typing import Any

from sqlalchemy import ColumnElement, Select, func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import InstrumentedAttribute

from app.core.database import Base
from app.core.exceptions import NotFoundError


class BaseRepository[ModelT: Base]:
    """Generic async repository. Subclass per aggregate and set `model`.

    Repositories only talk to the database: they flush but never commit.
    Transaction boundaries belong to the service layer (`await session.commit()`).
    """

    model: type[ModelT]

    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    def _select(self, *filters: ColumnElement[bool]) -> Select[ModelT]:
        return select(self.model).where(*filters)

    async def get(self, id_: uuid.UUID) -> ModelT | None:
        return await self.session.get(self.model, id_)

    async def get_one(self, id_: uuid.UUID) -> ModelT:
        obj = await self.get(id_)
        if obj is None:
            raise NotFoundError(f"{self.model.__name__} not found")
        return obj

    async def find_one(self, *filters: ColumnElement[bool]) -> ModelT | None:
        result = await self.session.execute(self._select(*filters).limit(1))
        return result.scalar_one_or_none()

    async def list(
        self,
        *filters: ColumnElement[bool],
        order_by: Sequence[InstrumentedAttribute[Any] | ColumnElement[Any]] = (),
        offset: int = 0,
        limit: int | None = None,
    ) -> Sequence[ModelT]:
        stmt = self._select(*filters).order_by(*order_by).offset(offset).limit(limit)
        result = await self.session.execute(stmt)
        return result.scalars().all()

    async def count(self, *filters: ColumnElement[bool]) -> int:
        stmt = select(func.count()).select_from(self.model).where(*filters)
        return (await self.session.execute(stmt)).scalar_one()

    async def paginate(
        self,
        *filters: ColumnElement[bool],
        offset: int,
        limit: int,
        order_by: Sequence[InstrumentedAttribute[Any] | ColumnElement[Any]] = (),
    ) -> tuple[Sequence[ModelT], int]:
        items = await self.list(*filters, order_by=order_by, offset=offset, limit=limit)
        return items, await self.count(*filters)

    async def exists(self, *filters: ColumnElement[bool]) -> bool:
        return await self.find_one(*filters) is not None

    async def create(self, **values: Any) -> ModelT:
        obj = self.model(**values)
        self.session.add(obj)
        await self.session.flush()
        return obj

    async def update(self, obj: ModelT, **values: Any) -> ModelT:
        for key, value in values.items():
            setattr(obj, key, value)
        await self.session.flush()
        return obj

    async def delete(self, obj: ModelT) -> None:
        await self.session.delete(obj)
        await self.session.flush()
