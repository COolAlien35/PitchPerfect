
from fastapi import FastAPI
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from deepface import DeepFace
import base64
import cv2
import numpy as np
import logging
import binascii

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI()

class ImageRequest(BaseModel):
    image: str # base64 encoded string


def convert_to_native_types(data):
    """Recursively converts numpy types in a dictionary to native Python types."""
    if isinstance(data, dict):
        return {k: convert_to_native_types(v) for k, v in data.items()}
    elif isinstance(data, list):
        return [convert_to_native_types(i) for i in data]
    elif isinstance(data, np.floating):
        return float(data)
    elif isinstance(data, np.integer):
        return int(data)
    elif isinstance(data, np.ndarray):
        return data.tolist()
    return data

@app.post("/analyze")
async def analyze_image(request: ImageRequest):
    logger.info("Received request for analysis")
    try:
        image_data_string = request.image
        
        header, data = image_data_string.split(',', 1)
        logger.info("Successfully split image header from data")

        img_data = base64.b64decode(data)
        logger.info("Successfully decoded base64 data")
        
        nparr = np.frombuffer(img_data, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        if img is None:
            logger.error("Failed to decode image with OpenCV")
            return JSONResponse(status_code=400, content={"error": "Invalid image data. OpenCV could not decode it."})

        logger.info("Image decoded successfully, starting analysis with DeepFace")
        
        analysis_result = DeepFace.analyze(
            img_path=img,
            actions=['emotion'],
            enforce_detection=False,
            detector_backend='opencv'
        )
        logger.info(f"DeepFace analysis raw result: {analysis_result}")
        
        # Convert numpy types to native Python types for JSON serialization
        native_result = convert_to_native_types(analysis_result)
        logger.info(f"Converted analysis result for JSON: {native_result}")

        if isinstance(native_result, list) and len(native_result) > 0:
            first_face = native_result[0]
            if 'emotion' in first_face:
                return first_face
            else:
                logger.warning("No emotion data found in the detected face.")
                return {"emotion": "no face detected", "dominant_emotion": "unknown"}
        else:
            logger.warning("DeepFace did not return a list of faces or the list was empty.")
            return {"emotion": "no face detected", "dominant_emotion": "unknown"}

    except (ValueError, IndexError, binascii.Error) as e:
        logger.error(f"Error decoding base64 string: {e}", exc_info=True)
        return JSONResponse(status_code=400, content={"error": f"Invalid base64 string: {e}"})
    except Exception as e:
        logger.error(f"An unexpected error occurred during analysis: {e}", exc_info=True)
        return JSONResponse(status_code=500, content={"error": f"An internal server error occurred: {e}"})

@app.get("/")
def read_root():
    return {"message": "Facial Analysis API is running"}
