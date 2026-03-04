import asyncio
import json
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
                    asyncio.create_task(
                        processor.handle_audio_stream(frame.data, frame.metadata)
                    )
                case "video_frame":
                    asyncio.create_task(
                        processor.handle_video_stream(frame.data, frame.metadata)
                    )
                case "heartbeat":
                    await manager.send(session_id, {"type": "heartbeat_ack"})
                case _:
                    await manager.send_error(websocket, f"Unknown frame type: {frame.type!r}")

    except WebSocketDisconnect:
        manager.disconnect(session_id)
        await processor.finalize()
    except Exception as exc:
        logger.exception("Unexpected error in session %s: %s", session_id, exc)
        manager.disconnect(session_id)
        try:
            await websocket.close(code=1011)
        except Exception:
            pass
