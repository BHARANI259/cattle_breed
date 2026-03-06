import logging
from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models import BreedCache, Prediction
from app.services import llm_service

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/api/breed-info",
    tags=["llm"],
)


class BreedInfoRequest(BaseModel):
    """Request body for breed info endpoint."""
    breed_name: str
    confidence: float


class BreedInfoResponse(BaseModel):
    """Response for breed info endpoint."""
    breed_info: dict
    from_cache: bool


class CacheEntry(BaseModel):
    """Cache entry response."""
    breed_name: str
    cached_at: str


@router.post("", response_model=BreedInfoResponse)
async def get_breed_info(
    request: BreedInfoRequest,
    db: AsyncSession = Depends(get_db),
):
    """
    Get breed information (cached or from LLM).
    
    Returns:
        - breed_info: dict with full breed details
        - from_cache: bool indicating if result came from cache
    """
    breed_name = request.breed_name
    confidence = request.confidence
    
    # Get breed info (handles caching internally)
    breed_info = await llm_service.get_breed_info(breed_name, confidence)
    
    # Check if it came from cache (by querying cache table)
    result = await db.execute(
        select(BreedCache).where(BreedCache.breed_name == breed_name)
    )
    cached_entry = result.scalar_one_or_none()
    from_cache = cached_entry is not None
    
    return BreedInfoResponse(
        breed_info=breed_info,
        from_cache=from_cache,
    )


@router.get("/stream")
async def stream_breed_info(
    breed_name: str = Query(...),
    confidence: float = Query(...),
):
    """
    Stream breed information from LLM as Server-Sent Events.
    
    Query params:
        - breed_name: Name of the breed
        - confidence: Detection confidence (0-1)
    """
    async def event_generator():
        async for chunk in llm_service.stream_breed_info(breed_name, confidence):
            yield chunk
    
    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        }
    )


@router.get("/cache", response_model=list[CacheEntry])
async def get_cache(db: AsyncSession = Depends(get_db)):
    """
    Get all cached breed information.
    
    Returns: List of cached breeds with timestamp
    """
    result = await db.execute(select(BreedCache))
    cached_breeds = result.scalars().all()
    
    return [
        CacheEntry(
            breed_name=b.breed_name,
            cached_at=b.cached_at.isoformat(),
        )
        for b in cached_breeds
    ]


@router.delete("/cache/{breed_name}")
async def delete_cache_entry(
    breed_name: str,
    db: AsyncSession = Depends(get_db),
):
    """
    Delete a breed from cache to force LLM refresh.
    
    Path params:
        - breed_name: Name of breed to remove from cache
    """
    result = await db.execute(
        select(BreedCache).where(BreedCache.breed_name == breed_name)
    )
    cached = result.scalar_one_or_none()
    
    if not cached:
        raise HTTPException(status_code=404, detail="Breed not found in cache")
    
    await db.delete(cached)
    await db.commit()
    
    logger.info(f"✓ Deleted breed from cache: {breed_name}")
    
    return {"message": f"Deleted {breed_name} from cache"}
