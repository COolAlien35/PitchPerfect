from __future__ import annotations

import time
from typing import Callable

from fastapi import Request, Response
from prometheus_client import (
    Counter,
    Gauge,
    Histogram,
    generate_latest,
    CONTENT_TYPE_LATEST,
    REGISTRY,
)
from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.routing import Match

# ---------------------------------------------------------------------------
# Metric definitions – Prometheus naming conventions enforced
# ---------------------------------------------------------------------------

# HTTP request latency (all routes)
http_request_duration_seconds = Histogram(
    name="pitchperfect_http_request_duration_seconds",
    documentation="HTTP request latency in seconds.",
    labelnames=["method", "path", "status_code"],
    buckets=(0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1.0, 2.5, 5.0, 10.0),
)

http_requests_total = Counter(
    name="pitchperfect_http_requests_total",
    documentation="Total HTTP requests processed.",
    labelnames=["method", "path", "status_code"],
)

# AI Inference latency (observed externally via context manager)
ai_inference_duration_seconds = Histogram(
    name="pitchperfect_ai_inference_duration_seconds",
    documentation="Gemini / Whisper AI inference latency in seconds.",
    labelnames=["service", "operation"],   # e.g. service=gemini, operation=generate_questions
    buckets=(0.1, 0.25, 0.5, 1.0, 2.5, 5.0, 10.0, 20.0, 30.0),
)

# Live WebSocket sessions (mutated by connection manager)
websocket_active_connections = Gauge(
    name="pitchperfect_websocket_active_connections",
    documentation="Number of currently active WebSocket interview sessions.",
    labelnames=["endpoint"],
)

# Database query latency (observe via context manager in repositories)
database_query_duration_seconds = Histogram(
    name="pitchperfect_database_query_duration_seconds",
    documentation="PostgreSQL async query latency in seconds.",
    labelnames=["operation", "table"],
    buckets=(0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1.0, 2.5),
)

# Errors by category
error_total = Counter(
    name="pitchperfect_errors_total",
    documentation="Total application errors by category.",
    labelnames=["category"],   # e.g. ai_timeout, db_error, auth_failure
)


# ---------------------------------------------------------------------------
# Context managers for instrumentation at the call-site
# ---------------------------------------------------------------------------
class track_ai_inference:
    """
    Usage:
        async with track_ai_inference("gemini", "generate_questions"):
            result = await llm.ainvoke(...)
    """
    __slots__ = ("_service", "_operation", "_start", "_labels")

    def __init__(self, service: str, operation: str):
        self._service   = service
        self._operation = operation
        self._start:   float = 0.0

    async def __aenter__(self) -> "track_ai_inference":
        self._start = time.perf_counter()
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb) -> None:
        duration = time.perf_counter() - self._start
        ai_inference_duration_seconds.labels(
            service=self._service, operation=self._operation
        ).observe(duration)
        if exc_type is not None:
            error_total.labels(category="ai_inference_error").inc()


class track_db_query:
    """
    Usage:
        async with track_db_query("select", "interviews"):
            result = await session.execute(...)
    """
    __slots__ = ("_operation", "_table", "_start")

    def __init__(self, operation: str, table: str):
        self._operation = operation
        self._table     = table
        self._start:   float = 0.0

    async def __aenter__(self) -> "track_db_query":
        self._start = time.perf_counter()
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb) -> None:
        duration = time.perf_counter() - self._start
        database_query_duration_seconds.labels(
            operation=self._operation, table=self._table
        ).observe(duration)
        if exc_type is not None:
            error_total.labels(category="db_error").inc()


# ---------------------------------------------------------------------------
# HTTP Prometheus middleware
# ---------------------------------------------------------------------------
def _resolve_path_template(request: Request) -> str:
    """
    Return the route template (e.g. /interviews/{id}) rather than the
    literal path to avoid high-cardinality label explosions.
    """
    for route in request.app.routes:
        match, _ = route.matches(request.scope)
        if match == Match.FULL:
            return getattr(route, "path", request.url.path)
    return request.url.path


class PrometheusMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        # Skip the /metrics endpoint itself to avoid self-referential noise
        if request.url.path == "/metrics":
            return await call_next(request)

        path   = _resolve_path_template(request)
        method = request.method
        start  = time.perf_counter()

        try:
            response: Response = await call_next(request)
            status_code = str(response.status_code)
        except Exception:
            status_code = "500"
            error_total.labels(category="unhandled_exception").inc()
            raise
        finally:
            duration = time.perf_counter() - start
            http_request_duration_seconds.labels(
                method=method, path=path, status_code=status_code
            ).observe(duration)
            http_requests_total.labels(
                method=method, path=path, status_code=status_code
            ).inc()

        return response
