import enum
from typing import TYPE_CHECKING, List, Optional
from uuid import UUID, uuid4

from sqlalchemy import Enum, ForeignKey, Numeric, String, Uuid
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base import Base, TimestampMixin

if TYPE_CHECKING:
    from .qa_record import QARecord
    from .user import User


class InterviewStatus(str, enum.Enum):
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    FAILED = "failed"


class Interview(Base, TimestampMixin):
    __tablename__ = "interviews"

    id: Mapped[UUID] = mapped_column(Uuid, primary_key=True, default=uuid4)
    user_id: Mapped[UUID] = mapped_column(
        Uuid, ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    job_role: Mapped[str] = mapped_column(String(255), nullable=False)
    resume_data: Mapped[Optional[dict]] = mapped_column(JSONB, nullable=True)
    status: Mapped[InterviewStatus] = mapped_column(
        Enum(InterviewStatus), default=InterviewStatus.PENDING, nullable=False
    )

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="interviews")
    sessions: Mapped[List["InterviewSession"]] = relationship(
        "InterviewSession",
        back_populates="interview",
        lazy="selectin",
        cascade="all, delete-orphan",
    )


class InterviewSession(Base, TimestampMixin):
    __tablename__ = "interview_sessions"

    id: Mapped[UUID] = mapped_column(Uuid, primary_key=True, default=uuid4)
    interview_id: Mapped[UUID] = mapped_column(
        Uuid, ForeignKey("interviews.id", ondelete="CASCADE"), nullable=False
    )
    overall_score: Mapped[Optional[float]] = mapped_column(
        Numeric(precision=5, scale=2), nullable=True
    )
    detailed_metrics: Mapped[Optional[dict]] = mapped_column(JSONB, nullable=True)

    # Relationships
    interview: Mapped["Interview"] = relationship("Interview", back_populates="sessions")
    qa_records: Mapped[List["QARecord"]] = relationship(
        "QARecord",
        back_populates="session",
        lazy="selectin",
        cascade="all, delete-orphan",
    )
