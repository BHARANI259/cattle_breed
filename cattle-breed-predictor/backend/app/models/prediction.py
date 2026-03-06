from sqlalchemy import Column, String, Float, DateTime, JSON
from sqlalchemy.dialects.postgresql import UUID
from datetime import datetime
import uuid
from app.database import Base


class Prediction(Base):
    """ORM model for cattle breed predictions."""
    __tablename__ = "predictions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    image_filename = Column(String(255), nullable=False)
    image_path = Column(String(500), nullable=False)
    predicted_breed = Column(String(100), nullable=False)
    confidence_score = Column(Float, nullable=False)
    all_class_scores = Column(JSON, nullable=False)  # Full probability dict from YOLO
    bounding_boxes = Column(JSON, nullable=False)    # [{x1,y1,x2,y2,class,conf}]
    breed_info = Column(JSON, nullable=True)          # LLM-generated info
    llm_model_used = Column(String(50), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    def __repr__(self):
        return f"<Prediction(id={self.id}, breed={self.predicted_breed}, confidence={self.confidence_score})>"


class BreedCache(Base):
    """ORM model for cached breed information from LLM."""
    __tablename__ = "breeds_cache"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    breed_name = Column(String(100), unique=True, nullable=False)
    breed_info = Column(JSON, nullable=False)  # Cached LLM response
    cached_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    def __repr__(self):
        return f"<BreedCache(breed={self.breed_name})>"
