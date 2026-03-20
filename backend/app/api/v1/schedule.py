"""Schedule endpoints — CRUD for scheduled interview sessions."""
from __future__ import annotations

import logging
from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field

from ...models.schedule import ScheduledSession
from ...repositories.schedule_repo import ScheduleRepository
from ..dependencies import CurrentUser, DB

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/v1/schedule", tags=["Schedule"])


# ---------------------------------------------------------------------------
# Schemas — match frontend ScheduledSession interface
# ---------------------------------------------------------------------------
class ScheduleCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    type: str
    date: str               # "YYYY-MM-DD"
    time: str               # "HH:MM"
    duration: int = 30
    description: Optional[str] = None
    location: str = "online"
    participants: int = 1
    reminder: bool = True


class ScheduleResponse(BaseModel):
    id: str
    title: str
    type: str
    date: str
    time: str
    duration: int
    description: Optional[str] = None
    location: str
    participants: int
    reminder: bool
    status: str
    createdAt: str


class ScheduleListResponse(BaseModel):
    sessions: List[ScheduleResponse]


def _to_response(s: ScheduledSession) -> ScheduleResponse:
    return ScheduleResponse(
        id=str(s.id),
        title=s.title,
        type=s.type,
        date=s.date,
        time=s.time,
        duration=s.duration,
        description=s.description,
        location=s.location,
        participants=s.participants,
        reminder=s.reminder,
        status=s.status,
        createdAt=s.created_at.isoformat() if s.created_at else "",
    )


# ---------------------------------------------------------------------------
# GET /api/v1/schedule
# ---------------------------------------------------------------------------
@router.get("", response_model=ScheduleListResponse)
async def list_schedule(current_user: CurrentUser, db: DB) -> ScheduleListResponse:
    repo = ScheduleRepository(db)
    sessions = await repo.get_by_user_id(user_id=current_user.id)
    return ScheduleListResponse(sessions=[_to_response(s) for s in sessions])


# ---------------------------------------------------------------------------
# POST /api/v1/schedule
# ---------------------------------------------------------------------------
@router.post("", response_model=ScheduleResponse, status_code=status.HTTP_201_CREATED)
async def create_schedule(
    body: ScheduleCreate,
    current_user: CurrentUser,
    db: DB,
) -> ScheduleResponse:
    repo = ScheduleRepository(db)
    session = await repo.create(obj_in={
        "user_id": current_user.id,
        "title": body.title,
        "type": body.type,
        "date": body.date,
        "time": body.time,
        "duration": body.duration,
        "description": body.description,
        "location": body.location,
        "participants": body.participants,
        "reminder": body.reminder,
        "status": "scheduled",
    })
    await db.commit()
    await db.refresh(session)

    logger.info("Schedule created for user %s: %s", current_user.id, session.id)
    return _to_response(session)


# ---------------------------------------------------------------------------
# DELETE /api/v1/schedule/{id}
# ---------------------------------------------------------------------------
@router.delete("/{session_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_schedule(
    session_id: UUID,
    current_user: CurrentUser,
    db: DB,
) -> None:
    repo = ScheduleRepository(db)
    session = await repo.get(session_id)

    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    if session.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this session")

    await repo.delete(id=session_id)
    await db.commit()

    logger.info("Schedule deleted for user %s: %s", current_user.id, session_id)
