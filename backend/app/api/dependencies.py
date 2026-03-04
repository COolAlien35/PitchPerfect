from __future__ import annotations

import os
from collections.abc import AsyncGenerator
from typing import Annotated
from uuid import UUID

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jwt.exceptions import (
    DecodeError,
    ExpiredSignatureError,
    InvalidAudienceError,
    InvalidIssuerError,
    InvalidTokenError,
)
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from ..core.security import TokenPayload, decode_token, is_blacklisted
from ..models.user import User
from ..repositories.user_repo import UserRepository

# ---------------------------------------------------------------------------
# Async DB session dependency
# ---------------------------------------------------------------------------
_DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql+asyncpg://postgres:postgres@localhost:5432/pitchperfect",
)

_engine = create_async_engine(
    _DATABASE_URL,
    pool_pre_ping=True,
    pool_size=10,
    max_overflow=20,
    echo=False,
)

_async_session = async_sessionmaker(
    bind=_engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=False,
)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with _async_session() as session:
        try:
            yield session
        finally:
            await session.close()


DB = Annotated[AsyncSession, Depends(get_db)]

# ---------------------------------------------------------------------------
# Bearer token extractor
# ---------------------------------------------------------------------------
_bearer_scheme = HTTPBearer(auto_error=False)

BearerCredentials = Annotated[
    HTTPAuthorizationCredentials | None,
    Depends(_bearer_scheme),
]

# ---------------------------------------------------------------------------
# Structured HTTP errors
# ---------------------------------------------------------------------------
_CREDENTIALS_EXCEPTION = HTTPException(
    status_code=status.HTTP_401_UNAUTHORIZED,
    detail={"code": "INVALID_TOKEN", "message": "Could not validate credentials."},
    headers={"WWW-Authenticate": "Bearer"},
)

_EXPIRED_EXCEPTION = HTTPException(
    status_code=status.HTTP_401_UNAUTHORIZED,
    detail={"code": "TOKEN_EXPIRED", "message": "Access token has expired."},
    headers={"WWW-Authenticate": "Bearer"},
)

_BLACKLISTED_EXCEPTION = HTTPException(
    status_code=status.HTTP_401_UNAUTHORIZED,
    detail={"code": "TOKEN_REVOKED", "message": "Token has been revoked."},
    headers={"WWW-Authenticate": "Bearer"},
)

_USER_NOT_FOUND = HTTPException(
    status_code=status.HTTP_401_UNAUTHORIZED,
    detail={"code": "USER_NOT_FOUND", "message": "Authenticated user no longer exists."},
    headers={"WWW-Authenticate": "Bearer"},
)


# ---------------------------------------------------------------------------
# Step 1: Extract + validate JWT → TokenPayload
# ---------------------------------------------------------------------------
async def get_current_user_payload(
    credentials: BearerCredentials,
) -> TokenPayload:
    """
    Decode the Bearer JWT, enforce aud/iss, check blacklist, confirm type=access.
    """
    if credentials is None:
        raise _CREDENTIALS_EXCEPTION

    raw_token = credentials.credentials

    try:
        payload = decode_token(raw_token)
    except ExpiredSignatureError:
        raise _EXPIRED_EXCEPTION
    except (DecodeError, InvalidTokenError, InvalidAudienceError, InvalidIssuerError, ValueError):
        raise _CREDENTIALS_EXCEPTION

    if payload.type != "access":
        raise _CREDENTIALS_EXCEPTION

    if await is_blacklisted(payload.jti):
        raise _BLACKLISTED_EXCEPTION

    return payload


# ---------------------------------------------------------------------------
# Step 2: Resolve TokenPayload → full User ORM object via UserRepository
# ---------------------------------------------------------------------------
async def get_current_user(
    payload: Annotated[TokenPayload, Depends(get_current_user_payload)],
    db: DB,
) -> User:
    """
    Fetches the User record from PostgreSQL via UserRepository.
    Raises 401 if the user was deleted between token issuance and this request.
    """
    repo = UserRepository(db)
    user = await repo.get(UUID(payload.sub))

    if user is None:
        raise _USER_NOT_FOUND

    return user


# ---------------------------------------------------------------------------
# Convenience type aliases for route signatures
# ---------------------------------------------------------------------------
CurrentUserPayload = Annotated[TokenPayload, Depends(get_current_user_payload)]
CurrentUser        = Annotated[User,         Depends(get_current_user)]
