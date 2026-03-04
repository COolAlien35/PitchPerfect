"""
Global test fixtures for PitchPerfect backend.
All async tests use pytest-asyncio in auto mode.

pyproject.toml / pytest.ini must include:
    [tool.pytest.ini_options]
    asyncio_mode      = "auto"
    asyncio_default_fixture_loop_scope = "session"
    addopts             = "-x --tb=short"   # fail-fast
"""
from __future__ import annotations

import asyncio
from collections.abc import AsyncGenerator
from typing import Any
from unittest.mock import AsyncMock, MagicMock, patch
from uuid import uuid4

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)

from app.main import create_app
from app.models.base import Base
from app.core.ai.service import FeedbackModel, QuestionList, Question

# ---------------------------------------------------------------------------
# Test database URL – uses SQLite via aiosqlite for M1 ARM64 compatibility.
# Swap to a real pg URL in CI (set TEST_DATABASE_URL env var).
# ---------------------------------------------------------------------------
import os

TEST_DB_URL = os.getenv(
    "TEST_DATABASE_URL",
    "sqlite+aiosqlite:///./test_pitchperfect.db"
)

# ---------------------------------------------------------------------------
# Session-scoped async engine + schema bootstrap
# ---------------------------------------------------------------------------
@pytest_asyncio.fixture(scope="session")
async def engine():
    _engine = create_async_engine(TEST_DB_URL, echo=False, future=True)
    async with _engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield _engine
    async with _engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    await _engine.dispose()


@pytest_asyncio.fixture(scope="session")
def session_factory(engine):
    return async_sessionmaker(engine, expire_on_commit=False, class_=AsyncSession)


# ---------------------------------------------------------------------------
# Function-scoped DB session (rolled back after each test)
# ---------------------------------------------------------------------------
@pytest_asyncio.fixture
async def db_session(session_factory) -> AsyncGenerator[AsyncSession, None]:
    async with session_factory() as session:
        async with session.begin():
            yield session
            await session.rollback()


# ---------------------------------------------------------------------------
# Mock: AIService – prevents Gemini API calls
# ---------------------------------------------------------------------------
MOCK_QUESTIONS = QuestionList(
    questions=[
        Question(id=1, text="Explain async/await in Python.", type="technical"),
        Question(id=2, text="Describe a challenging project.", type="behavioral"),
    ]
)

MOCK_FEEDBACK = FeedbackModel(
    clarity_score=8,
    tech_depth_score=7,
    communication_score=9,
    detailed_feedback="Good answer. Consider elaborating on edge cases.",
    suggested_answer_points=["mention asyncio event loop", "discuss cancellation"],
)


@pytest.fixture
def mock_ai_service():
    with patch("app.core.ai.service.ChatGoogleGenerativeAI") as _mock_llm:
        ai_service_mock              = MagicMock()
        ai_service_mock.generate_questions = AsyncMock(return_value=MOCK_QUESTIONS)
        ai_service_mock.evaluate_response  = AsyncMock(return_value=MOCK_FEEDBACK)
        yield ai_service_mock


# ---------------------------------------------------------------------------
# Mock: WhisperService – prevents OpenAI/local Whisper calls
# ---------------------------------------------------------------------------
@pytest.fixture
def mock_whisper_service():
    with patch("app.core.media.stream_processor.StreamProcessor._dispatch_transcription") as mock_t:
        mock_t.return_value = None
        yield mock_t


# ---------------------------------------------------------------------------
# Test app + HTTP client
# ---------------------------------------------------------------------------
@pytest_asyncio.fixture
async def app(db_session, mock_ai_service, mock_whisper_service):
    """FastAPI app with overridden DB and mocked AI dependencies."""
    from app.infrastructure.redis_manager import redis_manager
    from sqlalchemy.ext.asyncio import AsyncSession

    _app = create_app()

    # Override the DB session dependency
    async def _override_get_session() -> AsyncGenerator[AsyncSession, None]:
        yield db_session

    # Override Redis with a no-op mock
    redis_manager._client = AsyncMock()

    return _app


@pytest_asyncio.fixture
async def client(app) -> AsyncGenerator[AsyncClient, None]:
    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://testserver",
        follow_redirects=True,
    ) as ac:
        yield ac


# ---------------------------------------------------------------------------
# Fixture: authenticated user + JWT header
# ---------------------------------------------------------------------------
@pytest_asyncio.fixture
async def auth_headers(client: AsyncClient) -> dict[str, str]:
    """Register a user and return Authorization header."""
    user_payload = {
        "email":     f"test_{uuid4().hex[:8]}@pitchperfect.test",
        "password":  "Test@Password123",
        "full_name": "Test User",
    }
    reg = await client.post("/api/v1/auth/register", json=user_payload)
    assert reg.status_code == 201, reg.text

    login = await client.post(
        "/api/v1/auth/login",
        data={"username": user_payload["email"], "password": user_payload["password"]},
    )
    assert login.status_code == 200, login.text
    token = login.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}
