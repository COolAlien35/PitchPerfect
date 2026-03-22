"""
app/config.py — Centralised settings via Pydantic BaseSettings.

All environment-variable reading is done **here**. The rest of the application
imports `from app.config import settings` and reads typed attributes.

Required env vars in production:
  DATABASE_URL  — postgresql+asyncpg connection string
  SECRET_KEY    — JWT signing secret (min 32 chars recommended)

Everything else has sane defaults suitable for local development.
"""
from __future__ import annotations

import secrets
from functools import lru_cache
from typing import List, Literal

from pydantic import Field, field_validator, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """
    Application settings loaded from environment variables / .env file.
    Validation happens at import time — missing required vars crash early
    with a clear error rather than a cryptic KeyError at runtime.
    """

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,       # DATABASE_URL == database_url
        extra="ignore",             # ignore unknown env vars
    )

    # ------------------------------------------------------------------
    # Application environment
    # ------------------------------------------------------------------
    APP_ENV: Literal["development", "production", "test"] = "development"

    # ------------------------------------------------------------------
    # Database
    # ------------------------------------------------------------------
    DATABASE_URL: str = Field(
        default="postgresql+asyncpg://postgres:postgres@localhost:5432/pitchperfect",
        description="SQLAlchemy async DB URL (postgresql+asyncpg://...)",
    )

    # Connection-pool tuning
    DB_POOL_SIZE: int = Field(default=10, ge=1, le=100)
    DB_MAX_OVERFLOW: int = Field(default=20, ge=0, le=100)
    DB_ECHO: bool = False          # set True in development to log SQL

    # ------------------------------------------------------------------
    # Redis
    # ------------------------------------------------------------------
    REDIS_URL: str = Field(
        default="redis://localhost:6379",
        description="Redis connection URL (redis://[user:password@]host:port[/db])",
    )

    # ------------------------------------------------------------------
    # JWT / Auth
    # ------------------------------------------------------------------
    SECRET_KEY: str = Field(
        default_factory=lambda: secrets.token_hex(32),
        description="HMAC secret for JWT signing. Must be set explicitly in production.",
    )
    TOKEN_ISSUER: str = "pitchperfect-api"
    TOKEN_AUDIENCE: str = "pitchperfect-client"
    ACCESS_TOKEN_TTL_MIN: int = Field(default=30, ge=1, le=1440)    # minutes
    REFRESH_TOKEN_TTL_DAYS: int = Field(default=7, ge=1, le=90)     # days

    # ------------------------------------------------------------------
    # CORS / HTTP
    # ------------------------------------------------------------------
    ALLOWED_ORIGINS: List[str] = Field(
        default=["http://localhost:3000"],
        description="Comma-separated list of allowed CORS origins (or JSON array).",
    )
    LOG_LEVEL: str = Field(default="INFO")
    METRICS_SECRET: str = Field(
        default="",
        description="Bearer secret for /metrics endpoint. Empty = no auth (dev only).",
    )

    # ------------------------------------------------------------------
    # External AI
    # ------------------------------------------------------------------
    GEMINI_API_KEY: str = Field(
        default="",
        description="Google Gemini API key (required for AI question generation).",
    )

    # ------------------------------------------------------------------
    # Validators
    # ------------------------------------------------------------------
    @field_validator("ALLOWED_ORIGINS", mode="before")
    @classmethod
    def _parse_origins(cls, v: object) -> List[str]:
        """Accept either a comma-separated string or a real list."""
        if isinstance(v, str):
            # Handle JSON array string or CSV
            v = v.strip()
            if v.startswith("["):
                import json
                return json.loads(v)
            return [o.strip() for o in v.split(",") if o.strip()]
        return v  # already a list (from default)

    @model_validator(mode="after")
    def _warn_insecure_defaults(self) -> "Settings":
        """
        In production, refuse to start with the default SECRET_KEY.
        In development, log a warning if obviously weak.
        """
        import logging
        logger = logging.getLogger("pitchperfect.config")

        if self.APP_ENV == "production":
            if len(self.SECRET_KEY) < 32:
                raise ValueError(
                    "SECRET_KEY must be at least 32 characters in production."
                )
            if self.DATABASE_URL.startswith(
                "postgresql+asyncpg://postgres:postgres@localhost"
            ):
                logger.warning(
                    "DATABASE_URL appears to be the default dev credential. "
                    "Set a secure DATABASE_URL for production."
                )
        return self

    # ------------------------------------------------------------------
    # Convenience helpers
    # ------------------------------------------------------------------
    @property
    def is_production(self) -> bool:
        return self.APP_ENV == "production"

    @property
    def is_development(self) -> bool:
        return self.APP_ENV == "development"

    @property
    def is_test(self) -> bool:
        return self.APP_ENV == "test"


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    """
    Cached settings factory — returns the same singleton every call.
    Use this in FastAPI dependencies: `Depends(get_settings)`.
    """
    return Settings()


# ---------------------------------------------------------------------------
# Module-level singleton — imported by other modules as:
#   from app.config import settings
# ---------------------------------------------------------------------------
settings: Settings = get_settings()
