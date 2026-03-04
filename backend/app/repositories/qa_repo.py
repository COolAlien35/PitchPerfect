from typing import Any, List
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from ..models.qa_record import QARecord
from .base import BaseRepository


class QARecordRepository(BaseRepository[QARecord]):
    def __init__(self, session: AsyncSession):
        super().__init__(QARecord, session)

    async def create_batch(self, *, obj_in_list: List[dict[str, Any]]) -> List[QARecord]:
        db_objs = [self.model(**obj_in) for obj_in in obj_in_list]
        self.session.add_all(db_objs)
        await self.session.flush()
        # Refresh is tricky with add_all, might just return objects
        return db_objs

    async def get_by_session_id(self, *, session_id: UUID) -> List[QARecord]:
        query = (
            select(self.model)
            .where(self.model.session_id == session_id)
            .options(selectinload(self.model.session))
        )
        result = await self.session.execute(query)
        return list(result.scalars().all())
