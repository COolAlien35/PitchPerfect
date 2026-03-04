import asyncio
import base64
import io
import logging
from collections import deque
from typing import Any, Deque, Dict

import cv2
import numpy as np
from pydub import AudioSegment

logger = logging.getLogger(__name__)

# Accumulate approx. 3 seconds of audio at 16kHz before transcribing
AUDIO_FLUSH_INTERVAL_SEC: float = 3.0


class StreamProcessor:
    """
    Stateful per-session processor. Accumulates audio chunks and routes
    decoded video frames to downstream AI services.
    """

    def __init__(self, session_id: str):
        self.session_id = session_id
        self._audio_buffer: Deque[bytes] = deque()
        self._flush_task: asyncio.Task | None = None
        self._running = True

        # Kick off the periodic audio flush loop
        self._flush_task = asyncio.create_task(self._audio_flush_loop())

    # ------------------------------------------------------------------
    # Audio
    # ------------------------------------------------------------------
    async def handle_audio_stream(self, audio_base64: str, metadata: Dict[str, Any]) -> None:
        """
        Decode and buffer binary audio chunks.
        Transcription is triggered by the periodic flush loop, not per-chunk,
        to minimise LLM call frequency under high-throughput conditions.
        """
        try:
            chunk_bytes = base64.b64decode(audio_base64)
            self._audio_buffer.append(chunk_bytes)
        except Exception as exc:
            logger.warning("Session %s – audio decode error: %s", self.session_id, exc)

    async def _audio_flush_loop(self) -> None:
        """
        Runs as a background task; flushes accumulated audio buffer every
        AUDIO_FLUSH_INTERVAL_SEC seconds and dispatches to the transcription service.
        """
        while self._running:
            await asyncio.sleep(AUDIO_FLUSH_INTERVAL_SEC)
            if not self._audio_buffer:
                continue

            # Drain the buffer atomically
            chunks = list(self._audio_buffer)
            self._audio_buffer.clear()

            try:
                samples = self._normalise_audio(b"".join(chunks))
                await self._dispatch_transcription(samples)
            except Exception as exc:
                logger.error("Session %s – flush error: %s", self.session_id, exc)

    @staticmethod
    def _normalise_audio(raw_bytes: bytes) -> np.ndarray:
        """
        Convert raw PCM/compressed bytes → mono 16kHz float32 numpy array.
        Normalised to [-1.0, 1.0] range expected by Whisper.
        """
        audio = AudioSegment.from_file(io.BytesIO(raw_bytes))
        audio = audio.set_frame_rate(16000).set_channels(1)

        target_dbfs = -20.0
        diff = target_dbfs - audio.dBFS
        audio = audio.apply_gain(diff)

        samples = np.array(audio.get_array_of_samples(), dtype=np.float32) / 32768.0
        return samples

    async def _dispatch_transcription(self, samples: np.ndarray) -> None:
        """
        Placeholder: hand off float32 waveform to Whisper (OpenAI or local).
        Replace with actual async transcription client call.
        """
        # e.g.: transcript = await whisper_client.atranscribe(samples)
        #        await interview_service.process_transcript(self.session_id, transcript)
        logger.debug("Session %s – dispatching %d audio samples for transcription", self.session_id, len(samples))

    # ------------------------------------------------------------------
    # Video
    # ------------------------------------------------------------------
    async def handle_video_stream(self, frame_base64: str, metadata: Dict[str, Any]) -> None:
        """
        Decode a single base64-encoded JPEG/PNG frame and route to facial
        expression analysis service.
        """
        try:
            frame = self._decode_frame(frame_base64)
            if frame is None:
                raise ValueError("cv2.imdecode returned None – invalid image data")
            await self._dispatch_facial_analysis(frame)
        except Exception as exc:
            logger.warning("Session %s – video decode error: %s", self.session_id, exc)

    @staticmethod
    def _decode_frame(frame_base64: str) -> np.ndarray | None:
        """
        Decode base64 → numpy BGR image array using zero-copy numpy frombuffer.
        Efficient on ARM64 (M1/M2) as no intermediate Python list is created.
        """
        img_bytes = base64.b64decode(frame_base64)
        nparr = np.frombuffer(img_bytes, dtype=np.uint8)
        frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        return frame

    async def _dispatch_facial_analysis(self, frame: np.ndarray) -> None:
        """
        Placeholder: pass decoded frame to emotion/gaze analysis service.
        Replace with actual async model inference call.
        """
        # e.g.: emotions = await facial_service.analyse(frame)
        #        await redis_manager.publish_feedback(self.session_id, emotions)
        logger.debug("Session %s – dispatching video frame for facial analysis (shape=%s)", self.session_id, frame.shape)

    # ------------------------------------------------------------------
    # Lifecycle
    # ------------------------------------------------------------------
    async def finalize(self) -> None:
        """
        Cancel the flush loop and drain any remaining audio on disconnect.
        """
        self._running = False
        if self._flush_task:
            self._flush_task.cancel()
            try:
                await self._flush_task
            except asyncio.CancelledError:
                pass

        # Final flush of leftover audio
        if self._audio_buffer:
            chunks = list(self._audio_buffer)
            self._audio_buffer.clear()
            try:
                samples = self._normalise_audio(b"".join(chunks))
                await self._dispatch_transcription(samples)
            except Exception as exc:
                logger.error("Session %s – final flush error: %s", self.session_id, exc)
