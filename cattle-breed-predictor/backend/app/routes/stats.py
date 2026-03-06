import logging
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, Query
from sqlalchemy import select, func, cast, Date, and_
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models import Prediction
from app.schemas.prediction import StatsResponse, BreedStat, TimelineEntry

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/api/stats",
    tags=["stats"],
)


@router.get("", response_model=StatsResponse)
async def get_stats(db: AsyncSession = Depends(get_db)):
    """
    Get overall statistics about predictions.
    
    Returns:
        - total_predictions: Total number of predictions
        - top_breed: Breed with the most predictions
        - avg_confidence: Average confidence score
        - breed_distribution: Count and percentage by breed
        - predictions_today: Predictions made today
        - predictions_this_week: Predictions from the last 7 days
    """
    
    # Total predictions
    result = await db.execute(select(func.count()).select_from(Prediction))
    total = result.scalar() or 0
    
    if total == 0:
        return StatsResponse(
            total_predictions=0,
            top_breed="N/A",
            avg_confidence=0.0,
            breed_distribution=[],
            predictions_today=0,
            predictions_this_week=0,
        )
    
    # Average confidence
    result = await db.execute(select(func.avg(Prediction.confidence_score)))
    avg_confidence = round(float(result.scalar() or 0), 2)
    
    # Breed distribution
    result = await db.execute(
        select(Prediction.predicted_breed, func.count().label("count"))
        .group_by(Prediction.predicted_breed)
        .order_by(func.count().desc())
    )
    breed_counts = result.all()
    
    breed_distribution = [
        BreedStat(
            breed=breed,
            count=count,
            percentage=round((count / total) * 100, 2),
        )
        for breed, count in breed_counts
    ]
    
    top_breed = breed_distribution[0].breed if breed_distribution else "N/A"
    
    # Predictions today
    today = datetime.utcnow().date()
    result = await db.execute(
        select(func.count()).select_from(Prediction)
        .where(cast(Prediction.created_at, Date) == today)
    )
    predictions_today = result.scalar() or 0
    
    # Predictions this week
    week_ago = datetime.utcnow() - timedelta(days=7)
    result = await db.execute(
        select(func.count()).select_from(Prediction)
        .where(Prediction.created_at >= week_ago)
    )
    predictions_this_week = result.scalar() or 0
    
    return StatsResponse(
        total_predictions=total,
        top_breed=top_breed,
        avg_confidence=avg_confidence,
        breed_distribution=breed_distribution,
        predictions_today=predictions_today,
        predictions_this_week=predictions_this_week,
    )


@router.get("/timeline", response_model=list[TimelineEntry])
async def get_timeline(
    days: int = Query(30, ge=1, le=365),
    db: AsyncSession = Depends(get_db),
):
    """
    Get prediction timeline by date.
    
    - days: Number of days back to include (default 30, max 365)
    
    Returns: List of {date, count} for each day
    """
    start_date = datetime.utcnow() - timedelta(days=days)
    
    result = await db.execute(
        select(
            cast(Prediction.created_at, Date).label("date"),
            func.count().label("count")
        )
        .where(Prediction.created_at >= start_date)
        .group_by(cast(Prediction.created_at, Date))
        .order_by(cast(Prediction.created_at, Date))
    )
    
    timeline_data = result.all()
    
    return [
        TimelineEntry(
            date=str(date),
            count=count,
        )
        for date, count in timeline_data
    ]
