import os
from pathlib import Path
from uuid import uuid4
from fastapi import UploadFile, HTTPException
import logging

from app.config import settings

logger = logging.getLogger(__name__)

# Allowed file extensions
ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png"}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB


def save_upload(file: UploadFile) -> tuple[str, str]:
    """
    Save uploaded image file.
    
    Args:
        file: UploadFile from FastAPI
        
    Returns:
        tuple: (filename, full_path)
        
    Raises:
        HTTPException: If file is invalid
    """
    # Validate file extension
    file_ext = Path(file.filename).suffix.lower()
    if file_ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file type. Allowed: {', '.join(ALLOWED_EXTENSIONS)}"
        )
    
    # Validate file size
    file.file.seek(0, 2)  # Seek to end
    file_size = file.file.tell()
    file.file.seek(0)  # Reset to beginning
    
    if file_size > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=400,
            detail=f"File too large. Max size: 10MB"
        )
    
    # Create originals directory if it doesn't exist
    originals_dir = Path(settings.UPLOAD_DIR) / "originals"
    originals_dir.mkdir(parents=True, exist_ok=True)
    
    # Generate unique filename
    filename = f"{uuid4()}{file_ext}"
    file_path = originals_dir / filename
    
    # Save file
    try:
        with open(file_path, "wb") as f:
            f.write(file.file.read())
        logger.info(f"✓ File saved: {file_path}")
        return filename, str(file_path)
    except Exception as e:
        logger.error(f"Failed to save file: {e}")
        raise HTTPException(status_code=500, detail="Failed to save file")


def save_annotated(image_bytes: bytes, filename: str) -> str:
    """
    Save annotated image.
    
    Args:
        image_bytes: Annotated image as bytes
        filename: Original filename (without extension)
        
    Returns:
        str: Saved file path
    """
    # Create annotated directory if it doesn't exist
    annotated_dir = Path(settings.UPLOAD_DIR) / "annotated"
    annotated_dir.mkdir(parents=True, exist_ok=True)
    
    # Generate annotated filename
    file_ext = Path(filename).suffix
    annotated_filename = f"annotated_{filename}"
    file_path = annotated_dir / annotated_filename
    
    # Save file
    try:
        with open(file_path, "wb") as f:
            f.write(image_bytes)
        logger.info(f"✓ Annotated image saved: {file_path}")
        return str(file_path)
    except Exception as e:
        logger.error(f"Failed to save annotated image: {e}")
        raise HTTPException(status_code=500, detail="Failed to save annotated image")
