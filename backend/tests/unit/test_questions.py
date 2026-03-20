"""Tests for POST /api/v1/questions/behavioral and /technical."""
from __future__ import annotations

import os
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from httpx import AsyncClient

from app.core.ai.service import QuestionList, Question

MOCK_QUESTIONS = QuestionList(questions=[
    Question(id=1, text="Tell me about a challenging project.", type="behavioral"),
    Question(id=2, text="How do you handle conflict?", type="behavioral"),
])

VALID_PAYLOAD = {
    "resume_text": "5 years Python, FastAPI, PostgreSQL. Led backend migration.",
    "job_description": "Build scalable REST APIs.",
    "job_role": "Backend Engineer",
    "num_questions": 2,
}


def _mock_ai():
    """Context manager: patches the singleton _ai_service in questions.py."""
    svc = MagicMock()
    svc.generate_questions = AsyncMock(return_value=MOCK_QUESTIONS)
    return svc


# ---------------------------------------------------------------------------
# Behavioral
# ---------------------------------------------------------------------------
async def test_behavioral_success(client: AsyncClient):
    with (
        patch("app.api.v1.questions._get_ai_service", return_value=_mock_ai()),
        patch.dict(os.environ, {"GEMINI_API_KEY": "test-key"}),
    ):
        res = await client.post("/api/v1/questions/behavioral", json=VALID_PAYLOAD)

    assert res.status_code == 200
    body = res.json()
    assert body["success"] is True
    assert len(body["questions"]) == 2
    assert all("id" in q and "text" in q for q in body["questions"])


async def test_behavioral_missing_resume_text(client: AsyncClient):
    payload = {k: v for k, v in VALID_PAYLOAD.items() if k != "resume_text"}
    res = await client.post("/api/v1/questions/behavioral", json=payload)
    assert res.status_code == 422


async def test_behavioral_no_api_key(client: AsyncClient):
    """Without GEMINI_API_KEY the service returns 503."""
    with patch.dict(os.environ, {}, clear=True):
        # Reset singleton so it re-reads the env
        import app.api.v1.questions as q_mod
        q_mod._ai_service = None
        res = await client.post("/api/v1/questions/behavioral", json=VALID_PAYLOAD)
    assert res.status_code == 503


# ---------------------------------------------------------------------------
# Technical
# ---------------------------------------------------------------------------
async def test_technical_success(client: AsyncClient):
    with (
        patch("app.api.v1.questions._get_ai_service", return_value=_mock_ai()),
        patch.dict(os.environ, {"GEMINI_API_KEY": "test-key"}),
    ):
        res = await client.post("/api/v1/questions/technical", json=VALID_PAYLOAD)

    assert res.status_code == 200
    body = res.json()
    assert body["success"] is True
    assert len(body["questions"]) > 0


async def test_technical_missing_resume_text(client: AsyncClient):
    payload = {k: v for k, v in VALID_PAYLOAD.items() if k != "resume_text"}
    res = await client.post("/api/v1/questions/technical", json=payload)
    assert res.status_code == 422


async def test_technical_num_questions_validation(client: AsyncClient):
    """num_questions must be 1-20; 0 should fail."""
    payload = {**VALID_PAYLOAD, "num_questions": 0}
    res = await client.post("/api/v1/questions/technical", json=payload)
    assert res.status_code == 422
