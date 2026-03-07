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

USER_PROMPT_TEMPLATE = """Give information about cattle breed: "{breed_name}"
detected with {confidence}% confidence.

Respond ONLY with this JSON object, no markdown, no extra text:
{{
  "breed_name": string,
  "origin": string,
  "description": string,
  "purpose": [list of strings],
  "temperament": string,
  "characteristics": {{
    "avg_weight_kg": {{"male": number, "female": number}},
    "lifespan_years": number,
    "coat_color": [list of strings]
  }},
  "milk_production_liters_per_day": number,
  "pros": [3 strings],
  "cons": [2 strings],
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
    
    # Use lowercase for consistent cache key
    cache_key = breed_name.strip().lower()
    
    async with AsyncSessionLocal() as db:
        # Check cache
        print(f"🔍 Checking cache for breed: {breed_name}")
        result = await db.execute(
            select(BreedCache).where(BreedCache.breed_name == cache_key)
        )
        cached = result.scalar_one_or_none()

        if cached:
            age = datetime.utcnow() - cached.cached_at
            if age < timedelta(days=7):
                print(f"✅ Cache hit for breed: {breed_name}")
                logger.info(f"✅ Cache hit for breed: {breed_name}")
                return cached.breed_info
            else:
                print(f"Cache expired for: {breed_name}, refreshing...")
                logger.info(f"Cache expired for: {breed_name}, refreshing...")
                await db.delete(cached)
                await db.commit()
                cached = None  # ← CRITICAL FIX: reset to None after delete

        # Call Ollama
        try:
            print(f"🤖 Calling Ollama for breed: {breed_name}")
            logger.info(f"Calling Ollama for breed: {breed_name}")
            logger.info(f"  URL   → {settings.OLLAMA_BASE_URL}/api/generate")
            logger.info(f"  Model → '{settings.OLLAMA_MODEL}'")

            prompt = USER_PROMPT_TEMPLATE.format(
                breed_name=breed_name,
                confidence=int(confidence * 100)
            )

            async with httpx.AsyncClient(timeout=180.0) as client:
                response = await client.post(
                    f"{settings.OLLAMA_BASE_URL}/api/generate",
                    json={
                        "model": settings.OLLAMA_MODEL,
                        "prompt": prompt,
                        "system": SYSTEM_PROMPT,
                        "stream": False,
                        "options": {
                            "num_ctx": 512,      # smaller = faster for 1b model
                            "num_predict": 450,  # tokens to generate
                            "temperature": 0.1,  # lower = faster, less creative
                            "num_thread": 8,     # use multiple threads
                            "repeat_penalty": 1.1
                        }
                    }
                )
                response.raise_for_status()
                data = response.json()
                response_text = data.get("response", "")
                print(f"📨 Raw LLM response ({len(response_text)} chars): {response_text[:150]}...")
                logger.info(f"Raw LLM response preview: {response_text[:200]}")

        except httpx.HTTPStatusError as e:
            logger.error(
                f"Ollama HTTP {e.response.status_code} for '{breed_name}'. "
                f"Is model pulled? Run: ollama pull {settings.OLLAMA_MODEL}"
            )
            return {"error": f"Ollama HTTP error {e.response.status_code}"}

        except httpx.ConnectError:
            logger.error(
                f"Cannot connect to Ollama at {settings.OLLAMA_BASE_URL}. "
                f"Run: ollama serve"
            )
            return {"error": "Ollama not running"}

        except httpx.TimeoutException:
            logger.error(f"Ollama timed out for breed: {breed_name}")
            return {"error": "Ollama request timed out"}

        except Exception as e:
            logger.error(
                f"Unexpected Ollama error for {breed_name}: "
                f"{type(e).__name__}: {e}"
            )
            return {"error": f"{type(e).__name__}: {str(e)}"}

        # Parse JSON robustly
        json_text = ""
        try:
            json_text = response_text.strip()

            # Strip markdown fences if model ignores system prompt
            if "```" in json_text:
                parts = json_text.split("```")
                # Find the part that looks like JSON
                for part in parts:
                    part = part.strip()
                    if part.startswith("json"):
                        part = part[4:].strip()
                    if part.startswith("{"):
                        json_text = part
                        break

            # Find JSON boundaries
            start = json_text.find("{")
            end = json_text.rfind("}") + 1
            if start == -1 or end == 0:
                raise ValueError(
                    f"No JSON object found in response. "
                    f"Got: {response_text[:300]}"
                )

            json_text = json_text[start:end]
            breed_info = json.loads(json_text)
            print(f"✅ JSON parsed successfully for breed: {breed_name}")
            logger.info(f"✅ JSON parsed for breed: {breed_name}")
            # also show the parsed object
            print(f"📦 Parsed breed_info object: {breed_info}")

        except (json.JSONDecodeError, ValueError) as e:
            print(f"❌ JSON parse FAILED for {breed_name}: {e}")
            logger.error(f"JSON parse failed for {breed_name}: {e}")
            logger.error(f"Raw text was: {response_text[:500]}")
            return {
                "error": "Failed to parse LLM response as JSON",
                "breed_name": breed_name,
                "raw_preview": response_text[:300]
            }

        # Save to cache (always insert fresh since we set cached=None above)
        try:
            async with AsyncSessionLocal() as save_db:
                new_cache = BreedCache(
                    breed_name=cache_key,
                    breed_info=breed_info,
                    cached_at=datetime.utcnow()
                )
                save_db.add(new_cache)
                await save_db.commit()
                logger.info(f"✅ Cached breed info for: {breed_name}")
        except Exception as e:
            logger.warning(
                f"Cache save failed for {breed_name} "
                f"({type(e).__name__}): {e} — continuing anyway"
            )

        return breed_info


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
        async with httpx.AsyncClient(timeout=120.0) as client:
            async with client.stream(
                "POST",
                f"{settings.OLLAMA_BASE_URL}/api/generate",
                json={
                    "model": settings.OLLAMA_MODEL,
                    "prompt": prompt,
                    "system": SYSTEM_PROMPT,
                    "stream": True,
                    "options": {
                        "num_ctx": 1024,
                        "num_predict": 600,
                        "temperature": 0.3
                    }
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
                            logger.info(f"✅ Stream complete for breed: {breed_name}")
                            break
                            
    except Exception as e:
        logger.error(
            f"Stream error for {breed_name}: {type(e).__name__}: {e}"
        )
        yield f"data: {{'error': '{str(e)}'}}\n\n"

