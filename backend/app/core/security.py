from __future__ import annotations

import uuid
from datetime import datetime, timedelta, timezone
from typing import Any

import jwt
from jwt.exceptions import (
    DecodeError,
    ExpiredSignatureError,
    InvalidAudienceError,
    InvalidIssuerError,
    InvalidTokenError,
)

from pydantic import BaseModel, Field

from ..config import settings
from ..infrastructure.redis_manager import redis_manager

# ---------------------------------------------------------------------------
# Config — loaded from central settings
# ---------------------------------------------------------------------------
SECRET_KEY: str       = settings.SECRET_KEY
ALGORITHM: str        = "HS256"
TOKEN_ISSUER: str     = settings.TOKEN_ISSUER
TOKEN_AUDIENCE: str   = settings.TOKEN_AUDIENCE
ACCESS_TOKEN_TTL      = timedelta(minutes=settings.ACCESS_TOKEN_TTL_MIN)
REFRESH_TOKEN_TTL     = timedelta(days=settings.REFRESH_TOKEN_TTL_DAYS)
BLACKLIST_PREFIX: str = "pitchperfect:blacklist:"

# ---------------------------------------------------------------------------
# Pydantic v2 schemas
# ---------------------------------------------------------------------------
class TokenPair(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int = Field(description="Access token TTL in seconds")


class TokenPayload(BaseModel):
    sub: str                            # user UUID
    jti: str                            # unique token id
    exp: int                            # epoch seconds
    iat: int                            # issued at
    iss: str                            # issuer
    aud: str                            # audience
    type: str = Field(pattern=r"^(access|refresh)$")


# ---------------------------------------------------------------------------
# Password hashing (bcrypt – direct, no passlib needed)
# ---------------------------------------------------------------------------
import bcrypt as _bcrypt


def hash_password(plain: str) -> str:
    return _bcrypt.hashpw(plain.encode("utf-8"), _bcrypt.gensalt()).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    return _bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))


# ---------------------------------------------------------------------------
# Token factory
# ---------------------------------------------------------------------------
def _make_token(sub: str, token_type: str, ttl: timedelta) -> tuple[str, str]:
    """Returns (encoded_jwt, jti)."""
    now = datetime.now(tz=timezone.utc)
    jti = str(uuid.uuid4())
    payload: dict[str, Any] = {
        "sub":  sub,
        "jti":  jti,
        "iat":  int(now.timestamp()),
        "exp":  int((now + ttl).timestamp()),
        "iss":  TOKEN_ISSUER,
        "aud":  TOKEN_AUDIENCE,
        "type": token_type,
    }
    token = jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)
    return token, jti


def create_access_token(user_id: str) -> tuple[str, str]:
    """Returns (access_token, jti)."""
    return _make_token(user_id, "access", ACCESS_TOKEN_TTL)


def create_refresh_token(user_id: str) -> tuple[str, str]:
    """Returns (refresh_token, jti)."""
    return _make_token(user_id, "refresh", REFRESH_TOKEN_TTL)


def create_token_pair(user_id: str) -> TokenPair:
    access, _  = create_access_token(user_id)
    refresh, _ = create_refresh_token(user_id)
    return TokenPair(
        access_token=access,
        refresh_token=refresh,
        expires_in=int(ACCESS_TOKEN_TTL.total_seconds()),
    )


# ---------------------------------------------------------------------------
# Token validation
# ---------------------------------------------------------------------------
def decode_token(token: str) -> TokenPayload:
    """
    Decodes and validates a JWT including audience and issuer checks.
    Raises jwt.exceptions.* on any failure.
    """
    raw = jwt.decode(
        token,
        SECRET_KEY,
        algorithms=[ALGORITHM],
        issuer=TOKEN_ISSUER,
        audience=TOKEN_AUDIENCE,
        options={
            "require": ["sub", "jti", "exp", "iat", "iss", "aud", "type"],
        },
    )
    return TokenPayload.model_validate(raw)


# ---------------------------------------------------------------------------
# Blacklist (Redis-backed)
# ---------------------------------------------------------------------------
async def blacklist_token(jti: str, ttl_seconds: int) -> None:
    """Adds a jti to the Redis blacklist with an expiry matching the token TTL."""
    key = f"{BLACKLIST_PREFIX}{jti}"
    await redis_manager.client.set(key, "1", ex=ttl_seconds)


async def is_blacklisted(jti: str) -> bool:
    try:
        key = f"{BLACKLIST_PREFIX}{jti}"
        return await redis_manager.client.exists(key) == 1
    except Exception as getattr_or_redis_error:
        import logging
        logging.getLogger("pitchperfect.app.security").warning(
            f"Redis connection failed during token blacklist check: {getattr_or_redis_error}"
        )
        # If Redis is down, assume token is not blacklisted to avoid locking users out
        return False


async def blacklist_token_pair(
    access_jti: str,
    refresh_jti: str,
) -> None:
    """Blacklists both JTIs in a single pipeline round-trip."""
    pipe = redis_manager.client.pipeline(transaction=True)
    pipe.set(f"{BLACKLIST_PREFIX}{access_jti}", "1", ex=int(ACCESS_TOKEN_TTL.total_seconds()))
    pipe.set(f"{BLACKLIST_PREFIX}{refresh_jti}", "1", ex=int(REFRESH_TOKEN_TTL.total_seconds()))
    await pipe.execute()
