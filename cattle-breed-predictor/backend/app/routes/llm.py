from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from uuid import UUID
from sqlalchemy import select, update

from app.config import settings
from app.database import AsyncSessionLocal
from app.models.prediction import Prediction, BreedCache
from app.services.llm_service import get_breed_info
from app.schemas.prediction import BreedInfoResponse, BreedInfoRequest

router = APIRouter(prefix="/api", tags=["LLM"])


# ── POST /api/breed-info ─────────────────────────────────────
@router.post("/breed-info", response_model=BreedInfoResponse)
async def fetch_breed_info(request: BreedInfoRequest):
    """
    Fetch breed information from Ollama LLM (with cache).
    Optionally saves result to the predictions table if
    prediction_id is provided.
    """
    print(f"📥 /api/breed-info called → breed='{request.breed_name}' "
          f"conf={request.confidence} id={request.prediction_id}")

    if not request.breed_name or not request.breed_name.strip():
        raise HTTPException(status_code=422, detail="breed_name is required")

    result = await get_breed_info(
        request.breed_name.strip(),
        request.confidence
    )
    # print result for debugging before returning
    print(f"📣 LLM service returned: {result}")

    # Check if LLM returned an error dict
    if "error" in result:
        print(f"❌ LLM returned error: {result}")
        raise HTTPException(
            status_code=502,
            detail={
                "message": "Failed to generate breed info",
                "reason": result.get("error"),
                "breed": request.breed_name
            }
        )

    # Optionally persist breed_info into the predictions row
    if request.prediction_id:
        try:
            async with AsyncSessionLocal() as db:
                await db.execute(
                    update(Prediction)
                    .where(Prediction.id == request.prediction_id)
                    .values(
                        breed_info=result,
                        llm_model_used=settings.OLLAMA_MODEL
                    )
                )
                await db.commit()
                print(f"✅ breed_info saved to prediction {request.prediction_id}")
        except Exception as e:
            print(f"⚠️  Could not save breed_info to DB: {type(e).__name__}: {e}")

    return {
        "breed_info": result,
        "model_used": settings.OLLAMA_MODEL,
        "from_cache": False   # llm_service handles real cache flag
    }


# ── GET /api/breed-info/cache ────────────────────────────────
@router.get("/breed-info/cache")
async def get_breed_cache():
    """Return all cached breed info entries."""
    async with AsyncSessionLocal() as db:
        result = await db.execute(select(BreedCache))
        rows = result.scalars().all()
        return [
            {
                "breed_name": r.breed_name,
                "cached_at": r.cached_at,
                "has_data": bool(r.breed_info)
            }
            for r in rows
        ]


# ── DELETE /api/breed-info/cache/{breed_name} ────────────────
@router.delete("/breed-info/cache/{breed_name}")
async def clear_breed_cache(breed_name: str):
    """Force refresh: delete a breed from cache."""
    async with AsyncSessionLocal() as db:
        result = await db.execute(
            select(BreedCache).where(
                BreedCache.breed_name == breed_name.strip().lower()
            )
        )
        row = result.scalar_one_or_none()
        if not row:
            raise HTTPException(
                status_code=404,
                detail=f"No cache entry found for '{breed_name}'"
            )
        await db.delete(row)
        await db.commit()
    return {"message": f"Cache cleared for '{breed_name}'"}

