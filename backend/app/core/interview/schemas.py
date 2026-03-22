"""
app/core/interview/schemas.py

Pydantic v2 domain schemas for the interview flow.

These are the "internal" data-transfer objects used between service and API
layers. They are separate from the ORM models (SQLAlchemy) and from the raw
API request/response payloads, providing a clean domain boundary.
"""
from __future__ import annotations

from datetime import datetime
from enum import Enum
from typing import List, Optional
from uuid import UUID

from pydantic import BaseModel, Field, field_validator


# ---------------------------------------------------------------------------
# Enums
# ---------------------------------------------------------------------------

class QuestionType(str, Enum):
    BEHAVIORAL = "behavioral"
    TECHNICAL = "technical"
    SITUATIONAL = "situational"
    GENERAL = "general"


class QuestionDifficulty(str, Enum):
    EASY = "easy"
    MEDIUM = "medium"
    HARD = "hard"


class InterviewStatusEnum(str, Enum):
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    FAILED = "failed"


# ---------------------------------------------------------------------------
# Questions
# ---------------------------------------------------------------------------

class QuestionSchema(BaseModel):
    """A single generated interview question."""

    id: int = Field(..., description="1-based question index within the session")
    text: str = Field(..., min_length=5, description="The question text")
    type: QuestionType = QuestionType.GENERAL
    difficulty: QuestionDifficulty = QuestionDifficulty.MEDIUM
    follow_up_hints: Optional[List[str]] = Field(
        default=None,
        description="Optional AI-generated hints for the interviewer/system",
    )


class QuestionListSchema(BaseModel):
    """Container returned by the AI question-generation pipeline."""

    questions: List[QuestionSchema]
    job_role: str
    total: int = Field(default=0)

    def model_post_init(self, __context: object) -> None:
        self.total = len(self.questions)


# ---------------------------------------------------------------------------
# Answer Feedback
# ---------------------------------------------------------------------------

class AnswerFeedbackSchema(BaseModel):
    """Structured AI evaluation of a single answer."""

    clarity_score: float = Field(..., ge=0, le=10, description="How clear was the answer?")
    tech_depth_score: float = Field(..., ge=0, le=10, description="Technical depth (0 if N/A)")
    communication_score: float = Field(..., ge=0, le=10, description="Communication quality")
    overall_score: float = Field(default=0.0, ge=0, le=10)
    detailed_feedback: str = Field(..., min_length=1)
    suggested_answer_points: List[str] = Field(default_factory=list)
    strengths: List[str] = Field(default_factory=list)
    improvements: List[str] = Field(default_factory=list)

    def model_post_init(self, __context: object) -> None:
        self.overall_score = round(
            (self.clarity_score + self.tech_depth_score + self.communication_score) / 3.0, 2
        )


# ---------------------------------------------------------------------------
# Session Metrics
# ---------------------------------------------------------------------------

class VoiceMetricsSchema(BaseModel):
    """Aggregated voice/speech metrics for a session."""

    avg_wpm: Optional[float] = None
    avg_volume: Optional[float] = None
    filler_word_count: Optional[int] = None
    confidence_score: Optional[float] = Field(default=None, ge=0, le=10)
    clarity_score: Optional[float] = Field(default=None, ge=0, le=10)


class FacialMetricsSchema(BaseModel):
    """Aggregated facial-expression metrics for a session."""

    dominant_emotion: Optional[str] = None
    emotion_distribution: Optional[dict] = None    # {"happy": 0.45, "neutral": 0.40, ...}
    avg_confidence: Optional[float] = Field(default=None, ge=0, le=1)


class SessionMetricsSchema(BaseModel):
    """Full performance metrics for one interview session."""

    overall_score: float = Field(default=0.0, ge=0, le=10)
    per_question_scores: List[float] = Field(default_factory=list)
    voice: Optional[VoiceMetricsSchema] = None
    facial: Optional[FacialMetricsSchema] = None
    questions_answered: int = 0
    total_questions: int = 0


# ---------------------------------------------------------------------------
# Interview CRUD schemas
# ---------------------------------------------------------------------------

class InterviewCreateSchema(BaseModel):
    """Request body for creating a new interview."""

    title: str = Field(..., min_length=1, max_length=255)
    job_role: str = Field(..., min_length=1, max_length=255)
    job_description: str = Field(..., min_length=10)

    @field_validator("title", "job_role", mode="before")
    @classmethod
    def _strip(cls, v: str) -> str:
        return v.strip()


class InterviewResponseSchema(BaseModel):
    """Response body returned after creating / fetching an interview."""

    id: UUID
    title: str
    job_role: str
    status: InterviewStatusEnum
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


# ---------------------------------------------------------------------------
# Session schemas
# ---------------------------------------------------------------------------

class SessionCreateSchema(BaseModel):
    """Internal DTO used when initialising a new interview session."""

    interview_id: UUID
    total_questions: int = Field(default=0, ge=0)


class SessionResponseSchema(BaseModel):
    """Full session details returned by the API."""

    id: UUID
    interview_id: UUID
    overall_score: Optional[float]
    detailed_metrics: Optional[dict]
    created_at: datetime

    model_config = {"from_attributes": True}


# ---------------------------------------------------------------------------
# QA Record schemas
# ---------------------------------------------------------------------------

class QARecordCreateSchema(BaseModel):
    """Internal DTO for inserting a QA record."""

    session_id: UUID
    question: str
    transcript: str = ""
    ai_feedback: Optional[dict] = None
    audio_metrics: Optional[dict] = None
    video_metrics: Optional[dict] = None


class QARecordResponseSchema(BaseModel):
    """Full QA record detail for API consumers."""

    id: UUID
    session_id: UUID
    question: str
    transcript: Optional[str]
    ai_feedback: Optional[AnswerFeedbackSchema]
    audio_metrics: Optional[VoiceMetricsSchema]
    video_metrics: Optional[FacialMetricsSchema]
    created_at: datetime

    model_config = {"from_attributes": True}
