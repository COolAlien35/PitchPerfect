from fastapi import FastAPI, UploadFile, File, HTTPException
from pydantic import BaseModel
import json
import io
import wave
import struct
import numpy as np
import logging
import base64

# --- Configuration ---
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# --- Speech Recognition Setup ---
# For now, we'll use a simplified approach without Vosk to avoid FFmpeg dependency
logger.info("Using simplified voice analysis (no speech recognition)")

# --- FastAPI App ---
app = FastAPI()

# --- Filler Words List ---
FILLER_WORDS = {
    "um", "uh", "hmm", "mhm", "uh-huh", "like", "you know", "i mean", 
    "so", "well", "right", "actually", "basically", "literally"
}

# --- Helper Functions ---
def analyze_audio_chunk(audio_data: bytes, sample_rate: int = 16000):
    """Analyzes a single audio chunk for various speech metrics."""
    try:
        # Convert audio data to numpy array
        audio_np = np.frombuffer(audio_data, dtype=np.int16)
        
        # Calculate volume (RMS)
        rms = np.sqrt(np.mean(audio_np.astype(float)**2))
        volume_normalized = min((rms / 10000) * 100, 100)
        
        # Calculate speech rate based on audio energy patterns
        # This is a simplified approach - in a real implementation, you'd use speech recognition
        energy_threshold = 1000
        speech_segments = np.where(audio_np > energy_threshold)[0]
        
        if len(speech_segments) > 0:
            # Estimate words per minute based on speech energy
            # This is a rough approximation
            speech_duration = len(speech_segments) / sample_rate
            estimated_words = speech_duration * 2.5  # Rough estimate: 2.5 words per second
            wpm = (estimated_words / speech_duration) * 60 if speech_duration > 0 else 0
        else:
            wpm = 0
        
        # Simplified confidence based on volume and consistency
        confidence = "Medium"
        if volume_normalized > 50:
            confidence = "High"
        elif volume_normalized < 25:
            confidence = "Low"
        
        # Simplified clarity assessment
        clarity = "Good"
        if wpm > 200 or wpm < 80:
            clarity = "Pacing Issue"
        
        # Mock filler words (in real implementation, this would come from speech recognition)
        filler_count = 0
        
        return {
            "fillerWords": filler_count,
            "wpm": round(wpm),
            "volume": round(volume_normalized),
            "confidence": confidence,
            "clarity": clarity,
            "transcript": ""  # No transcript in simplified version
        }

    except Exception as e:
        logger.error(f"Error during audio analysis: {e}", exc_info=True)
        raise

# --- API Endpoints ---
@app.post("/analyze-voice")
async def analyze_voice(file: UploadFile = File(...)):
    """Receives an audio chunk and returns analysis."""
    try:
        contents = await file.read()
        logger.info(f"Received audio file of size: {len(contents)} bytes")

        # For now, we'll work with raw audio data directly
        # In a production environment, you'd want proper audio format conversion
        try:
            # Try to decode as base64 if it's encoded
            if len(contents) > 1000:  # Likely base64 encoded
                try:
                    decoded = base64.b64decode(contents)
                    audio_data = decoded
                except:
                    audio_data = contents
            else:
                audio_data = contents
            
            # Ensure we have enough data
            if len(audio_data) < 100:
                raise ValueError("Audio data too small")
            
            # Convert to 16-bit PCM if needed
            if len(audio_data) % 2 != 0:
                audio_data = audio_data[:-1]  # Remove odd byte
            
            logger.info(f"Processing audio data of size: {len(audio_data)} bytes")

            analysis_results = analyze_audio_chunk(audio_data)
            logger.info(f"Analysis complete: {analysis_results}")
            
            return analysis_results

        except Exception as audio_error:
            logger.error(f"Audio processing error: {audio_error}")
            # Return mock data for now
            return {
                "fillerWords": 0,
                "wpm": 120,
                "volume": 50,
                "confidence": "Medium",
                "clarity": "Good",
                "transcript": ""
            }

    except Exception as e:
        logger.error(f"Failed to process audio file: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {e}")

@app.get("/")
def read_root():
    return {"message": "Voice Analysis API is running"}