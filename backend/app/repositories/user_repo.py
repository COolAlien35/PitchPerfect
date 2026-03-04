from typing import Optional
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession


from ..models.user import User
from .base import BaseRepository


class UserRepository(BaseRepository[User]):
    def __init__(self, session: AsyncSession):
        super().__init__(User, session)

    async def get_by_email(self, *, email: str) -> Optional[User]:
        query = select(self.model).where(self.model.email == email)
        result = await self.session.execute(query)
        return result.scalars().first()
