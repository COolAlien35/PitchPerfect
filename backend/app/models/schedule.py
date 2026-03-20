"""Scheduled interview sessions model."""
from typing import Optional
from uuid import UUID, uuid4

from sqlalchemy import Boolean, ForeignKey, Integer, String, Text, Uuid
from sqlalchemy.orm import Mapped, mapped_column

from .base import Base, TimestampMixin


class ScheduledSession(Base, TimestampMixin):
    __tablename__ = "scheduled_sessions"

    id: Mapped[UUID] = mapped_column(Uuid, primary_key=True, default=uuid4)
    user_id: Mapped[UUID] = mapped_column(
        Uuid, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    type: Mapped[str] = mapped_column(String(50), nullable=False)
    date: Mapped[str] = mapped_column(String(10), nullable=False)     # "YYYY-MM-DD"
    time: Mapped[str] = mapped_column(String(5), nullable=False)      # "HH:MM"
    duration: Mapped[int] = mapped_column(Integer, nullable=False, default=30)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    location: Mapped[str] = mapped_column(String(50), nullable=False, default="online")
    participants: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    reminder: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="scheduled")
