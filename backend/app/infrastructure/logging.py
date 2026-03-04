from __future__ import annotations

import hashlib
import json
import logging
import re
import sys
import time
import uuid
from contextvars import ContextVar
from typing import Any

from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint

# ---------------------------------------------------------------------------
# Context variable – propagated across the async call chain for a request
# ---------------------------------------------------------------------------
_request_id_ctx: ContextVar[str] = ContextVar("request_id", default="-")

def get_request_id() -> str:
    return _request_id_ctx.get()


# ---------------------------------------------------------------------------
# Sensitive data masking patterns
# ---------------------------------------------------------------------------
_MASK_PATTERNS: list[tuple[re.Pattern, str]] = [
    # Email  →  us***@example.com
    (re.compile(r'([a-zA-Z0-9._%+\-]{2})[a-zA-Z0-9._%+\-]*(@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,})'),
     r'\1***\2'),
    # Bearer tokens
    (re.compile(r'(Bearer\s+)[A-Za-z0-9\-_\.]+'), r'\1[REDACTED]'),
    # password / secret / token key-value pairs (JSON or query string)
    (re.compile(r'("(?:password|secret|token|api_key|apikey)"\s*:\s*)"[^"]*"', re.I),
     r'\1"[REDACTED]"'),
    # Authorization header value
    (re.compile(r'(authorization\s*:\s*)[^\s,]+', re.I), r'\1[REDACTED]'),
]


def mask_sensitive(text: str) -> str:
    for pattern, replacement in _MASK_PATTERNS:
        text = pattern.sub(replacement, text)
    return text


# ---------------------------------------------------------------------------
# JSON log formatter
# ---------------------------------------------------------------------------
class JSONFormatter(logging.Formatter):
    """
    Emits one JSON object per log record – stdout/stderr friendly for
    container log collectors (Loki, CloudWatch, GCP Logging, etc.)
    """

    IGNORED_ATTRS = frozenset({
        "args", "created", "exc_info", "exc_text", "filename", "funcName",
        "levelno", "lineno", "message", "module", "msecs", "msg", "name",
        "pathname", "process", "processName", "relativeCreated", "stack_info",
        "taskName", "thread", "threadName",
    })

    def format(self, record: logging.LogRecord) -> str:
        record.message = record.getMessage()
        if record.exc_info:
            record.exc_text = self.formatException(record.exc_info)

        payload: dict[str, Any] = {
            "timestamp":  self.formatTime(record, "%Y-%m-%dT%H:%M:%S.%(msecs)03dZ"),
            "level":      record.levelname,
            "logger":     record.name,
            "message":    mask_sensitive(record.message),
            "trace_id":   get_request_id(),
            "module":     record.module,
            "function":   record.funcName,
            "line":       record.lineno,
        }

        if record.exc_text:
            payload["exception"] = mask_sensitive(record.exc_text)

        # Attach any extra fields the caller passed via `extra={}`
        for key, val in record.__dict__.items():
            if key not in self.IGNORED_ATTRS and not key.startswith("_"):
                payload[key] = val

        return json.dumps(payload, default=str, ensure_ascii=False)


# ---------------------------------------------------------------------------
# Logger factory
# ---------------------------------------------------------------------------
def get_logger(name: str) -> logging.Logger:
    return logging.getLogger(name)


def configure_logging(level: str = "INFO") -> None:
    """
    Call once at application startup (from lifespan / __main__).
    Replaces all handlers on the root logger with a single JSON stdout handler.
    """
    root = logging.getLogger()
    root.setLevel(getattr(logging, level.upper(), logging.INFO))

    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(JSONFormatter())

    root.handlers.clear()
    root.addHandler(handler)

    # Keep uvicorn noise structured too
    for uvicorn_logger in ("uvicorn", "uvicorn.error", "uvicorn.access"):
        lg = logging.getLogger(uvicorn_logger)
        lg.handlers = [handler]
        lg.propagate = False


# ---------------------------------------------------------------------------
# Request-ID middleware
# ---------------------------------------------------------------------------
class RequestIDMiddleware(BaseHTTPMiddleware):
    """
    Reads X-Request-ID from inbound headers (or generates a UUID v4),
    stores it in the async ContextVar so all loggers in the request chain
    automatically include it, and echoes it back in the response header.
    """

    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        request_id = request.headers.get("X-Request-ID") or str(uuid.uuid4())
        token = _request_id_ctx.set(request_id)

        logger = get_logger("pitchperfect.request")
        start = time.perf_counter()

        try:
            response: Response = await call_next(request)
        except Exception:
            logger.exception(
                "Unhandled exception",
                extra={"method": request.method, "path": request.url.path},
            )
            raise
        finally:
            duration_ms = round((time.perf_counter() - start) * 1_000, 2)
            logger.info(
                "HTTP %s %s → %s  %.2fms",
                request.method,
                mask_sensitive(str(request.url.path)),
                response.status_code if "response" in dir() else "ERR",
                duration_ms,
                extra={
                    "method":      request.method,
                    "path":        request.url.path,
                    "status_code": getattr(response, "status_code", None),
                    "duration_ms": duration_ms,
                },
            )
            _request_id_ctx.reset(token)

        response.headers["X-Request-ID"] = request_id
        return response
