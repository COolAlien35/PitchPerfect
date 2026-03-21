"""
Integration test: full interview lifecycle.
    create_interview → ws_connect → process_answer → verify telemetry
"""
from __future__ import annotations

import asyncio
import base64
import json
from uuid import UUID

import pytest
from httpx import AsyncClient
from sqlalchemy import select, text
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.interview import Interview, InterviewSession, InterviewStatus
from app.models.qa_record import QARecord


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
def _make_audio_chunk() -> str:
    """Return a minimal valid base64-encoded silent WAV (44-byte header)."""
    wav_header = bytes([
        0x52,0x49,0x46,0x46, 0x24,0x00,0x00,0x00,  # RIFF....
        0x57,0x41,0x56,0x45, 0x66,0x6D,0x74,0x20,  # WAVEfmt
        0x10,0x00,0x00,0x00, 0x01,0x00, 0x01,0x00,  # PCM mono
        0x80,0x3E,0x00,0x00, 0x00,0x7D,0x00,0x00,  # 16kHz
        0x02,0x00, 0x10,0x00,                        # 16-bit
        0x64,0x61,0x74,0x61, 0x00,0x00,0x00,0x00,  # data chunk
    ])
    return base64.b64encode(wav_header).decode()


# ---------------------------------------------------------------------------
# Step 1 – Create interview via REST
# ---------------------------------------------------------------------------
@pytest.mark.asyncio
@pytest.mark.skip(reason="Routes not yet implemented")
async def test_create_interview(client: AsyncClient, auth_headers: dict, db_session: AsyncSession):
    payload = {
        "title":           "SWE Interview – Google",
        "job_role":        "Senior Software Engineer",
        "job_description": "Design and implement scalable distributed systems.",
        "resume_text":     "5 years Python. Led migration to async microservices.",
    }
    response = await client.post(
        "/api/v1/interviews",
        json=payload,
        headers=auth_headers,
    )
    assert response.status_code == 201, response.text

    created = response.json()
    interview_id = created["id"]

    # Verify DB row exists
    result = await db_session.execute(
        select(Interview).where(Interview.id == UUID(interview_id))
    )
    interview = result.scalars().first()
    assert interview is not None
    assert interview.status == InterviewStatus.PENDING
    assert interview.resume_data == {"text": payload["resume_text"]}


# ---------------------------------------------------------------------------
# Step 2 – WebSocket connection + frame routing
# ---------------------------------------------------------------------------
@pytest.mark.asyncio
@pytest.mark.skip(reason="Routes not yet implemented")
async def test_websocket_audio_frame(client: AsyncClient, auth_headers: dict, db_session: AsyncSession):
    # First create an interview + session to get a real session_id
    interview_resp = await client.post(
        "/api/v1/interviews",
        json={
            "title": "WS Test Interview", "job_role": "ML Engineer",
            "job_description": "Build ML pipelines.", "resume_text": "PyTorch expert."
        },
        headers=auth_headers,
    )
    assert interview_resp.status_code == 201
    interview_id = interview_resp.json()["id"]

    # Retrieve the auto-created session id
    detail_resp = await client.get(f"/api/v1/interviews/{interview_id}", headers=auth_headers)
    assert detail_resp.status_code == 200
    session_id = detail_resp.json()["sessions"][0]["id"]

    async with client.websocket_connect(f"/ws/interview/{session_id}") as ws:
        # Send a heartbeat – must receive ack
        await ws.send_text(json.dumps({"type": "heartbeat", "data": "", "metadata": {}}))
        ack = json.loads(await ws.receive_text())
        assert ack.get("type") == "heartbeat_ack"

        # Send an audio chunk – no error response expected
        await ws.send_text(json.dumps({
            "type": "audio_chunk",
            "data": _make_audio_chunk(),
            "metadata": {"timestamp_ms": 1000},
        }))

        # Short wait to allow background task to run
        await asyncio.sleep(0.1)

        # Send a malformed frame – must receive structured error
        await ws.send_text("NOT_VALID_JSON")
        error_msg = json.loads(await ws.receive_text())
        assert error_msg.get("type") == "error"
        assert "Malformed frame" in error_msg.get("detail", "")


# ---------------------------------------------------------------------------
# Step 3 – Process answer + verify JSONB telemetry update
# ---------------------------------------------------------------------------
@pytest.mark.asyncio
@pytest.mark.skip(reason="Routes not yet implemented")
async def test_process_answer_updates_telemetry(
    client: AsyncClient, auth_headers: dict, db_session: AsyncSession
):
    # Bootstrap interview
    iv_resp = await client.post(
        "/api/v1/interviews",
        json={
            "title": "Telemetry Test", "job_role": "Backend Engineer",
            "job_description": "Build APIs.", "resume_text": "FastAPI, PostgreSQL.",
        },
        headers=auth_headers,
    )
    assert iv_resp.status_code == 201
    interview_id = iv_resp.json()["id"]
    detail = (await client.get(f"/api/v1/interviews/{interview_id}", headers=auth_headers)).json()
    session_id = detail["sessions"][0]["id"]
    record_id  = detail["sessions"][0]["qa_records"][0]["id"]

    # Submit answer
    answer_resp = await client.post(
        f"/api/v1/sessions/{session_id}/answer",
        json={"record_id": record_id, "transcript": "Async in Python uses the event loop."},
        headers=auth_headers,
    )
    assert answer_resp.status_code == 200
    feedback = answer_resp.json()

    # Verify JSONB fields were persisted
    result = await db_session.execute(
        select(QARecord).where(QARecord.id == UUID(record_id))
    )
    record = result.scalars().first()
    assert record is not None
    assert record.transcript == "Async in Python uses the event loop."
    assert record.ai_feedback is not None
    assert "clarity_score" in record.ai_feedback
    assert 1 <= record.ai_feedback["clarity_score"] <= 10

    # Verify session overall_score was updated
    session_result = await db_session.execute(
        select(InterviewSession).where(InterviewSession.id == UUID(session_id))
    )
    session_obj = session_result.scalars().first()
    assert session_obj is not None
    assert session_obj.overall_score is not None
    assert 0 < float(session_obj.overall_score) <= 100


# ---------------------------------------------------------------------------
# Step 4 – Generate session report
# ---------------------------------------------------------------------------
@pytest.mark.asyncio
@pytest.mark.skip(reason="Routes not yet implemented")
async def test_generate_session_report(client: AsyncClient, auth_headers: dict):
    iv_resp = await client.post(
        "/api/v1/interviews",
        json={
            "title": "Report Test", "job_role": "Data Scientist",
            "job_description": "ML models at scale.", "resume_text": "Python, Scikit-Learn.",
        },
        headers=auth_headers,
    )
    interview_id = iv_resp.json()["id"]
    detail = (await client.get(f"/api/v1/interviews/{interview_id}", headers=auth_headers)).json()
    session_id = detail["sessions"][0]["id"]

    report_resp = await client.get(
        f"/api/v1/sessions/{session_id}/report",
        headers=auth_headers,
    )
    assert report_resp.status_code == 200
    report = report_resp.json()

    assert "skill_breakdown" in report
    breakdown = report["skill_breakdown"]
    assert all(k in breakdown for k in ("communication", "engagement", "substance", "overall"))
    assert all(0.0 <= breakdown[k] <= 100.0 for k in breakdown)
