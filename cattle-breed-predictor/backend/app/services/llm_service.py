import json
import logging
import re
import asyncio
import time
from datetime import datetime, timedelta
from sqlalchemy import select
from openai import AsyncOpenAI

from app.config import settings
from app.database import AsyncSessionLocal
from app.models import BreedCache

logger = logging.getLogger(__name__)

# Initialize OpenAI client configured for Hugging Face Router
client = AsyncOpenAI(
    api_key=settings.HF_TOKEN,
    base_url=settings.HF_ROUTER_BASE_URL,
    timeout=settings.LLM_TIMEOUT_SECONDS,
)

SYSTEM_PROMPT = """You are an expert veterinarian and livestock specialist with deep knowledge of cattle breeds.
You MUST respond ONLY with valid JSON, no markdown, no code blocks, no explanations.
If you cannot provide information, respond with an error JSON object.
Always include all required fields in your response."""

USER_PROMPT_TEMPLATE = """Generate detailed information about the cattle breed: "{breed_name}"
which was detected with {confidence}% confidence.

Respond ONLY with this exact JSON structure (all fields required):
{{
  "breed": "{breed_name}",
  "confidence": "{confidence}%",
  "origin": "country/region of origin",
  "description": "detailed breed description (2-3 sentences)",
  "purpose": ["primary", "secondary", "tertiary uses"],
  "temperament": "personality traits and behavior",
  "characteristics": {{
    "avg_weight_kg": {{"male": number, "female": number}},
    "lifespan_years": number,
    "coat_color": ["color1", "color2"],
    "height_cm": {{"male": number, "female": number}}
  }},
  "milk_production_liters_per_day": number,
  "care_tips": [
    "tip 1",
    "tip 2",
    "tip 3"
  ],
  "pros": ["advantage 1", "advantage 2", "advantage 3"],
  "cons": ["disadvantage 1", "disadvantage 2"],
  "suitable_climate": ["tropical", "temperate", "cold"],
  "fun_fact": "an interesting fact about this breed"
}}"""


def extract_json_from_text(text: str) -> dict | None:
    """
    Extract and parse JSON from potentially malformed text.
    Handles markdown fences, partial JSON, and other common issues.
    
    Args:
        text: Raw text potentially containing JSON
        
    Returns:
        Parsed JSON dict or None if extraction fails
    """
    if not text or not isinstance(text, str):
        return None
    
    text = text.strip()
    logger.debug(f"Attempting to extract JSON from {len(text)} chars")
    
    # Try direct JSON parsing first
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        logger.debug("Direct JSON parsing failed, attempting extraction...")
    
    # Remove markdown code fences
    if "```" in text:
        logger.debug("Found markdown fences, extracting content...")
        matches = re.findall(r'```(?:json)?\s*(.*?)```', text, re.DOTALL)
        if matches:
            for match in matches:
                try:
                    return json.loads(match.strip())
                except json.JSONDecodeError:
                    continue
    
    # Find JSON object boundaries
    start_idx = text.find("{")
    end_idx = text.rfind("}")
    
    if start_idx != -1 and end_idx != -1 and end_idx > start_idx:
        json_str = text[start_idx:end_idx + 1]
        logger.debug(f"Extracted JSON substring: {len(json_str)} chars")
        try:
            return json.loads(json_str)
        except json.JSONDecodeError as e:
            logger.warning(f"Failed to parse extracted JSON: {e}")
            # Try to fix common JSON issues
            json_str = json_str.replace('\n', '\\n').replace('\r', '\\r')
            try:
                return json.loads(json_str)
            except json.JSONDecodeError:
                pass
    
    return None


async def call_llm_with_retries(
    breed_name: str, confidence: float, retry_count: int = 0
) -> str:
    """
    Call the LLM via OpenAI SDK with automatic retries.
    
    Args:
        breed_name: Name of the cattle breed
        confidence: Detection confidence (0-1)
        retry_count: Current retry attempt number
        
    Returns:
        LLM response text
        
    Raises:
        Exception: If all retries are exhausted
    """
    prompt = USER_PROMPT_TEMPLATE.format(
        breed_name=breed_name,
        confidence=int(confidence * 100)
    )
    
    try:
        logger.info(f"🤖 LLM Request #{retry_count + 1} for breed: {breed_name}")
        logger.debug(f"  Model: {settings.MODEL_NAME}")
        logger.debug(f"  Prompt length: {len(prompt)} chars")
        
        response = await client.chat.completions.create(
            model=settings.MODEL_NAME,
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": prompt}
            ],
            temperature=0.3,  # Lower temperature for more deterministic output
            max_tokens=1500,
            top_p=0.9,
        )
        
        response_text = response.choices[0].message.content
        logger.info(f"✅ LLM Response received ({len(response_text)} chars)")
        logger.debug(f"Raw response preview: {response_text[:200]}")
        
        return response_text
        
    except Exception as e:
        logger.warning(f"❌ LLM call failed (attempt {retry_count + 1}): {type(e).__name__}: {str(e)[:100]}")
        
        # Retry logic
        if retry_count < settings.LLM_MAX_RETRIES - 1:
            wait_time = settings.LLM_RETRY_DELAY_SECONDS * (2 ** retry_count)  # Exponential backoff
            logger.info(f"⏳ Retrying in {wait_time}s...")
            await asyncio.sleep(wait_time)
            return await call_llm_with_retries(breed_name, confidence, retry_count + 1)
        
        # All retries exhausted
        raise Exception(
            f"LLM failed after {settings.LLM_MAX_RETRIES} attempts: {type(e).__name__}: {str(e)}"
        )


async def get_breed_info(breed_name: str, confidence: float) -> dict:
    """
    Get breed information from cache or LLM.
    
    Args:
        breed_name: Name of the cattle breed
        confidence: Detection confidence (0-1), range [0, 1]
        
    Returns:
        dict with breed information or error details
    """
    
    # Normalize cache key
    cache_key = breed_name.strip().lower()
    logger.info(f"📋 get_breed_info called: breed={breed_name}, confidence={confidence:.2f}")
    
    async with AsyncSessionLocal() as db:
        # === CACHE CHECK ===
        logger.info(f"🔍 Checking cache for breed: {cache_key}")
        result = await db.execute(
            select(BreedCache).where(BreedCache.breed_name == cache_key)
        )
        cached = result.scalar_one_or_none()

        if cached:
            age = datetime.utcnow() - cached.cached_at
            cache_valid_days = 7
            if age < timedelta(days=cache_valid_days):
                logger.info(f"✅ Cache HIT for breed: {breed_name} (age: {age.days} days)")
                print(f"✅ Cache HIT: {breed_name}")
                return cached.breed_info
            else:
                logger.info(f"⏰ Cache EXPIRED for breed: {breed_name} (age: {age.days} days), refreshing...")
                await db.delete(cached)
                await db.commit()

        # === LLM CALL ===
        try:
            logger.info(f"🔄 Calling LLM for breed: {breed_name}")
            response_text = await call_llm_with_retries(breed_name, confidence)
        except Exception as e:
            error_msg = f"LLM API error: {str(e)[:200]}"
            logger.error(f"❌ {error_msg}")
            print(f"❌ LLM Error: {error_msg}")
            return {"error": error_msg, "breed": breed_name}

        # === JSON PARSING ===
        try:
            logger.info("📝 Parsing LLM response as JSON...")
            breed_info = extract_json_from_text(response_text)
            
            if not breed_info:
                raise ValueError("Could not extract valid JSON from response")
            
            # Validate required fields
            required_fields = ["breed", "confidence", "description", "characteristics", "care_tips"]
            missing = [f for f in required_fields if f not in breed_info]
            if missing:
                logger.warning(f"⚠️  Missing fields in response: {missing}")
            
            logger.info(f"✅ JSON parsed successfully for breed: {breed_name}")
            print(f"✅ JSON Parsed: {breed_name}")
            
        except Exception as e:
            error_msg = f"Failed to parse LLM response: {str(e)[:150]}"
            logger.error(f"❌ {error_msg}")
            logger.error(f"Raw response: {response_text[:500]}")
            print(f"❌ Parse Error: {error_msg}")
            return {
                "error": error_msg,
                "breed": breed_name,
                "raw_preview": response_text[:200]
            }

        # === CACHE SAVE ===
        try:
            logger.info(f"💾 Saving breed info to cache...")
            async with AsyncSessionLocal() as cache_db:
                new_cache = BreedCache(
                    breed_name=cache_key,
                    breed_info=breed_info,
                    cached_at=datetime.utcnow()
                )
                cache_db.add(new_cache)
                await cache_db.commit()
                logger.info(f"✅ Cached breed info for: {breed_name}")
        except Exception as e:
            logger.warning(f"⚠️  Cache save failed: {type(e).__name__}: {str(e)[:100]}, continuing anyway...")

        return breed_info

