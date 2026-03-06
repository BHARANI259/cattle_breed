"""
FastAPI Cattle Breed Prediction API

Run from backend/ directory:
    cd cattle-breed-predictor/backend
    uvicorn app.main:app --reload

Or use the convenience script:
    python run.py
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from contextlib import asynccontextmanager
import os
from pathlib import Path

from app.config import settings
from app.database import create_tables
from app.routes.predict import router as predict_router
from app.routes.history import router as history_router
from app.routes.stats import router as stats_router
from app.routes.llm import router as llm_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan context manager for startup and shutdown events."""
    # Startup
    print("Creating database tables...")
    await create_tables()
    print("Database tables created successfully.")
    
    # Create upload directories
    upload_base = Path(settings.UPLOAD_DIR)
    upload_base.mkdir(exist_ok=True)
    (upload_base / "originals").mkdir(exist_ok=True)
    (upload_base / "annotated").mkdir(exist_ok=True)
    print(f"✓ Upload directories ready: {upload_base}")
    
    yield
    
    # Shutdown (if needed)
    print("Shutting down...")


# Initialize FastAPI app
app = FastAPI(
    title="Cattle Breed Predictor API",
    description="API for predicting cattle breeds using YOLOv8 and LLM",
    version="1.0.0",
    lifespan=lifespan,
)


# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Mount static files for uploads
upload_base = Path(settings.UPLOAD_DIR)
originals_dir = upload_base / "originals"
annotated_dir = upload_base / "annotated"

# Create directories if they don't exist
originals_dir.mkdir(parents=True, exist_ok=True)
annotated_dir.mkdir(parents=True, exist_ok=True)

app.mount("/uploads/originals", StaticFiles(directory=originals_dir), name="uploads_originals")
app.mount("/uploads/annotated", StaticFiles(directory=annotated_dir), name="uploads_annotated")


# Include API routers
app.include_router(predict_router)
app.include_router(history_router)
app.include_router(stats_router)
app.include_router(llm_router)


# Health check endpoint
@app.get("/health")
async def health_check():
    """Health check endpoint to verify API is running."""
    return {"status": "ok"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
