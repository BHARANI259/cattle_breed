import asyncio
import httpx

async def test():
    async with httpx.AsyncClient(timeout=60.0) as client:
        try:
            r = await client.post(
                "http://localhost:11434/api/generate",
                json={
                    "model": "llama3.2:3b",
                    "prompt": "say hello",
                    "stream": False
                }
            )
            print(f"Status: {r.status_code}")
            print(f"Response: {r.text[:500]}")
        except Exception as e:
            print(f"Error: {type(e).__name__}: {e}")

asyncio.run(test())