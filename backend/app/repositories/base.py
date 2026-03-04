from typing import Any, Generic, List, Optional, Type, TypeVar, Union
from uuid import UUID

from sqlalchemy import delete, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from ..models.base import Base

T = TypeVar("T", bound=Base)


class BaseRepository(Generic[T]):
    def __init__(self, model: Type[T], session: AsyncSession):
        self.model = model
        self.session = session

    async def get(self, id: UUID) -> Optional[T]:
        query = select(self.model).where(self.model.id == id)
        result = await self.session.execute(query)
        return result.scalars().first()

    async def get_multi(self, *, skip: int = 0, limit: int = 100) -> List[T]:
        query = select(self.model).offset(skip).limit(limit)
        result = await self.session.execute(query)
        return list(result.scalars().all())

    async def create(self, *, obj_in: dict[str, Any]) -> T:
        db_obj = self.model(**obj_in)
        self.session.add(db_obj)
        await self.session.flush()
        await self.session.refresh(db_obj)
        return db_obj

    async def update(self, *, db_obj: T, obj_in: Union[dict[str, Any], T]) -> T:
        if isinstance(obj_in, dict):
            update_data = obj_in
        else:
            # Simple conversion if object passed, though request mentioned dict-based mapping
            update_data = {
                column.name: getattr(obj_in, column.name)
                for column in self.model.__table__.columns
                if hasattr(obj_in, column.name)
            }

        for field, value in update_data.items():
            if hasattr(db_obj, field):
                setattr(db_obj, field, value)

        self.session.add(db_obj)
        await self.session.flush()
        await self.session.refresh(db_obj)
        return db_obj

    async def delete(self, *, id: UUID) -> Optional[T]:
        db_obj = await self.get(id)
        if db_obj:
            query = delete(self.model).where(self.model.id == id)
            await self.session.execute(query)
            await self.session.flush()
        return db_obj
