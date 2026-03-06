import logging
from pathlib import Path
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models import Prediction
from app.schemas.prediction import PredictionResponse, PaginatedHistory, PredictionListItem
from app.config import settings

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/api/history",
    tags=["history"],
)


@router.get("", response_model=PaginatedHistory)
async def get_history(
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=50),
    breed: str | None = Query(None),
    sort: str = Query("newest", regex="^(newest|oldest)$"),
    db: AsyncSession = Depends(get_db),
):
    """
    Get prediction history with pagination and optional filtering.
    
    - page: Page number (starting at 1)
    - limit: Items per page (max 50)
    - breed: Optional breed name filter (case-insensitive)
    - sort: "newest" (default) or "oldest"
    """
    # Build query
    query = select(Prediction)
    
    # Apply breed filter if provided
    if breed:
        query = query.where(Prediction.predicted_breed.ilike(f"%{breed}%"))
    
    # Apply sorting
    if sort == "newest":
        query = query.order_by(Prediction.created_at.desc())
    else:
        query = query.order_by(Prediction.created_at.asc())
    
    # Get total count
    count_query = select(func.count()).select_from(Prediction)
    if breed:
        count_query = count_query.where(Prediction.predicted_breed.ilike(f"%{breed}%"))
    
    result = await db.execute(count_query)
    total = result.scalar()
    
    # Apply pagination
    offset = (page - 1) * limit
    query = query.offset(offset).limit(limit)
    
    # Execute query
    result = await db.execute(query)
    predictions = result.scalars().all()
    
    # Convert to list items
    items = [
        PredictionListItem(
            id=p.id,
            image_filename=p.image_filename,
            image_url=f"/uploads/originals/{p.image_filename}",
            annotated_image_url=f"/uploads/annotated/annotated_{p.image_filename}",
            predicted_breed=p.predicted_breed,
            confidence_score=p.confidence_score,
            created_at=p.created_at,
        )
        for p in predictions
    ]
    
    return PaginatedHistory(
        items=items,
        total=total,
        page=page,
        limit=limit,
        total_pages=(total + limit - 1) // limit,
    )


@router.get("/{prediction_id}", response_model=PredictionResponse)
async def get_prediction(
    prediction_id: str,
    db: AsyncSession = Depends(get_db),
):
    """
    Get a single prediction by ID with all details.
    """
    result = await db.execute(
        select(Prediction).where(Prediction.id == prediction_id)
    )
    prediction = result.scalar_one_or_none()
    
    if not prediction:
        raise HTTPException(status_code=404, detail="Prediction not found")
    
    return PredictionResponse(
        id=prediction.id,
        image_filename=prediction.image_filename,
        image_url=f"/uploads/originals/{prediction.image_filename}",
        annotated_image_url=f"/uploads/annotated/annotated_{prediction.image_filename}",
        predicted_breed=prediction.predicted_breed,
        confidence_score=prediction.confidence_score,
        all_class_scores=prediction.all_class_scores,
        bounding_boxes=prediction.bounding_boxes,
        created_at=prediction.created_at,
    )


@router.delete("/{prediction_id}")
async def delete_prediction(
    prediction_id: str,
    db: AsyncSession = Depends(get_db),
):
    """
    Delete a prediction and its associated image files.
    """
    result = await db.execute(
        select(Prediction).where(Prediction.id == prediction_id)
    )
    prediction = result.scalar_one_or_none()
    
    if not prediction:
        raise HTTPException(status_code=404, detail="Prediction not found")
    
    # Delete image files from disk
    try:
        original_path = Path(prediction.image_path)
        if original_path.exists():
            original_path.unlink()
            logger.info(f"✓ Deleted original image: {original_path}")
        
        annotated_path = Path(settings.UPLOAD_DIR) / "annotated" / f"annotated_{prediction.image_filename}"
        if annotated_path.exists():
            annotated_path.unlink()
            logger.info(f"✓ Deleted annotated image: {annotated_path}")
    except Exception as e:
        logger.error(f"Error deleting image files: {e}")
        raise HTTPException(status_code=500, detail="Failed to delete image files")
    
    # Delete from database
    await db.delete(prediction)
    await db.commit()
    
    logger.info(f"✓ Deleted prediction record: {prediction_id}")
    
    return {"message": "Deleted successfully"}
