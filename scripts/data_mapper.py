"""
data_mapper.py – Firestore → PostgreSQL data normalisation utilities.

Handles the structural mismatch between Firestore's schemaless documents
and the typed PostgreSQL domain models.
"""
from __future__ import annotations

import re
import uuid
from datetime import datetime, timezone
from typing import Any

from google.cloud.firestore_v1 import DocumentSnapshot
from google.protobuf.timestamp_pb2 import Timestamp as ProtoTimestamp
from pydantic import BaseModel, Field, field_validator, model_validator


# ---------------------------------------------------------------------------
# Timestamp normalisation
# ---------------------------------------------------------------------------
def firestore_ts_to_utc(value: Any) -> str | None:
    """
    Converts a Firestore timestamp (multiple possible types) to an
    ISO-8601 UTC string.  Returns None for missing / unparseable values.

    Handles:
      - google.cloud.firestore_v1.transforms.Sentinel  → None
      - google.protobuf.timestamp_pb2.Timestamp
      - datetime (tz-aware or naive)
      - dict with {"_seconds": ..., "_nanoseconds": ...}
      - ISO-8601 string pass-through
      - int / float epoch seconds
    """
    if value is None:
        return None

    try:
        if isinstance(value, datetime):
            if value.tzinfo is None:
                value = value.replace(tzinfo=timezone.utc)
            return value.astimezone(timezone.utc).isoformat()

        if isinstance(value, ProtoTimestamp):
            dt = value.ToDatetime().replace(tzinfo=timezone.utc)
            return dt.isoformat()

        if isinstance(value, dict):
            seconds = value.get("_seconds") or value.get("seconds", 0)
            return datetime.fromtimestamp(int(seconds), tz=timezone.utc).isoformat()

        if isinstance(value, (int, float)):
            return datetime.fromtimestamp(value, tz=timezone.utc).isoformat()

        if isinstance(value, str):
            # Validate it's parseable, then return as-is
            datetime.fromisoformat(value.replace("Z", "+00:00"))
            return value

    except Exception:
        return None

    return None


def firestore_uid_to_uuid(uid: str) -> uuid.UUID:
    """
    Deterministic mapping: Firestore UID (28-char base64-ish string) →
    UUID v5 in a project-specific namespace.  Using UUID v5 means
    re-running the migration for the same UID produces the same UUID.
    """
    _NAMESPACE = uuid.UUID("a1b2c3d4-e5f6-7890-abcd-ef1234567890")
    return uuid.uuid5(_NAMESPACE, uid)


# ---------------------------------------------------------------------------
# Safe field extractor
# ---------------------------------------------------------------------------
def safe_get(doc: dict[str, Any], *keys: str, default: Any = None) -> Any:
    """
    Nested dict traversal with a safe default.
    safe_get(doc, "metrics", "audio", "wpm", default=0.0)
    """
    current = doc
    for key in keys:
        if isinstance(current, dict):
            current = current.get(key)
        else:
            return default
        if current is None:
            return default
    return current


def safe_float(value: Any, default: float = 0.0) -> float:
    try:
        return float(value)
    except (TypeError, ValueError):
        return default


def safe_int(value: Any, default: int = 0) -> int:
    try:
        return int(value)
    except (TypeError, ValueError):
        return default


# ---------------------------------------------------------------------------
# Pydantic v2 migration payload models
# ---------------------------------------------------------------------------
class MigratedUser(BaseModel):
    """One Firestore user document → PostgreSQL users row."""
    id: uuid.UUID
    firestore_uid: str                       # original UID for audit trail
    email: str
    full_name: str = ""
    hashed_password: str = ""                # stub – users must reset password
    created_at: str | None = None
    updated_at: str | None = None

    @field_validator("email", mode="before")
    @classmethod
    def _normalise_email(cls, v: Any) -> str:
        if not v or not isinstance(v, str):
            raise ValueError("email is required")
        return v.strip().lower()

    @field_validator("full_name", mode="before")
    @classmethod
    def _default_name(cls, v: Any) -> str:
        return str(v).strip() if v else ""


class MigratedAudioMetrics(BaseModel):
    wpm: float = 0.0
    filler_word_count: int = 0
    duration_seconds: float = 0.0


class MigratedVideoMetrics(BaseModel):
    dominant_emotion: str = "neutral"
    emotion_intensity: float = 0.0


class MigratedAIFeedback(BaseModel):
    clarity_score: float | None = None
    tech_depth_score: float | None = None
    communication_score: float | None = None
    detailed_feedback: str = ""
    suggested_answer_points: list[str] = Field(default_factory=list)


class MigratedQARecord(BaseModel):
    id: uuid.UUID = Field(default_factory=uuid.uuid4)
    session_id: uuid.UUID
    question: str = ""
    transcript: str = ""
    ai_feedback: MigratedAIFeedback = Field(default_factory=MigratedAIFeedback)
    audio_metrics: MigratedAudioMetrics = Field(default_factory=MigratedAudioMetrics)
    video_metrics: MigratedVideoMetrics = Field(default_factory=MigratedVideoMetrics)
    created_at: str | None = None


class MigratedSession(BaseModel):
    id: uuid.UUID = Field(default_factory=uuid.uuid4)
    interview_id: uuid.UUID
    overall_score: float | None = None
    detailed_metrics: dict[str, Any] = Field(default_factory=dict)
    qa_records: list[MigratedQARecord] = Field(default_factory=list)
    created_at: str | None = None
    updated_at: str | None = None


class MigratedInterview(BaseModel):
    id: uuid.UUID = Field(default_factory=uuid.uuid4)
    user_id: uuid.UUID
    firestore_id: str = ""                   # original Firestore doc ID
    title: str = "Imported Interview"
    job_role: str = ""
    resume_data: dict[str, Any] = Field(default_factory=dict)
    status: str = "completed"
    sessions: list[MigratedSession] = Field(default_factory=list)
    created_at: str | None = None
    updated_at: str | None = None


# ---------------------------------------------------------------------------
# Document → model mappers
# ---------------------------------------------------------------------------
def map_user_doc(doc_id: str, data: dict[str, Any]) -> MigratedUser:
    return MigratedUser(
        id=firestore_uid_to_uuid(doc_id),
        firestore_uid=doc_id,
        email=data.get("email", ""),
        full_name=data.get("displayName") or data.get("full_name", ""),
        hashed_password="$MIGRATED$",      # marker – forces password reset
        created_at=firestore_ts_to_utc(data.get("createdAt") or data.get("created_at")),
        updated_at=firestore_ts_to_utc(data.get("updatedAt") or data.get("updated_at")),
    )


def map_qa_record(rec: dict[str, Any], session_id: uuid.UUID) -> MigratedQARecord:
    metrics = rec.get("metrics") or {}
    audio_raw = metrics.get("audio") or rec.get("audio_metrics") or {}
    video_raw = metrics.get("video") or rec.get("video_metrics") or {}
    feedback_raw = rec.get("aiFeedback") or rec.get("ai_feedback") or {}

    return MigratedQARecord(
        session_id=session_id,
        question=rec.get("question", ""),
        transcript=rec.get("transcript") or rec.get("answer", ""),
        ai_feedback=MigratedAIFeedback(
            clarity_score=safe_float(feedback_raw.get("clarity") or feedback_raw.get("clarity_score"), default=None),
            tech_depth_score=safe_float(feedback_raw.get("techDepth") or feedback_raw.get("tech_depth_score"), default=None),
            communication_score=safe_float(feedback_raw.get("communication") or feedback_raw.get("communication_score"), default=None),
            detailed_feedback=feedback_raw.get("detailedFeedback") or feedback_raw.get("detailed_feedback", ""),
            suggested_answer_points=feedback_raw.get("suggestedPoints") or feedback_raw.get("suggested_answer_points", []),
        ),
        audio_metrics=MigratedAudioMetrics(
            wpm=safe_float(audio_raw.get("wpm")),
            filler_word_count=safe_int(audio_raw.get("fillerWordCount") or audio_raw.get("filler_word_count")),
            duration_seconds=safe_float(audio_raw.get("durationSeconds") or audio_raw.get("duration_seconds")),
        ),
        video_metrics=MigratedVideoMetrics(
            dominant_emotion=audio_raw.get("dominantEmotion") or video_raw.get("dominant_emotion", "neutral"),
            emotion_intensity=safe_float(video_raw.get("emotionIntensity") or video_raw.get("emotion_intensity")),
        ),
        created_at=firestore_ts_to_utc(rec.get("createdAt") or rec.get("created_at")),
    )


def map_interview_doc(
    doc_id: str,
    data: dict[str, Any],
    user_uuid: uuid.UUID,
) -> MigratedInterview:
    interview_id = uuid.uuid4()

    # Sessions may be nested or in a sub-collection (handled separately)
    raw_sessions = data.get("sessions") or []
    sessions: list[MigratedSession] = []

    for s in raw_sessions:
        session_id = uuid.uuid4()
        raw_qa = s.get("qaRecords") or s.get("qa_records") or []
        qa_records = [map_qa_record(r, session_id) for r in raw_qa]

        sessions.append(MigratedSession(
            id=session_id,
            interview_id=interview_id,
            overall_score=safe_float(s.get("overallScore") or s.get("overall_score"), default=None),
            detailed_metrics=s.get("detailedMetrics") or s.get("detailed_metrics") or {},
            qa_records=qa_records,
            created_at=firestore_ts_to_utc(s.get("createdAt") or s.get("created_at")),
            updated_at=firestore_ts_to_utc(s.get("updatedAt") or s.get("updated_at")),
        ))

    return MigratedInterview(
        id=interview_id,
        user_id=user_uuid,
        firestore_id=doc_id,
        title=data.get("title", "Imported Interview"),
        job_role=data.get("jobRole") or data.get("job_role", ""),
        resume_data=data.get("resumeData") or data.get("resume_data") or {},
        status=data.get("status", "completed"),
        sessions=sessions,
        created_at=firestore_ts_to_utc(data.get("createdAt") or data.get("created_at")),
        updated_at=firestore_ts_to_utc(data.get("updatedAt") or data.get("updated_at")),
    )
