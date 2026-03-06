from pydantic import BaseModel
from datetime import datetime
from uuid import UUID


class BoundingBox(BaseModel):
    """Bounding box with class and confidence."""
    x1: float
    y1: float
    x2: float
    y2: float
    class_name: str
    confidence: float


class PredictionResponse(BaseModel):
    """Response model for prediction endpoint."""
    id: UUID
    image_filename: str
    image_url: str
    annotated_image_url: str
    predicted_breed: str
    confidence_score: float
    all_class_scores: dict[str, float]
    bounding_boxes: list[BoundingBox]
    created_at: datetime

    class Config:
        from_attributes = True


class PredictionListItem(BaseModel):
    """Lightweight prediction response for list endpoints."""
    id: UUID
    image_filename: str
    image_url: str
    annotated_image_url: str
    predicted_breed: str
    confidence_score: float
    created_at: datetime

    class Config:
        from_attributes = True


class PaginatedHistory(BaseModel):
    """Paginated list of predictions."""
    items: list[PredictionListItem]
    total: int
    page: int
    limit: int
    total_pages: int


class BreedStat(BaseModel):
    """Breed statistics."""
    breed: str
    count: int
    percentage: float


class StatsResponse(BaseModel):
    """Overall statistics response."""
    total_predictions: int
    top_breed: str
    avg_confidence: float
    breed_distribution: list[BreedStat]
    predictions_today: int
    predictions_this_week: int


class TimelineEntry(BaseModel):
    """Timeline entry for predictions by date."""
    date: str
    count: int
