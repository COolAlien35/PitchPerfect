"""
app/infrastructure/database.py — SQLAlchemy async engine, session factory, and
FastAPI `get_db` dependency.

All other modules should import from here instead of creating their own engine:

    from app.infrastructure.database import get_db, engine, AsyncSessionFactory
"""
from __future__ import annotations

import logging
from collections.abc import AsyncGenerator

from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)

from ..config import settings

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Engine — shared process-wide singleton
# ---------------------------------------------------------------------------
engine = create_async_engine(
    settings.DATABASE_URL,
    pool_pre_ping=True,             # recycle stale connections automatically
    pool_size=settings.DB_POOL_SIZE,
    max_overflow=settings.DB_MAX_OVERFLOW,
    echo=settings.DB_ECHO,          # set DB_ECHO=true in .env to log all SQL
    future=True,
)

# ---------------------------------------------------------------------------
# Session factory
# ---------------------------------------------------------------------------
AsyncSessionFactory = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,         # avoids lazy-load errors after commit
    autoflush=False,
)


# ---------------------------------------------------------------------------
# FastAPI dependency — yields one session per request, always closed cleanly
# ---------------------------------------------------------------------------
async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """
    FastAPI dependency that provides a per-request async database session.

    Usage in route:
        async def my_route(db: Annotated[AsyncSession, Depends(get_db)]):
            ...

    Or via the existing alias in api/dependencies.py:
        DB = Annotated[AsyncSession, Depends(get_db)]
    """
    async with AsyncSessionFactory() as session:
        try:
            yield session
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()
