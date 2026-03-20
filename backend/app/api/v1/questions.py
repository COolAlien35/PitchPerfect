"""Question generation endpoints — powered by LangChain + Gemini."""
from __future__ import annotations

import logging
import os
from typing import List, Optional

from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field

from ...core.ai.service import AIService

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/v1/questions", tags=["Questions"])

# ---------------------------------------------------------------------------
# Singleton AI service — lazily initialised on first request
# ---------------------------------------------------------------------------
_ai_service: Optional[AIService] = None


def _get_ai_service() -> AIService:
    global _ai_service
    if _ai_service is None:
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="GEMINI_API_KEY is not configured.",
            )
        _ai_service = AIService(api_key=api_key)
    return _ai_service


# ---------------------------------------------------------------------------
# Request / Response schemas
# ---------------------------------------------------------------------------
class QuestionRequest(BaseModel):
    resume_text: str = Field(..., min_length=1, description="Candidate resume as plain text")
    job_description: str = Field("", description="Job description text")
    job_role: str = Field("Software Engineer", description="Target role title")
    num_questions: int = Field(5, ge=1, le=20, description="Number of questions to generate")


class QuestionItem(BaseModel):
    id: int
    text: str
    type: str


class QuestionResponse(BaseModel):
    success: bool = True
    questions: List[QuestionItem]


# ---------------------------------------------------------------------------
# POST /api/v1/questions/behavioral
# ---------------------------------------------------------------------------
@router.post(
    "/behavioral",
    response_model=QuestionResponse,
    summary="Generate behavioral interview questions from resume + job description.",
)
async def generate_behavioral_questions(body: QuestionRequest) -> QuestionResponse:
    svc = _get_ai_service()
    try:
        result = await svc.generate_questions(
            resume_text=body.resume_text,
            job_description=body.job_description or "General behavioral interview",
            job_role=body.job_role,
            num_questions=body.num_questions,
        )
        return QuestionResponse(
            questions=[
                QuestionItem(id=q.id, text=q.text, type=q.type)
                for q in result.questions
            ]
        )
    except RuntimeError as exc:
        logger.error("Behavioral question generation failed: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=str(exc),
        )


# ---------------------------------------------------------------------------
# POST /api/v1/questions/technical
# ---------------------------------------------------------------------------
@router.post(
    "/technical",
    response_model=QuestionResponse,
    summary="Generate technical interview questions from resume + role.",
)
async def generate_technical_questions(body: QuestionRequest) -> QuestionResponse:
    svc = _get_ai_service()
    try:
        result = await svc.generate_questions(
            resume_text=body.resume_text,
            job_description=body.job_description or f"Technical role: {body.job_role}",
            job_role=body.job_role,
            num_questions=body.num_questions,
        )
        return QuestionResponse(
            questions=[
                QuestionItem(id=q.id, text=q.text, type=q.type)
                for q in result.questions
            ]
        )
    except RuntimeError as exc:
        logger.error("Technical question generation failed: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=str(exc),
        )
