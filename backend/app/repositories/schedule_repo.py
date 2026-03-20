from typing import List
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..models.schedule import ScheduledSession
from .base import BaseRepository


class ScheduleRepository(BaseRepository[ScheduledSession]):
    def __init__(self, session: AsyncSession):
        super().__init__(ScheduledSession, session)

    async def get_by_user_id(self, *, user_id: UUID) -> List[ScheduledSession]:
        query = (
            select(self.model)
            .where(self.model.user_id == user_id)
            .order_by(self.model.date.desc(), self.model.time.desc())
        )
        result = await self.session.execute(query)
        return list(result.scalars().all())
