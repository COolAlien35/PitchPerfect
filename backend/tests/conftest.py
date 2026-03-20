"""
Shared test fixtures for PitchPerfect backend.

Uses SQLite + aiosqlite for all tests (no PostgreSQL needed).
Redis is mocked. External services (OpenAI, Gemini, httpx microservices) are mocked.

pytest.ini / pyproject.toml requires:
    [tool.pytest.ini_options]
    asyncio_mode = "auto"
    asyncio_default_fixture_loop_scope = "session"
"""
from __future__ import annotations

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
from app.models import Base  # imports all models including ScheduledSession
from app.api.dependencies import get_db
from app.core.ai.service import FeedbackModel, QuestionList, Question

# ---------------------------------------------------------------------------
# Test database — SQLite in-memory via aiosqlite
# ---------------------------------------------------------------------------
TEST_DB_URL = "sqlite+aiosqlite:///./test_pitchperfect.db"

# ---------------------------------------------------------------------------
# Session-scoped engine + schema bootstrap
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
# Mock: AIService
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
    detailed_feedback="Good answer.",
    suggested_answer_points=["mention asyncio event loop"],
)


@pytest.fixture
def mock_ai_service():
    with patch("app.core.ai.service.ChatGoogleGenerativeAI"):
        ai_mock = MagicMock()
        ai_mock.generate_questions = AsyncMock(return_value=MOCK_QUESTIONS)
        ai_mock.evaluate_response = AsyncMock(return_value=MOCK_FEEDBACK)
        yield ai_mock


# ---------------------------------------------------------------------------
# Mock: Whisper transcription (patches transcribe_audio, not deleted method)
# ---------------------------------------------------------------------------
@pytest.fixture
def mock_transcribe():
    with patch(
        "app.core.media.stream_processor.StreamProcessor.transcribe_audio",
        new_callable=AsyncMock,
        return_value="Mock transcript.",
    ) as mock_t:
        yield mock_t


# ---------------------------------------------------------------------------
# Mock: Redis
# ---------------------------------------------------------------------------
@pytest.fixture
def mock_redis():
    with patch("app.infrastructure.redis_manager.redis_manager") as mock_r:
        mock_r._client = AsyncMock()
        mock_r.get = AsyncMock(return_value=None)
        mock_r.set = AsyncMock(return_value=True)
        mock_r.delete = AsyncMock(return_value=1)
        yield mock_r


# ---------------------------------------------------------------------------
# FastAPI test app — overrides DB + Redis
# ---------------------------------------------------------------------------
@pytest_asyncio.fixture
async def app(db_session, mock_redis):
    """FastAPI app with overridden DB dependency and mocked Redis."""
    _app = create_app()

    async def _override_get_db() -> AsyncGenerator[AsyncSession, None]:
        yield db_session

    _app.dependency_overrides[get_db] = _override_get_db
    yield _app
    _app.dependency_overrides.clear()


# ---------------------------------------------------------------------------
# HTTP test client
# ---------------------------------------------------------------------------
@pytest_asyncio.fixture
async def client(app) -> AsyncGenerator[AsyncClient, None]:
    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://testserver",
        follow_redirects=True,
    ) as ac:
        yield ac


# ---------------------------------------------------------------------------
# Helpers — register + login, return auth header
# ---------------------------------------------------------------------------
async def _register_and_login(client: AsyncClient, email: str | None = None) -> dict[str, str]:
    email = email or f"test_{uuid4().hex[:8]}@pp.test"
    payload = {"email": email, "password": "Test@Password123", "full_name": "Test User"}
    reg = await client.post("/api/v1/auth/register", json=payload)
    assert reg.status_code == 201, reg.text

    login = await client.post("/api/v1/auth/login", json={"email": email, "password": "Test@Password123"})
    assert login.status_code == 200, login.text

    token = login.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


@pytest_asyncio.fixture
async def auth_headers(client: AsyncClient) -> dict[str, str]:
    return await _register_and_login(client)
