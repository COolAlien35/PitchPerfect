from __future__ import annotations

import asyncio
import logging
import os
import time
from enum import Enum
from typing import Any

import httpx
from fastapi import APIRouter
from pydantic import BaseModel
from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine

from ...infrastructure.redis_manager import redis_manager

logger = logging.getLogger("pitchperfect.health")
router = APIRouter(tags=["Health"])

# ---------------------------------------------------------------------------
# Status types
# ---------------------------------------------------------------------------
class ComponentStatus(str, Enum):
    HEALTHY   = "healthy"
    DEGRADED  = "degraded"
    UNHEALTHY = "unhealthy"


class ComponentCheck(BaseModel):
    status:   ComponentStatus
    latency_ms: float | None = None
    detail:   str | None = None


class HealthResponse(BaseModel):
    status:     ComponentStatus
    version:    str = "1.0.0"
    checks:     dict[str, ComponentCheck]
    timestamp:  float


# ---------------------------------------------------------------------------
# Individual checkers (async, non-blocking, with timeout)
# ---------------------------------------------------------------------------
_DB_URL = os.getenv("DATABASE_URL", "")
_GEMINI_PING_URL = "https://generativelanguage.googleapis.com/"
_HEALTH_TIMEOUT  = 4.0   # seconds


async def _check_postgres() -> ComponentCheck:
    start = time.perf_counter()
    try:
        engine = create_async_engine(_DB_URL, pool_pre_ping=True)
        async with asyncio.timeout(_HEALTH_TIMEOUT):
            async with engine.connect() as conn:
                await conn.execute(text("SELECT 1"))
        await engine.dispose()
        return ComponentCheck(
            status=ComponentStatus.HEALTHY,
            latency_ms=round((time.perf_counter() - start) * 1_000, 2),
        )
    except asyncio.TimeoutError:
        return ComponentCheck(status=ComponentStatus.UNHEALTHY, detail="PostgreSQL timeout")
    except Exception as exc:
        return ComponentCheck(status=ComponentStatus.UNHEALTHY, detail=str(exc))


async def _check_redis() -> ComponentCheck:
    start = time.perf_counter()
    try:
        async with asyncio.timeout(_HEALTH_TIMEOUT):
            pong = await redis_manager.client.ping()
        if not pong:
            raise RuntimeError("PING returned falsy")
        return ComponentCheck(
            status=ComponentStatus.HEALTHY,
            latency_ms=round((time.perf_counter() - start) * 1_000, 2),
        )
    except asyncio.TimeoutError:
        return ComponentCheck(status=ComponentStatus.UNHEALTHY, detail="Redis timeout")
    except Exception as exc:
        return ComponentCheck(status=ComponentStatus.UNHEALTHY, detail=str(exc))


async def _check_ai_service() -> ComponentCheck:
    """
    Non-authenticated HEAD request to the Gemini base URL.
    A 2xx / 4xx response confirms reachability; 5xx or network errors → degraded.
    """
    start = time.perf_counter()
    try:
        async with asyncio.timeout(_HEALTH_TIMEOUT):
            async with httpx.AsyncClient(timeout=_HEALTH_TIMEOUT) as client:
                resp = await client.head(_GEMINI_PING_URL)
        # 4xx means the endpoint is up (auth needed), still reachable
        reachable = resp.status_code < 500
        latency   = round((time.perf_counter() - start) * 1_000, 2)
        return ComponentCheck(
            status=ComponentStatus.HEALTHY if reachable else ComponentStatus.DEGRADED,
            latency_ms=latency,
            detail=f"HTTP {resp.status_code}" if not reachable else None,
        )
    except asyncio.TimeoutError:
        return ComponentCheck(status=ComponentStatus.DEGRADED, detail="AI service timeout")
    except Exception as exc:
        return ComponentCheck(status=ComponentStatus.DEGRADED, detail=str(exc))


# ---------------------------------------------------------------------------
# Aggregate health logic
# ---------------------------------------------------------------------------
def _aggregate_status(checks: dict[str, ComponentCheck]) -> ComponentStatus:
    statuses = {c.status for c in checks.values()}
    if ComponentStatus.UNHEALTHY in statuses:
        return ComponentStatus.UNHEALTHY
    if ComponentStatus.DEGRADED in statuses:
        return ComponentStatus.DEGRADED
    return ComponentStatus.HEALTHY


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------
@router.get(
    "/health",
    response_model=HealthResponse,
    summary="Deep health check",
    description="Performs live checks against PostgreSQL, Redis, and the AI service.",
)
async def health_check() -> HealthResponse:
    # Run all checks concurrently
    postgres_check, redis_check, ai_check = await asyncio.gather(
        _check_postgres(),
        _check_redis(),
        _check_ai_service(),
        return_exceptions=False,
    )

    checks: dict[str, ComponentCheck] = {
        "postgres":   postgres_check,
        "redis":      redis_check,
        "ai_service": ai_check,
    }

    overall = _aggregate_status(checks)
    logger.info("Health check: %s", overall.value, extra={"checks": {k: v.model_dump() for k, v in checks.items()}})

    return HealthResponse(
        status=overall,
        checks=checks,
        timestamp=time.time(),
    )


@router.get(
    "/health/live",
    summary="Liveness probe",
    description="Minimal liveness check – confirms the process is alive.",
)
async def liveness() -> dict[str, str]:
    """Kubernetes liveness probe – fast, no external I/O."""
    return {"status": "ok"}


@router.get(
    "/health/ready",
    summary="Readiness probe",
    description="Readiness check – confirms the app can accept traffic.",
)
async def readiness() -> dict[str, Any]:
    """
    Kubernetes readiness probe.
    Only checks Redis (fastest; if Redis is down the app cannot serve requests).
    """
    check = await _check_redis()
    status_code = 200 if check.status == ComponentStatus.HEALTHY else 503
    return {"status": check.status, "latency_ms": check.latency_ms}
