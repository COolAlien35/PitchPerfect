"""Analytics session endpoints."""
from __future__ import annotations

import logging
from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from ..dependencies import CurrentUser, DB

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/v1/analytics", tags=["Analytics"])


# ---------------------------------------------------------------------------
# Schemas — match frontend SessionData exactly
# ---------------------------------------------------------------------------
class SessionData(BaseModel):
    id: str
    type: str                   # "Behavioral Interview", "Technical Interview", etc.
    score: float
    date: str                   # ISO 8601
    duration: str               # "15 min", "30 min", etc.
    category: str               # "behavioral", "technical", "pressure", "group", "challenge"


class SessionCreate(BaseModel):
    type: str
    score: float = Field(ge=0, le=10)
    date: str
    duration: str
    category: str


class SessionListResponse(BaseModel):
    sessions: List[SessionData]


# ---------------------------------------------------------------------------
# GET /api/v1/analytics/sessions
# ---------------------------------------------------------------------------
@router.get("/sessions", response_model=SessionListResponse)
async def list_sessions(current_user: CurrentUser, db: DB) -> SessionListResponse:
    """
    Return all interview sessions for the current user in the shape
    the analytics frontend expects.

    Joins interviews → interview_sessions to build the flat SessionData list.
    Also includes any lightweight sessions stored in the user's profile_data
    (saved by the analysis page before the full interview pipeline existed).
    """
    # 1. Fetch sessions from the interview pipeline tables
    sql = text("""
        SELECT
            CAST(s.id AS TEXT)                      AS id,
            i.title                                 AS type,
            COALESCE(s.overall_score, 0)            AS score,
            COALESCE(CAST(s.created_at AS TEXT), '') AS date,
            '30 min'                                AS duration,
            CASE
                WHEN LOWER(i.title) LIKE '%technical%' THEN 'technical'
                WHEN LOWER(i.title) LIKE '%pressure%'  THEN 'pressure'
                WHEN LOWER(i.title) LIKE '%group%'     THEN 'group'
                WHEN LOWER(i.title) LIKE '%challenge%' THEN 'challenge'
                ELSE 'behavioral'
            END                                     AS category
        FROM interviews i
        JOIN interview_sessions s ON s.interview_id = i.id
        WHERE i.user_id = :user_id
        ORDER BY s.created_at DESC
    """)

    result = await db.execute(sql, {"user_id": str(current_user.id)})
    rows = [dict(r) for r in result.mappings().all()]

    # 2. Also load any lightweight sessions saved directly in profile_data
    pd = current_user.profile_data or {}
    saved_sessions: list = pd.get("saved_sessions", [])

    all_sessions = [SessionData(**r) for r in rows]

    for ss in saved_sessions:
        try:
            all_sessions.append(SessionData(**ss))
        except Exception:
            continue  # skip malformed entries

    # Sort by date descending
    all_sessions.sort(key=lambda s: s.date, reverse=True)

    return SessionListResponse(sessions=all_sessions)


# ---------------------------------------------------------------------------
# POST /api/v1/analytics/sessions
# ---------------------------------------------------------------------------
@router.post(
    "/sessions",
    response_model=SessionData,
    status_code=status.HTTP_201_CREATED,
)
async def save_session(
    body: SessionCreate,
    current_user: CurrentUser,
    db: DB,
) -> SessionData:
    """
    Save a completed interview session's lightweight summary.

    The analysis page calls this after computing scores. We persist it inside
    the user's profile_data.saved_sessions[] so it shows up in analytics
    even if the full interview pipeline wasn't used.
    """
    from uuid import uuid4

    session_id = str(uuid4())

    session_record = {
        "id": session_id,
        "type": body.type,
        "score": body.score,
        "date": body.date,
        "duration": body.duration,
        "category": body.category,
    }

    # Append to profile_data.saved_sessions
    from ...repositories.user_repo import UserRepository

    repo = UserRepository(db)
    pd = dict(current_user.profile_data or {})
    saved: list = pd.get("saved_sessions", [])
    saved.append(session_record)
    pd["saved_sessions"] = saved

    await repo.update(db_obj=current_user, obj_in={"profile_data": pd})
    await db.commit()

    logger.info("Session saved for user %s: %s", current_user.id, session_id)
    return SessionData(**session_record)
