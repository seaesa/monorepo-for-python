from dishka.integrations.fastapi import DishkaRoute, FromDishka
from fastapi import APIRouter
from redis.asyncio import Redis
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.shared.schemas import Schema

router = APIRouter(prefix="/health", tags=["health"], route_class=DishkaRoute)


class HealthStatus(Schema):
    status: str
    database: bool
    redis: bool


@router.get("")
async def health_check(session: FromDishka[AsyncSession], redis: FromDishka[Redis]) -> HealthStatus:
    database = (await session.execute(text("select 1"))).scalar_one() == 1
    redis_ok = bool(await redis.ping())
    return HealthStatus(
        status="ok" if database and redis_ok else "degraded", database=database, redis=redis_ok
    )
