import base64
import io
import logging
import os
from typing import Any, Dict, Optional

import httpx
import numpy as np
import soundfile as sf
from openai import AsyncOpenAI

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Microservice URLs — overridable via environment for Docker / production
# ---------------------------------------------------------------------------
FACIAL_API_URL: str = os.getenv("FACIAL_API_URL", "http://127.0.0.1:8002/analyze")
VOICE_API_URL: str = os.getenv("VOICE_API_URL", "http://127.0.0.1:8001/analyze-voice")

# Neutral emotion fallback — mirrors server.js behaviour when the facial
# analysis microservice is unreachable.
_NEUTRAL_FALLBACK: Dict[str, Any] = {
    "emotion": {
        "happy": 0,
        "sad": 0,
        "angry": 0,
        "surprised": 0,
        "neutral": 100,
        "disgusted": 0,
        "fearful": 0,
    },
    "dominant_emotion": "neutral",
}

# Lazy-init OpenAI client (only created when OPENAI_API_KEY is set)
_openai_client: Optional[AsyncOpenAI] = None


def _get_openai_client() -> Optional[AsyncOpenAI]:
    global _openai_client
    if _openai_client is None:
        api_key = os.getenv("OPENAI_API_KEY")
        if api_key:
            _openai_client = AsyncOpenAI(api_key=api_key)
        else:
            logger.warning("OPENAI_API_KEY not set — Whisper transcription disabled")
    return _openai_client


class StreamProcessor:
    """
    Stateful per-session processor.  Decodes media frames, forwards them to
    the facial / voice analysis microservices via httpx, runs Whisper STT,
    and returns results so the WebSocket handler can relay them to the client.
    """

    def __init__(self, session_id: str):
        self.session_id = session_id
        self._facial_api_warned = False

        # Shared async HTTP client — connection-pooled per processor
        self._http: httpx.AsyncClient = httpx.AsyncClient(timeout=5.0)

    # ------------------------------------------------------------------
    # Video
    # ------------------------------------------------------------------
    async def handle_video_stream(
        self, frame_base64: str, metadata: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        POST the raw base64 image to the facial analysis microservice and
        return the emotion result dict.  Falls back to a neutral result if
        the service is unavailable (matching the old server.js behaviour).
        """
        try:
            response = await self._http.post(
                FACIAL_API_URL,
                json={"image": frame_base64},
            )
            response.raise_for_status()
            return response.json()
        except Exception as exc:
            if not self._facial_api_warned:
                logger.warning(
                    "Session %s – facial analysis service unavailable (%s). "
                    "Returning neutral fallback.",
                    self.session_id,
                    exc,
                )
                self._facial_api_warned = True
            return dict(_NEUTRAL_FALLBACK)  # shallow copy

    # ------------------------------------------------------------------
    # Audio — voice analysis (forwarded to microservice)
    # ------------------------------------------------------------------
    async def handle_audio_stream(
        self, audio_base64: str, metadata: Dict[str, Any]
    ) -> Optional[Dict[str, Any]]:
        """
        POST the audio chunk as multipart form-data to the voice analysis
        microservice.  Returns the voice-metrics dict on success, or an
        error dict on failure.
        """
        try:
            audio_bytes = base64.b64decode(audio_base64)
            files = {"file": ("audio.wav", io.BytesIO(audio_bytes), "audio/wav")}
            response = await self._http.post(VOICE_API_URL, files=files)
            response.raise_for_status()
            return response.json()
        except Exception as exc:
            logger.error(
                "Session %s – voice analysis error: %s",
                self.session_id,
                exc,
            )
            return {"error": "Failed to analyze audio."}

    # ------------------------------------------------------------------
    # Audio — Whisper speech-to-text
    # ------------------------------------------------------------------
    async def transcribe_audio(self, audio_base64: str) -> str:
        """
        Decode base64 audio, convert to WAV in memory, and send to OpenAI
        Whisper API for transcription.

        Returns the transcript string, or empty string on failure (never
        crashes the session).
        """
        client = _get_openai_client()
        if client is None:
            return ""

        try:
            # Decode base64 → raw audio bytes
            raw_bytes = base64.b64decode(audio_base64)

            # Read into numpy via soundfile (handles WAV/FLAC/OGG etc.)
            # then re-write as 16kHz mono WAV for Whisper
            data, samplerate = sf.read(io.BytesIO(raw_bytes))

            # Ensure mono
            if data.ndim > 1:
                data = data.mean(axis=1)

            # Write normalised WAV to in-memory buffer
            wav_buffer = io.BytesIO()
            sf.write(wav_buffer, data, samplerate=16000, format="WAV", subtype="PCM_16")
            wav_buffer.seek(0)
            wav_buffer.name = "audio.wav"  # OpenAI requires a .name attribute

            transcript = await client.audio.transcriptions.create(
                model="whisper-1",
                file=wav_buffer,
                response_format="text",
            )

            logger.debug(
                "Session %s – Whisper transcript (%d chars): %.80s…",
                self.session_id,
                len(transcript),
                transcript,
            )
            return transcript.strip()

        except Exception as exc:
            logger.warning(
                "Session %s – Whisper transcription failed: %s",
                self.session_id,
                exc,
            )
            return ""

    # ------------------------------------------------------------------
    # Lifecycle
    # ------------------------------------------------------------------
    async def finalize(self) -> None:
        """Clean up the HTTP client on disconnect."""
        self._running = False
        await self._http.aclose()
