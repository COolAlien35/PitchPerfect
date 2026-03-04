from __future__ import annotations

import logging
from dataclasses import dataclass
from enum import Enum
from typing import Callable

from fastapi import HTTPException, Request, status
from redis.asyncio import Redis

from ..infrastructure.redis_manager import redis_manager

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Sliding-window Lua script
# ---------------------------------------------------------------------------
# Atomically:
#   1. Remove entries older than (now - window_ms) from the sorted set.
#   2. Count remaining entries.
#   3. If count < limit → add current timestamp and return (1, count+1, ttl_ms).
#   4. Else → return (0, count, ttl_ms).
# KEYS[1] = rate-limit key  ARGV[1] = now_ms  ARGV[2] = window_ms  ARGV[3] = limit
_SLIDING_WINDOW_LUA = """
local key        = KEYS[1]
local now        = tonumber(ARGV[1])
local window_ms  = tonumber(ARGV[2])
local limit      = tonumber(ARGV[3])
local clear_before = now - window_ms

redis.call('ZREMRANGEBYSCORE', key, '-inf', clear_before)
local count = redis.call('ZCARD', key)

if count < limit then
    redis.call('ZADD', key, now, now .. '-' .. math.random(1, 1000000))
    redis.call('PEXPIRE', key, window_ms)
    return {1, count + 1, window_ms}
else
    local oldest = redis.call('ZRANGE', key, 0, 0, 'WITHSCORES')
    local reset_in = window_ms - (now - tonumber(oldest[2]))
    return {0, count, reset_in}
end
"""

# ---------------------------------------------------------------------------
# Tier configuration
# ---------------------------------------------------------------------------
class RateTier(str, Enum):
    GUEST      = "guest"
    USER       = "user"
    AI_ENDPOINT = "ai_endpoint"


@dataclass(frozen=True)
class TierConfig:
    limit: int          # max requests per window
    window_ms: int      # window size in milliseconds


TIER_CONFIGS: dict[RateTier, TierConfig] = {
    RateTier.GUEST:       TierConfig(limit=10,  window_ms=60_000),
    RateTier.USER:        TierConfig(limit=100, window_ms=60_000),
    RateTier.AI_ENDPOINT: TierConfig(limit=5,   window_ms=60_000),
}

# ---------------------------------------------------------------------------
# Fail policy
# ---------------------------------------------------------------------------
FAIL_OPEN = True   # True = allow through on Redis error; False = block


# ---------------------------------------------------------------------------
# SlidingWindowRateLimiter
# ---------------------------------------------------------------------------
class SlidingWindowRateLimiter:
    """
    Non-blocking async sliding-window rate limiter backed by Redis Lua script.
    A new script instance is registered with the Redis client on first use.
    """

    def __init__(self) -> None:
        self._script: object | None = None   # lazily registered

    def _get_client(self) -> Redis:
        return redis_manager.client

    async def _load_script(self) -> object:
        if self._script is None:
            self._script = self._get_client().register_script(_SLIDING_WINDOW_LUA)
        return self._script

    @staticmethod
    def _extract_key(request: Request, tier: RateTier) -> str:
        """
        Prefers authenticated user sub-claim; falls back to client IP.
        Prefix with tier to keep key-spaces isolated.
        """
        user_id: str | None = getattr(request.state, "user_id", None)
        identifier = user_id or (request.client.host if request.client else "unknown")
        return f"pitchperfect:rl:{tier.value}:{identifier}"

    async def check(
        self,
        request: Request,
        tier: RateTier = RateTier.USER,
    ) -> None:
        """
        Execute the rate-limit check.
        Raises HTTP 429 with Retry-After header when limit is exceeded.
        On Redis failure, respects FAIL_OPEN policy.
        """
        config = TIER_CONFIGS[tier]
        key    = self._extract_key(request, tier)

        try:
            import time
            now_ms = int(time.time() * 1_000)
            script = await self._load_script()

            allowed, count, reset_ms = await script(
                keys=[key],
                args=[now_ms, config.window_ms, config.limit],
            )

            if not allowed:
                retry_after = max(1, int(reset_ms / 1_000))
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail={
                        "code":    "RATE_LIMIT_EXCEEDED",
                        "message": f"Too many requests. Limit: {config.limit}/{config.window_ms // 1_000}s.",
                        "tier":    tier.value,
                    },
                    headers={
                        "Retry-After":        str(retry_after),
                        "X-RateLimit-Limit":  str(config.limit),
                        "X-RateLimit-Reset":  str(retry_after),
                    },
                )

        except HTTPException:
            raise
        except Exception as exc:
            logger.error("Rate-limiter Redis error (%s) – fail-%s", exc, "open" if FAIL_OPEN else "closed")
            if not FAIL_OPEN:
                raise HTTPException(
                    status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                    detail={"code": "RATE_LIMITER_ERROR", "message": "Rate limiter unavailable."},
                )


# ---------------------------------------------------------------------------
# Dependency factories
# ---------------------------------------------------------------------------
_limiter = SlidingWindowRateLimiter()


def rate_limit(tier: RateTier = RateTier.USER) -> Callable:
    """
    FastAPI dependency factory.

    Usage:
        @router.post("/ai/generate", dependencies=[Depends(rate_limit(RateTier.AI_ENDPOINT))])
    """
    async def _dependency(request: Request) -> None:
        await _limiter.check(request, tier)

    return _dependency
