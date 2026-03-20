"""Unit tests for StreamProcessor (transcribe_audio, handle_video_stream, handle_audio_stream)."""
from __future__ import annotations

import base64
import io
import os
from unittest.mock import AsyncMock, MagicMock, patch

import numpy as np
import pytest

from app.core.media.stream_processor import StreamProcessor, _NEUTRAL_FALLBACK


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
def _make_base64_wav() -> str:
    """Generate a minimal valid silent WAV (16kHz mono) as base64."""
    import soundfile as sf
    buf = io.BytesIO()
    samples = np.zeros(1600, dtype=np.float32)  # 0.1s silence at 16kHz
    sf.write(buf, samples, samplerate=16000, format="WAV", subtype="PCM_16")
    buf.seek(0)
    return base64.b64encode(buf.read()).decode()


def _make_base64_audio() -> str:
    """Minimal base64 bytes (doesn't need to be a valid WAV for voice tests)."""
    return base64.b64encode(b"RIFF\x00\x00\x00\x00WAVEfmt ").decode()


# ---------------------------------------------------------------------------
# transcribe_audio
# ---------------------------------------------------------------------------
async def test_transcribe_audio_with_key():
    """With OPENAI_API_KEY set and a mocked client, transcribe_audio returns transcript."""
    processor = StreamProcessor(session_id="test-sess")

    mock_client = MagicMock()
    mock_client.audio.transcriptions.create = AsyncMock(return_value="Hello world")

    with (
        patch.dict(os.environ, {"OPENAI_API_KEY": "test-key"}),
        patch("app.core.media.stream_processor._get_openai_client", return_value=mock_client),
    ):
        result = await processor.transcribe_audio(_make_base64_wav())

    assert result == "Hello world"


async def test_transcribe_audio_without_key():
    """Without OPENAI_API_KEY, transcribe_audio returns empty string silently."""
    processor = StreamProcessor(session_id="test-sess-2")

    with (
        patch("app.core.media.stream_processor._get_openai_client", return_value=None),
    ):
        result = await processor.transcribe_audio(_make_base64_wav())

    assert result == ""


async def test_transcribe_audio_api_failure_returns_empty():
    """If Whisper API raises, transcribe_audio returns '' without crashing."""
    processor = StreamProcessor(session_id="test-sess-3")

    mock_client = MagicMock()
    mock_client.audio.transcriptions.create = AsyncMock(
        side_effect=Exception("Whisper API down")
    )

    with patch("app.core.media.stream_processor._get_openai_client", return_value=mock_client):
        result = await processor.transcribe_audio(_make_base64_wav())

    assert result == ""


# ---------------------------------------------------------------------------
# handle_video_stream
# ---------------------------------------------------------------------------
async def test_handle_video_stream_success():
    """Returns facial API JSON on success."""
    processor = StreamProcessor(session_id="video-sess")
    expected = {"dominant_emotion": "happy", "emotion": {"happy": 90, "neutral": 10}}

    mock_response = MagicMock()
    mock_response.raise_for_status = MagicMock()
    mock_response.json.return_value = expected

    with patch.object(processor._http, "post", new_callable=AsyncMock, return_value=mock_response):
        result = await processor.handle_video_stream("base64imgdata", {})

    assert result == expected


async def test_handle_video_stream_service_unavailable():
    """Falls back to neutral emotion dict when facial service is unreachable."""
    processor = StreamProcessor(session_id="video-sess-2")

    with patch.object(processor._http, "post", new_callable=AsyncMock, side_effect=Exception("Connection refused")):
        result = await processor.handle_video_stream("base64imgdata", {})

    assert result["dominant_emotion"] == "neutral"
    assert result["emotion"]["neutral"] == 100


# ---------------------------------------------------------------------------
# handle_audio_stream
# ---------------------------------------------------------------------------
async def test_handle_audio_stream_success():
    """Returns voice metrics from the voice analysis service."""
    processor = StreamProcessor(session_id="audio-sess")
    expected = {"wpm": 140, "filler_word_count": 2, "pitch": 200.5}

    mock_response = MagicMock()
    mock_response.raise_for_status = MagicMock()
    mock_response.json.return_value = expected

    with patch.object(processor._http, "post", new_callable=AsyncMock, return_value=mock_response):
        result = await processor.handle_audio_stream(_make_base64_audio(), {})

    assert result == expected


async def test_handle_audio_stream_service_unavailable():
    """Returns error dict when voice service is down."""
    processor = StreamProcessor(session_id="audio-sess-2")

    with patch.object(processor._http, "post", new_callable=AsyncMock, side_effect=Exception("Timeout")):
        result = await processor.handle_audio_stream(_make_base64_audio(), {})

    assert "error" in result
    assert result["error"] == "Failed to analyze audio."
