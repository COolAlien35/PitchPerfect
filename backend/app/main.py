from __future__ import annotations

import logging
import os
from contextlib import asynccontextmanager
from pathlib import Path

from dotenv import load_dotenv

# Load .env from backend directory (works regardless of cwd)
_env_path = Path(__file__).resolve().parent.parent / ".env"
load_dotenv(_env_path)

from fastapi import FastAPI, Request, Response, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.responses import JSONResponse, PlainTextResponse
from prometheus_client import generate_latest, CONTENT_TYPE_LATEST

from .api.v1 import websocket as ws_router
from .api.v1.auth import router as auth_router
from .api.v1.health import router as health_router
from .api.v1.interviews import router as interview_router
from .api.v1.questions import router as questions_router
from .infrastructure.redis_manager import redis_manager
from .infrastructure.logging import configure_logging, RequestIDMiddleware
from .middleware.monitoring import PrometheusMiddleware
from .middleware.rate_limiter import RateTier, rate_limit

# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------
LOG_LEVEL          = os.getenv("LOG_LEVEL", "INFO")
METRICS_SECRET     = os.getenv("METRICS_SECRET", "")          # empty = no auth (dev only)
ALLOWED_ORIGINS    = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000").split(",")
ALLOWED_METHODS    = ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"]
ALLOWED_HEADERS    = ["Authorization", "Content-Type", "X-Request-ID"]

# ---------------------------------------------------------------------------
# Lifespan
# ---------------------------------------------------------------------------
@asynccontextmanager
async def lifespan(app: FastAPI):
    configure_logging(LOG_LEVEL)
    logging.getLogger("pitchperfect.app").info("Starting PitchPerfect API …")
    await redis_manager.connect()
    yield
    logging.getLogger("pitchperfect.app").info("Shutting down …")
    await redis_manager.disconnect()


# ---------------------------------------------------------------------------
# Factory
# ---------------------------------------------------------------------------
def create_app() -> FastAPI:
    app = FastAPI(
        title="PitchPerfect API",
        version="1.0.0",
        docs_url="/api/docs",
        redoc_url="/api/redoc",
        openapi_url="/api/openapi.json",
        lifespan=lifespan,
    )

    # -----------------------------------------------------------------------
    # 1. Trusted host guard
    # -----------------------------------------------------------------------
    app.add_middleware(
        TrustedHostMiddleware,
        allowed_hosts=["localhost", "127.0.0.1", "pitchperfect.app", "*.pitchperfect.app"],
    )

    # -----------------------------------------------------------------------
    # 2. CORS
    # -----------------------------------------------------------------------
    app.add_middleware(
        CORSMiddleware,
        allow_origins=ALLOWED_ORIGINS,
        allow_credentials=True,
        allow_methods=ALLOWED_METHODS,
        allow_headers=ALLOWED_HEADERS,
        expose_headers=["X-RateLimit-Limit", "X-RateLimit-Reset", "Retry-After", "X-Request-ID"],
        max_age=600,
    )

    # -----------------------------------------------------------------------
    # 3. Prometheus HTTP metrics  (before RequestID so /metrics is excluded)
    # -----------------------------------------------------------------------
    app.add_middleware(PrometheusMiddleware)

    # -----------------------------------------------------------------------
    # 4. Request-ID tracing + structured access log
    # -----------------------------------------------------------------------
    app.add_middleware(RequestIDMiddleware)

    # -----------------------------------------------------------------------
    # 5. Security response headers
    # -----------------------------------------------------------------------
    @app.middleware("http")
    async def add_security_headers(request: Request, call_next) -> Response:
        response: Response = await call_next(request)
        response.headers["X-Content-Type-Options"]    = "nosniff"
        response.headers["X-Frame-Options"]           = "DENY"
        response.headers["X-XSS-Protection"]          = "1; mode=block"
        response.headers["Referrer-Policy"]           = "strict-origin-when-cross-origin"
        response.headers["Permissions-Policy"]        = "camera=(), microphone=(), geolocation=()"
        response.headers["Strict-Transport-Security"] = "max-age=63072000; includeSubDomains; preload"
        # Build connect-src from ALLOWED_ORIGINS so the frontend can
        # reach this API without being blocked by the browser's CSP engine.
        _connect_origins = " ".join(ALLOWED_ORIGINS)
        response.headers["Content-Security-Policy"]   = (
            "default-src 'self'; "
            "script-src 'self'; "
            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; "
            "font-src 'self' https://fonts.gstatic.com; "
            "img-src 'self' data: blob:; "
            f"connect-src 'self' {_connect_origins} wss://pitchperfect.app; "
            "frame-ancestors 'none';"
        )
        return response

    # -----------------------------------------------------------------------
    # 6. /metrics – Prometheus scrape endpoint (secret-protected)
    # -----------------------------------------------------------------------
    @app.get("/metrics", include_in_schema=False)
    async def metrics(request: Request) -> PlainTextResponse:
        if METRICS_SECRET:
            auth = request.headers.get("Authorization", "")
            # Accept "Bearer <secret>" or "Basic" in internal networks
            if auth != f"Bearer {METRICS_SECRET}":
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Metrics endpoint requires a valid internal secret.",
                )
        data = generate_latest()
        return PlainTextResponse(data, media_type=CONTENT_TYPE_LATEST)

    # -----------------------------------------------------------------------
    # 7. Global unhandled exception handler
    # -----------------------------------------------------------------------
    @app.exception_handler(Exception)
    async def unhandled_exception_handler(request: Request, exc: Exception) -> JSONResponse:
        logging.getLogger("pitchperfect.app").exception(
            "Unhandled exception: %s %s", request.method, request.url.path
        )
        return JSONResponse(
            status_code=500,
            content={"code": "INTERNAL_SERVER_ERROR", "message": "An unexpected error occurred."},
        )

    # -----------------------------------------------------------------------
    # 8. Routers
    # -----------------------------------------------------------------------
    app.include_router(health_router)                                          # /health, /health/live, /health/ready
    app.include_router(auth_router)                                            # /api/v1/auth/*
    app.include_router(interview_router)                                       # /api/v1/interviews/*
    app.include_router(questions_router)                                        # /api/v1/questions/*
    app.include_router(ws_router.router, tags=["WebSocket"])                   # /ws/interview/{session_id}
    # app.include_router(analytics_router, prefix="/api/v1/analytics",  tags=["Analytics"])

    return app


app = create_app()
