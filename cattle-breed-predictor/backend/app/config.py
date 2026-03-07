from pathlib import Path
from pydantic_settings import BaseSettings

# Resolves to backend/ regardless of where uvicorn is launched from
BASE_DIR = Path(__file__).resolve().parent.parent


class Settings(BaseSettings):
    DATABASE_URL: str
    UPLOAD_DIR: str = str(BASE_DIR / "uploads")
    MODEL_PATH: str = str(BASE_DIR / "best.pt")
    OLLAMA_BASE_URL: str = "http://localhost:11434"
    OLLAMA_MODEL: str = "llama3.2:3b"
    ALLOWED_ORIGINS: str = "http://localhost:5173"

    class Config:
        env_file = str(BASE_DIR / ".env")


settings = Settings()


