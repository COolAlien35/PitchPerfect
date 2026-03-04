from typing import List
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..models.interview import Interview, InterviewSession, InterviewStatus
from .base import BaseRepository


class InterviewRepository(BaseRepository[Interview]):
    def __init__(self, session: AsyncSession):
        super().__init__(Interview, session)

    async def get_active_by_user(self, *, user_id: UUID) -> List[Interview]:
        query = select(self.model).where(
            self.model.user_id == user_id,
            self.model.status.in_([InterviewStatus.IN_PROGRESS, InterviewStatus.PENDING])
        )
        result = await self.session.execute(query)
        return list(result.scalars().all())


class SessionRepository(BaseRepository[InterviewSession]):
    def __init__(self, session: AsyncSession):
        super().__init__(InterviewSession, session)
