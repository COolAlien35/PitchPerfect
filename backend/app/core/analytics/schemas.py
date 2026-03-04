from __future__ import annotations

from typing import Annotated

from pydantic import BaseModel, Field, field_validator, model_validator

# ---------------------------------------------------------------------------
# Primitive aliases
# ---------------------------------------------------------------------------
Score = Annotated[float, Field(ge=0.0, le=100.0)]
NullableScore = Annotated[float | None, Field(ge=0.0, le=100.0, default=None)]


# ---------------------------------------------------------------------------
# Skill-level breakdown (Radar chart)
# ---------------------------------------------------------------------------
class SkillBreakdown(BaseModel):
    """Normalised 0–100 scores for each measured competency dimension."""

    model_config = {"strict": True}

    communication: Score = Field(description="Voice clarity, WPM cadence, filler word penalty")
    engagement: Score = Field(description="Facial emotion intensity and sustained eye contact")
    substance: Score = Field(description="Transcript depth, technical accuracy, structured reasoning")
    overall: Score = Field(description="Weighted composite of all three dimensions")

    # Derived convenience
    @property
    def radar_data(self) -> list[dict]:
        return [
            {"axis": "Communication", "value": self.communication},
            {"axis": "Engagement",    "value": self.engagement},
            {"axis": "Substance",     "value": self.substance},
        ]


# ---------------------------------------------------------------------------
# Per-QA record summary (nested inside SessionReport)
# ---------------------------------------------------------------------------
class QAMetricSummary(BaseModel):
    record_id: str
    question: str
    clarity_score: NullableScore
    tech_depth_score: NullableScore
    communication_score: NullableScore
    wpm: float | None = None
    filler_word_count: int | None = None
    dominant_emotion: str | None = None
    emotion_intensity: float | None = None           # 0.0 – 1.0


# ---------------------------------------------------------------------------
# Full session report
# ---------------------------------------------------------------------------
class SessionReport(BaseModel):
    """Complete analytics report for a finished InterviewSession."""

    model_config = {"strict": False}   # Allow extra from DB rows

    session_id: str
    interview_id: str
    skill_breakdown: SkillBreakdown
    qa_summaries: list[QAMetricSummary] = Field(default_factory=list)
    total_questions: int = 0
    answered_questions: int = 0
    duration_seconds: float | None = None
    completed: bool = False

    @model_validator(mode="after")
    def _set_completed(self) -> SessionReport:
        self.completed = (
            self.answered_questions > 0
            and self.answered_questions == self.total_questions
        )
        return self

    @property
    def completion_rate(self) -> float:
        if self.total_questions == 0:
            return 0.0
        return round(self.answered_questions / self.total_questions * 100, 1)


# ---------------------------------------------------------------------------
# Time-series trend (for charts)
# ---------------------------------------------------------------------------
class TrendPoint(BaseModel):
    """A single data-point in a time-series trend."""

    session_index: int              # 1-based ordinal (chronological)
    session_id: str
    date: str                       # ISO-8601 date string
    communication_score: NullableScore
    substance_score: NullableScore
    overall_score: NullableScore


class TrendData(BaseModel):
    """Aggregated time-series trend for the last N sessions."""

    user_id: str
    session_count: int
    points: list[TrendPoint] = Field(default_factory=list)

    # Derived: simple linear delta between first and last point
    @property
    def communication_delta(self) -> float | None:
        valid = [p.communication_score for p in self.points if p.communication_score is not None]
        return round(valid[-1] - valid[0], 2) if len(valid) >= 2 else None

    @property
    def substance_delta(self) -> float | None:
        valid = [p.substance_score for p in self.points if p.substance_score is not None]
        return round(valid[-1] - valid[0], 2) if len(valid) >= 2 else None
