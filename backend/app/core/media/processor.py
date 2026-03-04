import base64
import io
import numpy as np
import cv2
from pydub import AudioSegment
from typing import Dict, Any

from ..interview.service import InterviewService


class MediaProcessor:
    def __init__(self, interview_service: InterviewService = None):
        self.interview_service = interview_service

    async def process_audio_chunk(self, session_id: str, audio_base64: str):
        """
        Normalize audio chunk and prepare for Whisper transcription.
        Optimized for ARM64 using numpy and pydub.
        """
        try:
            # Decode base64 audio
            audio_bytes = base64.b64decode(audio_base64)
            
            # Load into pydub for normalization and conversion
            audio = AudioSegment.from_file(io.BytesIO(audio_bytes))
            
            # Normalize audio (Gain adjust to target dBFS)
            target_dbfs = -20.0
            change_in_dbfs = target_dbfs - audio.dbfs
            audio = audio.apply_gain(change_in_dbfs)
            
            # Convert to mono, 16kHz for Whisper compatibility
            audio = audio.set_frame_rate(16000).set_channels(1)
            
            # Convert to NumPy array for downstream AI (Whisper/Speech-to-text)
            samples = np.array(audio.get_array_of_samples(), dtype=np.float32)
            
            # Divide by 2^15 for 16-bit PCM to [-1, 1] range
            samples /= 32768.0
            
            # Placeholder for Whisper transcription and InterviewService integration
            # transcript = await whisper_service.transcribe(samples)
            # await self.interview_service.process_transcript(session_id, transcript)
            
            return samples

        except Exception as e:
            # Handle decoding or normalization errors
            print(f"Audio processing error in session {session_id}: {str(e)}")
            return None

    async def process_video_frame(self, session_id: str, frame_base64: str):
        """
        Decode base64 frame and prepare for facial/emotion analysis.
        Uses OpenCV for efficient image decoding on M1 architecture.
        """
        try:
            # Decode base64 image
            img_bytes = base64.b64decode(frame_base64)
            nparr = np.frombuffer(img_bytes, np.uint8)
            frame = cv2.imdecode(nparr, cv2.imencode('.jpg', np.zeros((1, 1, 3)))[1].size) # Placeholder trick to verify buffer
            frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

            if frame is None:
                raise ValueError("Could not decode image frame")

            # Basic preprocessing (e.g. resize for model input)
            # frame_resized = cv2.resize(frame, (224, 224))
            
            # Placeholder for facial expression analysis model (DeepFace/Fer)
            # emotions = await facial_analysis_service.detect_emotions(frame)
            # await self.interview_service.update_visual_metrics(session_id, emotions)

            return frame

        except Exception as e:
            print(f"Video processing error in session {session_id}: {str(e)}")
            return None

    async def handle_control(self, session_id: str, control_data: Dict[str, Any]):
        """
        Handle control messages like session_start, session_end, next_question.
        """
        cmd = control_data.get("command")
        if cmd == "start":
            # Logic to initialize recording/streaming
            pass
        elif cmd == "stop":
            # Logic to finalize session and trigger final evaluation
            pass
        elif cmd == "next":
            # Logic to advance to the next interview question
            pass
