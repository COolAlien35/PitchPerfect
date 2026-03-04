from __future__ import annotations

import asyncio
import hashlib
import io
import logging
import os
from datetime import datetime, timezone
from pathlib import Path
from typing import Any
from uuid import UUID

import aioboto3
from celery import Task
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm
from reportlab.platypus import (
    HRFlowable,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)

from app.infrastructure.worker import celery_app, exponential_retry_policy
from app.infrastructure.redis_manager import redis_manager
from app.core.analytics.processor import AnalyticsProcessor
from app.core.analytics.schemas import SessionReport, SkillBreakdown, QAMetricSummary

logger = logging.getLogger("pitchperfect.tasks.reporting")

# ---------------------------------------------------------------------------
# Storage config
# ---------------------------------------------------------------------------
STORAGE_BACKEND   = os.getenv("STORAGE_BACKEND", "local")   # "local" | "s3"
LOCAL_REPORT_DIR  = Path(os.getenv("LOCAL_REPORT_DIR", "/tmp/pitchperfect/reports"))
S3_BUCKET         = os.getenv("S3_BUCKET", "pitchperfect-reports")
S3_ENDPOINT       = os.getenv("S3_ENDPOINT_URL", "")         # MinIO or AWS

# Idempotency key prefix in Redis
_REPORT_LOCK_PREFIX = "pitchperfect:report:lock:"
_REPORT_TTL         = 86_400  # 24 h

# ---------------------------------------------------------------------------
# DB session factory (sync-compatible for Celery workers)
# ---------------------------------------------------------------------------
from sqlalchemy import create_engine, select, update
from sqlalchemy.orm import sessionmaker, Session

_SYNC_DB_URL = os.getenv("SYNC_DATABASE_URL", "")   # postgresql+psycopg2://...

def _get_sync_session() -> Session:
    engine = create_engine(_SYNC_DB_URL, pool_pre_ping=True)
    factory = sessionmaker(bind=engine, autoflush=False, autocommit=False)
    return factory()


# ---------------------------------------------------------------------------
# PDF builder
# ---------------------------------------------------------------------------
def _build_pdf(report: SessionReport) -> bytes:
    """
    Renders a ReportLab PDF from a SessionReport.
    Returns raw bytes suitable for storage upload.
    """
    buffer = io.BytesIO()
    styles = getSampleStyleSheet()

    title_style = ParagraphStyle(
        "PitchTitle",
        parent=styles["Title"],
        fontSize=20,
        textColor=colors.HexColor("#1a1a2e"),
        spaceAfter=12,
    )
    h2_style = ParagraphStyle(
        "H2",
        parent=styles["Heading2"],
        fontSize=13,
        textColor=colors.HexColor("#16213e"),
        spaceAfter=6,
    )
    body_style = styles["BodyText"]

    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        rightMargin=2 * cm,
        leftMargin=2 * cm,
        topMargin=2 * cm,
        bottomMargin=2 * cm,
        title=f"Interview Report – Session {report.session_id[:8]}",
    )

    elements: list[Any] = []

    # Header
    elements.append(Paragraph("PitchPerfect – Interview Analysis Report", title_style))
    elements.append(Paragraph(
        f"Session ID: <b>{report.session_id}</b> &nbsp;|&nbsp; "
        f"Generated: <b>{datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M UTC')}</b>",
        body_style,
    ))
    elements.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor("#e0e0e0")))
    elements.append(Spacer(1, 0.5 * cm))

    # Overall scores
    elements.append(Paragraph("Skill Breakdown", h2_style))
    sb = report.skill_breakdown
    score_data = [
        ["Dimension", "Score (0–100)"],
        ["Communication",  f"{sb.communication:.1f}"],
        ["Engagement",     f"{sb.engagement:.1f}"],
        ["Substance",      f"{sb.substance:.1f}"],
        ["Overall",        f"{sb.overall:.1f}"],
    ]
    score_table = Table(score_data, colWidths=[10 * cm, 5 * cm])
    score_table.setStyle(TableStyle([
        ("BACKGROUND",    (0, 0), (-1, 0), colors.HexColor("#1a1a2e")),
        ("TEXTCOLOR",     (0, 0), (-1, 0), colors.white),
        ("FONTNAME",      (0, 0), (-1, 0), "Helvetica-Bold"),
        ("ROWBACKGROUNDS",(0, 1), (-1, -1), [colors.white, colors.HexColor("#f5f5f5")]),
        ("GRID",          (0, 0), (-1, -1), 0.5, colors.HexColor("#cccccc")),
        ("FONTNAME",      (0, -1), (-1, -1), "Helvetica-Bold"),
        ("TEXTCOLOR",     (1, -1), (1, -1), colors.HexColor("#0066cc")),
        ("LEFTPADDING",   (0, 0), (-1, -1), 8),
        ("RIGHTPADDING",  (0, 0), (-1, -1), 8),
        ("TOPPADDING",    (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
    ]))
    elements.append(score_table)
    elements.append(Spacer(1, 0.8 * cm))

    # Per-question breakdown
    elements.append(Paragraph("Question-by-Question Analysis", h2_style))

    for idx, qa in enumerate(report.qa_summaries, start=1):
        elements.append(Paragraph(f"Q{idx}: {qa.question}", body_style))
        fb = qa.ai_feedback or {}
        if fb:
            elements.append(Paragraph(
                f"&nbsp;&nbsp;Clarity: <b>{fb.get('clarity_score', 'N/A')}/10</b> &nbsp;|&nbsp; "
                f"Tech Depth: <b>{fb.get('tech_depth_score', 'N/A')}/10</b> &nbsp;|&nbsp; "
                f"Communication: <b>{fb.get('communication_score', 'N/A')}/10</b>",
                body_style,
            ))
            if fb.get("detailed_feedback"):
                elements.append(Paragraph(
                    f"&nbsp;&nbsp;<i>Feedback:</i> {fb['detailed_feedback']}", body_style
                ))
        elements.append(Spacer(1, 0.3 * cm))

    doc.build(elements)
    buffer.seek(0)
    return buffer.read()


# ---------------------------------------------------------------------------
# Storage helpers
# ---------------------------------------------------------------------------
async def _upload_local(session_id: str, pdf_bytes: bytes) -> str:
    LOCAL_REPORT_DIR.mkdir(parents=True, exist_ok=True)
    path = LOCAL_REPORT_DIR / f"report_{session_id}.pdf"
    path.write_bytes(pdf_bytes)
    return f"file://{path}"


async def _upload_s3(session_id: str, pdf_bytes: bytes) -> str:
    key = f"reports/{session_id}/report.pdf"
    async with aioboto3.Session().client(
        "s3",
        endpoint_url=S3_ENDPOINT or None,
    ) as s3:
        await s3.put_object(
            Bucket=S3_BUCKET,
            Key=key,
            Body=pdf_bytes,
            ContentType="application/pdf",
            ServerSideEncryption="AES256",
        )
    region = os.getenv("AWS_DEFAULT_REGION", "us-east-1")
    if S3_ENDPOINT:
        return f"{S3_ENDPOINT}/{S3_BUCKET}/{key}"
    return f"https://{S3_BUCKET}.s3.{region}.amazonaws.com/{key}"


async def _store_report(session_id: str, pdf_bytes: bytes) -> str:
    if STORAGE_BACKEND == "s3":
        return await _upload_s3(session_id, pdf_bytes)
    return await _upload_local(session_id, pdf_bytes)


# ---------------------------------------------------------------------------
# Celery task
# ---------------------------------------------------------------------------
@celery_app.task(
    name="app.core.tasks.reporting.generate_interview_report",
    bind=True,
    **exponential_retry_policy(max_retries=5, base_delay=4, max_delay=600),
    queue="reporting",
)
def generate_interview_report(self: Task, session_id: str) -> dict[str, Any]:
    """
    Idempotent task: generates a PDF report for a completed InterviewSession.

    Idempotency:
        A Redis key ``pitchperfect:report:lock:<session_id>`` is set as a NX
        (set-if-not-exists) lock before any work begins.  Subsequent calls for
        the same session_id return the cached result immediately.

    Returns:
        {"session_id": ..., "report_url": ..., "status": "completed"}
    """
    lock_key = f"{_REPORT_LOCK_PREFIX}{session_id}"

    # ---- Run async logic inside Celery's synchronous worker via asyncio.run ----
    return asyncio.get_event_loop().run_until_complete(
        _generate_report_async(self, session_id, lock_key)
    )


async def _generate_report_async(
    task: Task,
    session_id: str,
    lock_key: str,
) -> dict[str, Any]:
    from app.models.interview import InterviewSession
    from app.models.qa_record import QARecord

    # ----------------------------------------------------------------
    # 1. Idempotency check
    # ----------------------------------------------------------------
    await redis_manager.connect()
    existing_url = await redis_manager.client.get(lock_key)
    if existing_url:
        logger.info("Report already exists for session %s — returning cached URL", session_id)
        return {"session_id": session_id, "report_url": existing_url, "status": "completed"}

    logger.info("Generating report for session %s …", session_id)

    try:
        # ----------------------------------------------------------------
        # 2. Fetch data from DB (sync session in worker context)
        # ----------------------------------------------------------------
        with _get_sync_session() as db:
            session_row = db.execute(
                select(InterviewSession).where(InterviewSession.id == UUID(session_id))
            ).scalars().first()

            if not session_row:
                raise ValueError(f"InterviewSession {session_id} not found")

            qa_rows = db.execute(
                select(QARecord).where(QARecord.session_id == UUID(session_id))
            ).scalars().all()

        # ----------------------------------------------------------------
        # 3. Compute analytics scores
        # ----------------------------------------------------------------
        processor = AnalyticsProcessor()
        raw_records = [
            {
                "ai_feedback":   r.ai_feedback   or {},
                "audio_metrics": r.audio_metrics  or {},
                "video_metrics": r.video_metrics  or {},
            }
            for r in qa_rows
        ]
        scores = processor.score_session(raw_records)

        skill_breakdown = SkillBreakdown(
            communication=scores["communication"],
            engagement=scores["engagement"],
            substance=scores["substance"],
            overall=scores["overall"],
        )

        qa_summaries = [
            QAMetricSummary(
                record_id         = str(r.id),
                question          = r.question,
                clarity_score     = (r.ai_feedback or {}).get("clarity_score"),
                tech_depth_score  = (r.ai_feedback or {}).get("tech_depth_score"),
                communication_score=(r.ai_feedback or {}).get("communication_score"),
                wpm               = (r.audio_metrics or {}).get("wpm"),
                filler_word_count = (r.audio_metrics or {}).get("filler_word_count"),
                dominant_emotion  = (r.video_metrics or {}).get("dominant_emotion"),
                emotion_intensity = (r.video_metrics or {}).get("emotion_intensity"),
                ai_feedback       = r.ai_feedback,
            )
            for r in qa_rows
        ]

        report = SessionReport(
            session_id        = session_id,
            interview_id      = str(session_row.interview_id),
            skill_breakdown   = skill_breakdown,
            qa_summaries      = qa_summaries,
            total_questions   = len(qa_rows),
            answered_questions= sum(1 for r in qa_rows if r.transcript),
        )

        # ----------------------------------------------------------------
        # 4. Render PDF
        # ----------------------------------------------------------------
        pdf_bytes = _build_pdf(report)

        # ----------------------------------------------------------------
        # 5. Upload
        # ----------------------------------------------------------------
        report_url = await _store_report(session_id, pdf_bytes)

        # ----------------------------------------------------------------
        # 6. Persist report URL + mark session completed (sync write)
        # ----------------------------------------------------------------
        with _get_sync_session() as db:
            db.execute(
                update(InterviewSession)
                .where(InterviewSession.id == UUID(session_id))
                .values(
                    detailed_metrics={
                        **(session_row.detailed_metrics or {}),
                        "report_url": report_url,
                        "scores":     scores,
                    },
                    overall_score=scores["overall"],
                )
            )
            db.commit()

        # ----------------------------------------------------------------
        # 7. Stamp idempotency lock in Redis (24 h TTL)
        # ----------------------------------------------------------------
        await redis_manager.client.set(lock_key, report_url, ex=_REPORT_TTL)

        # ----------------------------------------------------------------
        # 8. Notify frontend via Pub/Sub
        # ----------------------------------------------------------------
        await redis_manager.broadcast_to_socket(
            session_id,
            "report_ready",
            {"report_url": report_url, "scores": scores},
        )

        logger.info("Report ready for session %s: %s", session_id, report_url)
        return {"session_id": session_id, "report_url": report_url, "status": "completed"}

    except Exception as exc:
        logger.exception("Report generation failed for session %s: %s", session_id, exc)
        raise task.retry(exc=exc)
