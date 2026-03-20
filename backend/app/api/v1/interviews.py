from __future__ import annotations

import logging
from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Path, status
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ...infrastructure.worker import celery_app
from ...middleware.auth import CurrentUser
from ...middleware.rate_limiter import RateTier, rate_limit
from ...models.interview import Interview, InterviewSession, InterviewStatus
from ...repositories.interview_repo import InterviewRepository, SessionRepository

logger = logging.getLogger("pitchperfect.api.interviews")
router = APIRouter(prefix="/api/v1/interviews", tags=["Interviews"])

# ---------------------------------------------------------------------------
# Schemas
# ---------------------------------------------------------------------------
class FinishSessionRequest(BaseModel):
    session_id: str


class TaskStatusResponse(BaseModel):
    task_id:    str
    status:     str        # PENDING | STARTED | SUCCESS | FAILURE | RETRY
    result:     dict | None = None
    ready:      bool = False


class ReportTriggerResponse(BaseModel):
    session_id: str
    task_id:    str
    message:    str = "Report generation enqueued."


# ---------------------------------------------------------------------------
# DB session dependency (imported from central dependencies module)
# ---------------------------------------------------------------------------
from ...api.dependencies import get_db

DB = Annotated[AsyncSession, Depends(get_db)]


# ---------------------------------------------------------------------------
# POST /api/v1/interviews/{interview_id}/finish
# Marks the interview as completed and enqueues the PDF report task.
# ---------------------------------------------------------------------------
@router.post(
    "/{interview_id}/finish",
    response_model=ReportTriggerResponse,
    status_code=status.HTTP_202_ACCEPTED,
    dependencies=[Depends(rate_limit(RateTier.USER))],
    summary="Finish an interview and enqueue the report generation task.",
)
async def finish_interview(
    interview_id: Annotated[str, Path(description="UUID of the interview to finalise")],
    body: FinishSessionRequest,
    current_user: CurrentUser,
    db: DB,
) -> ReportTriggerResponse:
    interview_repo = InterviewRepository(db)
    session_repo   = SessionRepository(db)

    # ---- Ownership check ----
    interview = await interview_repo.get(UUID(interview_id))
    if not interview or str(interview.user_id) != current_user.sub:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Interview not found.")

    if interview.status == InterviewStatus.COMPLETED:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={"code": "ALREADY_COMPLETED", "message": "Interview is already completed."},
        )

    # ---- Mark interview + session as completed ----
    await interview_repo.update(db_obj=interview, obj_in={"status": InterviewStatus.COMPLETED})

    session = await session_repo.get(UUID(body.session_id))
    if not session or str(session.interview_id) != interview_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found.")

    await db.commit()

    # ---- Enqueue report task (idempotent via Redis NX lock inside task) ----
    task = celery_app.send_task(
        "app.core.tasks.reporting.generate_interview_report",
        args=[body.session_id],
        queue="reporting",
        task_id=f"report-{body.session_id}",  # deterministic task_id for idempotency
    )

    logger.info(
        "Report task enqueued",
        extra={"session_id": body.session_id, "task_id": task.id, "user": current_user.sub},
    )

    return ReportTriggerResponse(session_id=body.session_id, task_id=task.id)


# ---------------------------------------------------------------------------
# GET /api/v1/interviews/tasks/{task_id}/status
# Polling endpoint for task progress (used by frontend before WS report_ready event)
# ---------------------------------------------------------------------------
@router.get(
    "/tasks/{task_id}/status",
    response_model=TaskStatusResponse,
    summary="Poll the status of a background report task.",
)
async def get_task_status(
    task_id: Annotated[str, Path(description="Celery task ID returned from /finish")],
    current_user: CurrentUser,
) -> TaskStatusResponse:
    async_result = celery_app.AsyncResult(task_id)

    result_data: dict | None = None
    if async_result.ready():
        try:
            result_data = async_result.get(timeout=1, propagate=False)
        except Exception as exc:
            result_data = {"error": str(exc)}

    return TaskStatusResponse(
        task_id=task_id,
        status=async_result.status,            # PENDING | STARTED | SUCCESS | FAILURE | RETRY
        result=result_data,
        ready=async_result.ready(),
    )


# ---------------------------------------------------------------------------
# GET /api/v1/interviews/{interview_id}/sessions/{session_id}/report-url
# Retrieve a completed report URL directly from session metadata.
# (Alternative to polling when the WS push may have been missed)
# ---------------------------------------------------------------------------
@router.get(
    "/{interview_id}/sessions/{session_id}/report-url",
    summary="Retrieve the report URL for a completed session.",
)
async def get_report_url(
    interview_id: Annotated[str, Path()],
    session_id:   Annotated[str, Path()],
    current_user: CurrentUser,
    db: DB,
) -> dict:
    interview_repo = InterviewRepository(db)
    session_repo   = SessionRepository(db)

    interview = await interview_repo.get(UUID(interview_id))
    if not interview or str(interview.user_id) != current_user.sub:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Interview not found.")

    session = await session_repo.get(UUID(session_id))
    if not session or str(session.interview_id) != interview_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found.")

    report_url = (session.detailed_metrics or {}).get("report_url")
    if not report_url:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "REPORT_NOT_READY", "message": "Report has not been generated yet."},
        )

    return {
        "session_id": session_id,
        "report_url": report_url,
        "overall_score": float(session.overall_score) if session.overall_score else None,
    }
