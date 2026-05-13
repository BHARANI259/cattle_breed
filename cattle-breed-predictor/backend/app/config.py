from pathlib import Path
from pydantic_settings import BaseSettings

# Resolves to backend/ regardless of where uvicorn is launched from
BASE_DIR = Path(__file__).resolve().parent.parent


class Settings(BaseSettings):
    DATABASE_URL: str
    UPLOAD_DIR: str = str(BASE_DIR / "uploads")
    MODEL_PATH: str = str(BASE_DIR / "best.pt")
    
    # Hugging Face integration via OpenAI Router
    HF_TOKEN: str
    MODEL_NAME: str = "Qwen/Qwen2.5-72B-Instruct"
    HF_ROUTER_BASE_URL: str = "https://router.huggingface.co/v1"
    
    # API Configuration
    ALLOWED_ORIGINS: str = "http://localhost:5173"
    
    # LLM Configuration
    LLM_TIMEOUT_SECONDS: int = 180
    LLM_MAX_RETRIES: int = 3
    LLM_RETRY_DELAY_SECONDS: int = 2

    class Config:
        env_file = str(BASE_DIR / ".env")


settings = Settings()


