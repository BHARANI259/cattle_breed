import httpx
import json
import logging
from datetime import datetime, timedelta
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.database import AsyncSessionLocal
from app.models import BreedCache

logger = logging.getLogger(__name__)

SYSTEM_PROMPT = """You are an expert veterinarian and livestock specialist.
When given a cattle breed name, respond ONLY with a valid JSON object.
No markdown, no explanation, no code blocks. Just raw JSON."""

USER_PROMPT_TEMPLATE = """Provide detailed information about the cattle breed: "{breed_name}"
with a detection confidence of {confidence}%.

Return ONLY this exact JSON structure:
{{
  "breed_name": string,
  "origin": string,
  "description": string (2-3 sentences),
  "characteristics": {{
    "average_weight_kg": {{ "male": number, "female": number }},
    "height_cm": {{ "male": number, "female": number }},
    "lifespan_years": number,
    "coat_color": [list of strings],
    "body_type": string
  }},
  "purpose": [list: "Dairy" | "Beef" | "Draft" | "Dual-purpose"],
  "temperament": string,
  "milk_production": {{
    "daily_liters": number,
    "fat_percentage": number
  }},
  "pros": [list of 3–5 strings],
  "cons": [list of 2–4 strings],
  "common_health_issues": [list of strings],
  "suitable_climate": [list of strings],
  "fun_fact": string
}}"""


async def get_breed_info(breed_name: str, confidence: float) -> dict:
    """
    Get breed information from cache or LLM.
    
    Args:
        breed_name: Name of the cattle breed
        confidence: Detection confidence (0-1)
        
    Returns:
        dict with breed information or error details
    """
    async with AsyncSessionLocal() as db:
        # Check cache first
        result = await db.execute(
            select(BreedCache).where(BreedCache.breed_name == breed_name)
        )
        cached = result.scalar_one_or_none()
        
        # Return cached data if less than 7 days old
        if cached:
            age = datetime.utcnow() - cached.cached_at
            if age < timedelta(days=7):
                logger.info(f"✓ Cache hit for breed: {breed_name}")
                return cached.breed_info
            else:
                logger.info(f"Cache expired for breed: {breed_name}, refreshing...")
                await db.delete(cached)
                await db.commit()
        
        # Call Ollama API
        try:
            logger.info(f"Calling Ollama for breed: {breed_name}")
            
            prompt = USER_PROMPT_TEMPLATE.format(
                breed_name=breed_name,
                confidence=int(confidence * 100)
            )
            
            async with httpx.AsyncClient(timeout=60.0) as client:
                response = await client.post(
                    f"{settings.OLLAMA_BASE_URL}/api/generate",
                    json={
                        "model": settings.OLLAMA_MODEL,
                        "prompt": prompt,
                        "system": SYSTEM_PROMPT,
                        "stream": False,
                    }
                )
                response.raise_for_status()
                data = response.json()
                response_text = data.get("response", "")
            
            # Parse JSON from response
            # Strip any accidental markdown code blocks
            json_text = response_text.strip()
            if json_text.startswith("```"):
                json_text = json_text.split("```")[1]
            if json_text.startswith("json"):
                json_text = json_text[4:]
            json_text = json_text.strip()
            
            breed_info = json.loads(json_text)
            logger.info(f"✓ LLM response parsed for breed: {breed_name}")
            
            # Upsert into cache
            if cached:
                cached.breed_info = breed_info
                cached.cached_at = datetime.utcnow()
            else:
                cached = BreedCache(
                    breed_name=breed_name,
                    breed_info=breed_info,
                    cached_at=datetime.utcnow()
                )
                db.add(cached)
            
            await db.commit()
            logger.info(f"✓ Cached breed info for: {breed_name}")
            
            return breed_info
            
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse LLM JSON for {breed_name}: {e}")
            return {"error": "LLM parse failed", "raw": json_text if 'json_text' in locals() else ""}
        except Exception as e:
            logger.error(f"LLM error for {breed_name}: {e}")
            return {"error": str(e)}


async def stream_breed_info(breed_name: str, confidence: float):
    """
    Stream breed information from LLM as Server-Sent Events.
    
    Args:
        breed_name: Name of the cattle breed
        confidence: Detection confidence (0-1)
        
    Yields:
        str: SSE formatted data chunks
    """
    prompt = USER_PROMPT_TEMPLATE.format(
        breed_name=breed_name,
        confidence=int(confidence * 100)
    )
    
    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            async with client.stream(
                "POST",
                f"{settings.OLLAMA_BASE_URL}/api/generate",
                json={
                    "model": settings.OLLAMA_MODEL,
                    "prompt": prompt,
                    "system": SYSTEM_PROMPT,
                    "stream": True,
                }
            ) as response:
                response.raise_for_status()
                
                async for line in response.aiter_lines():
                    if line:
                        data = json.loads(line)
                        chunk = data.get("response", "")
                        if chunk:
                            yield f"data: {chunk}\n\n"
                        
                        # Signal completion
                        if data.get("done", False):
                            yield f"data: [DONE]\n\n"
                            logger.info(f"✓ Stream complete for breed: {breed_name}")
                            break
                            
    except Exception as e:
        logger.error(f"Stream error for {breed_name}: {e}")
        yield f"data: {{'error': '{str(e)}'}}\n\n"
