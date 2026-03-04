from typing import TYPE_CHECKING, Optional
from uuid import UUID, uuid4

from sqlalchemy import ForeignKey, Text, Uuid
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base import Base, TimestampMixin

if TYPE_CHECKING:
    from .interview import InterviewSession


class QARecord(Base, TimestampMixin):
    __tablename__ = "qa_records"

    id: Mapped[UUID] = mapped_column(Uuid, primary_key=True, default=uuid4)
    session_id: Mapped[UUID] = mapped_column(
        Uuid, ForeignKey("interview_sessions.id", ondelete="CASCADE"), nullable=False
    )
    question: Mapped[str] = mapped_column(Text, nullable=False)
    transcript: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    ai_feedback: Mapped[Optional[dict]] = mapped_column(JSONB, nullable=True)
    audio_metrics: Mapped[Optional[dict]] = mapped_column(JSONB, nullable=True)
    video_metrics: Mapped[Optional[dict]] = mapped_column(JSONB, nullable=True)

    # Relationships
    session: Mapped["InterviewSession"] = relationship(
        "InterviewSession", back_populates="qa_records"
    )
