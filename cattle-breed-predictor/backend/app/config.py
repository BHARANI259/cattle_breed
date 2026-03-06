from pathlib import Path
from pydantic_settings import BaseSettings
from functools import lru_cache

# Always resolves to backend/ regardless of launch directory
BASE_DIR = Path(__file__).resolve().parent.parent


class Settings(BaseSettings):
    """Application configuration settings."""
    
    # Database
    DATABASE_URL: str = "postgresql+asyncpg://postgres:password@localhost:5432/cattle_db"
    
    # File paths (relative paths are resolved relative to BASE_DIR)
    UPLOAD_DIR: str = str(BASE_DIR / "uploads")
    MODEL_PATH: str = str(BASE_DIR / "best.pt")
    
    # Ollama LLM settings
    OLLAMA_BASE_URL: str = "http://localhost:11434"
    OLLAMA_MODEL: str = "llama3.2"
    
    # CORS
    ALLOWED_ORIGINS: list = ["http://localhost:5173"]
    
    class Config:
        env_file = str(BASE_DIR / ".env")
        case_sensitive = True


@lru_cache
def get_settings() -> Settings:
    """Get cached settings instance."""
    return Settings()


settings = get_settings()
