# backend/app/core/config.py
from typing import List, Union
from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict
import json


class Settings(BaseSettings):
    """Application settings loaded from environment variables and .env file."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )

    PROJECT_NAME: str = "Internship Intelligence Engine"
    API_V1_STR: str = "/api/v1"
    ENVIRONMENT: str = "development"
    LOG_LEVEL: str = "INFO"

    # Database connection string (default to local PostgreSQL with psycopg3)
    DATABASE_URL: str = "postgresql+psycopg://postgres:postgres@localhost:5432/internships"

    # Crawler Settings
    CRAWLER_USER_AGENT: str = "InternshipIntelBot/1.0 (+https://github.com/internship-intel; contact@example.com)"
    CRAWLER_REQUEST_TIMEOUT_SECONDS: float = 20.0
    CRAWLER_MAX_CONCURRENCY: int = 5

    # CORS configuration for Vite frontend
    CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
    ]

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str) and not v.startswith("["):
            return [i.strip() for i in v.split(",")]
        elif isinstance(v, str) and v.startswith("["):
            try:
                parsed = json.loads(v)
                if isinstance(parsed, list):
                    return [str(item) for item in parsed]
            except Exception:
                pass
        return v  # type: ignore[return-value]


settings = Settings()
