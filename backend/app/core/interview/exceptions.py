"""
app/core/interview/exceptions.py

Typed domain exceptions for the interview flow.

Each exception carries a structured `detail` dict and a suggested HTTP status
code so that API route handlers can translate them cleanly without reaching
into lower layers.

Usage in a route handler:
    from app.core.interview.exceptions import InterviewNotFoundError
    from fastapi import HTTPException

    try:
        interview = await service.get_interview(id)
    except InterviewNotFoundError as exc:
        raise HTTPException(status_code=exc.http_status, detail=exc.detail)
"""
from __future__ import annotations

from uuid import UUID


class PitchPerfectError(Exception):
    """Base class for all PitchPerfect domain exceptions."""

    http_status: int = 500
    code: str = "INTERNAL_ERROR"

    def __init__(self, message: str) -> None:
        super().__init__(message)
        self.message = message

    @property
    def detail(self) -> dict:
        return {"code": self.code, "message": self.message}


# ---------------------------------------------------------------------------
# 404 — Not found
# ---------------------------------------------------------------------------

class InterviewNotFoundError(PitchPerfectError):
    http_status = 404
    code = "INTERVIEW_NOT_FOUND"

    def __init__(self, interview_id: UUID | str) -> None:
        super().__init__(f"Interview '{interview_id}' not found.")
        self.interview_id = interview_id


class SessionNotFoundError(PitchPerfectError):
    http_status = 404
    code = "SESSION_NOT_FOUND"

    def __init__(self, session_id: UUID | str) -> None:
        super().__init__(f"Interview session '{session_id}' not found.")
        self.session_id = session_id


class QARecordNotFoundError(PitchPerfectError):
    http_status = 404
    code = "QA_RECORD_NOT_FOUND"

    def __init__(self, record_id: UUID | str) -> None:
        super().__init__(f"QA record '{record_id}' not found.")
        self.record_id = record_id


# ---------------------------------------------------------------------------
# 403 — Forbidden
# ---------------------------------------------------------------------------

class UnauthorizedInterviewAccessError(PitchPerfectError):
    http_status = 403
    code = "INTERVIEW_ACCESS_DENIED"

    def __init__(self, user_id: UUID | str, interview_id: UUID | str) -> None:
        super().__init__(
            f"User '{user_id}' is not authorised to access interview '{interview_id}'."
        )
        self.user_id = user_id
        self.interview_id = interview_id


# ---------------------------------------------------------------------------
# 409 — Conflict
# ---------------------------------------------------------------------------

class InterviewAlreadyCompletedError(PitchPerfectError):
    http_status = 409
    code = "INTERVIEW_ALREADY_COMPLETED"

    def __init__(self, interview_id: UUID | str) -> None:
        super().__init__(
            f"Interview '{interview_id}' is already completed and cannot be modified."
        )
        self.interview_id = interview_id


# ---------------------------------------------------------------------------
# 422 — Unprocessable
# ---------------------------------------------------------------------------

class MediaProcessingError(PitchPerfectError):
    http_status = 422
    code = "MEDIA_PROCESSING_ERROR"

    def __init__(self, detail: str = "Failed to process media chunk.") -> None:
        super().__init__(detail)


class InvalidTranscriptError(PitchPerfectError):
    http_status = 422
    code = "INVALID_TRANSCRIPT"

    def __init__(self, detail: str = "Transcript is empty or too short to evaluate.") -> None:
        super().__init__(detail)


# ---------------------------------------------------------------------------
# 502 — Upstream AI failure
# ---------------------------------------------------------------------------

class AIServiceError(PitchPerfectError):
    http_status = 502
    code = "AI_SERVICE_ERROR"

    def __init__(self, detail: str = "The AI service did not return a valid response.") -> None:
        super().__init__(detail)


class QuestionGenerationError(AIServiceError):
    code = "QUESTION_GENERATION_FAILED"

    def __init__(self, detail: str = "Failed to generate interview questions.") -> None:
        super().__init__(detail)


class EvaluationError(AIServiceError):
    code = "EVALUATION_FAILED"

    def __init__(self, detail: str = "Failed to evaluate the interview answer.") -> None:
        super().__init__(detail)
