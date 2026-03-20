import asyncio
import logging
from typing import Dict

from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from pydantic import BaseModel, ValidationError

from ...core.media.stream_processor import StreamProcessor

logger = logging.getLogger(__name__)
router = APIRouter()


class WSFrame(BaseModel):
    type: str
    data: str = ""
    metadata: Dict = {}


class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, WebSocket] = {}

    async def connect(self, session_id: str, websocket: WebSocket) -> None:
        await websocket.accept()
        self.active_connections[session_id] = websocket
        logger.info("Session %s connected. Total active: %d", session_id, len(self.active_connections))

    def disconnect(self, session_id: str) -> None:
        self.active_connections.pop(session_id, None)
        logger.info("Session %s disconnected. Total active: %d", session_id, len(self.active_connections))

    async def send(self, session_id: str, payload: dict) -> None:
        ws = self.active_connections.get(session_id)
        if ws:
            await ws.send_json(payload)

    async def send_error(self, websocket: WebSocket, detail: str) -> None:
        await websocket.send_json({"type": "error", "detail": detail})


manager = ConnectionManager()


@router.websocket("/ws/interview/{session_id}")
async def interview_websocket_endpoint(websocket: WebSocket, session_id: str):
    await manager.connect(session_id, websocket)
    processor = StreamProcessor(session_id=session_id)

    try:
        while True:
            raw = await websocket.receive_text()

            try:
                frame = WSFrame.model_validate_json(raw)
            except (ValidationError, ValueError) as exc:
                await manager.send_error(websocket, f"Malformed frame: {exc}")
                continue

            match frame.type:
                case "audio_chunk":
                    # Run voice analysis and Whisper transcription in parallel
                    voice_task = asyncio.create_task(
                        processor.handle_audio_stream(frame.data, frame.metadata)
                    )
                    transcript_task = asyncio.create_task(
                        processor.transcribe_audio(frame.data)
                    )

                    voice_result, transcript = await asyncio.gather(
                        voice_task, transcript_task
                    )

                    # 1. Emit voice analysis result
                    if voice_result is not None:
                        if "error" in voice_result:
                            await manager.send(
                                session_id,
                                {"type": "voice_analysis_error", **voice_result},
                            )
                        else:
                            await manager.send(
                                session_id,
                                {"type": "voice_analysis_result", **voice_result},
                            )

                    # 2. Emit transcript to frontend for display
                    if transcript:
                        await manager.send(
                            session_id,
                            {
                                "type": "transcript_result",
                                "transcript": transcript,
                                "session_id": session_id,
                            },
                        )

                    # 3. Persist transcript to QA record if record_id provided
                    #    (frontend sends record_id in metadata when recording
                    #    an answer to a specific question)
                    record_id = frame.metadata.get("record_id")
                    if transcript and record_id:
                        # Import here to avoid circular imports at module level
                        from ...repositories.qa_repo import QARecordRepository
                        from ...api.dependencies import _async_session
                        from uuid import UUID

                        try:
                            async with _async_session() as db:
                                qa_repo = QARecordRepository(db)
                                record = await qa_repo.get(UUID(record_id))
                                if record:
                                    # Append to existing transcript (accumulates
                                    # across multiple audio chunks for one answer)
                                    existing = record.transcript or ""
                                    separator = " " if existing else ""
                                    await qa_repo.update(
                                        db_obj=record,
                                        obj_in={
                                            "transcript": existing + separator + transcript
                                        },
                                    )
                                    await db.commit()
                        except Exception as exc:
                            logger.error(
                                "Session %s – failed to persist transcript: %s",
                                session_id,
                                exc,
                            )

                case "video_frame":
                    result = await processor.handle_video_stream(
                        frame.data, frame.metadata
                    )
                    await manager.send(
                        session_id,
                        {"type": "analysis_result", **result},
                    )

                case "heartbeat":
                    await manager.send(session_id, {"type": "heartbeat_ack"})

                case _:
                    await manager.send_error(
                        websocket, f"Unknown frame type: {frame.type!r}"
                    )

    except WebSocketDisconnect:
        manager.disconnect(session_id)
        await processor.finalize()
    except Exception as exc:
        logger.exception("Unexpected error in session %s: %s", session_id, exc)
        manager.disconnect(session_id)
        await processor.finalize()
        try:
            await websocket.close(code=1011)
        except Exception:
            pass
