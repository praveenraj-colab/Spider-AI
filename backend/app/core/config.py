from __future__ import annotations

import json
from functools import lru_cache
from typing import Annotated, Literal

from pydantic import AnyHttpUrl, Field, SecretStr, field_validator
from pydantic_settings import BaseSettings, NoDecode, SettingsConfigDict


Environment = Literal["local", "development", "staging", "production", "test"]


class Settings(BaseSettings):
    app_name: str = "Spider AI"
    app_version: str = "1.0.0"
    environment: Environment = "local"
    debug: bool = False
    api_v1_prefix: str = "/api/v1"

    database_url: str = "postgresql+asyncpg://spider:spider_password@localhost:5432/spider_ai"

    secret_key: SecretStr = Field(default=SecretStr("change-me-in-production-minimum-32-chars"))
    access_token_expire_minutes: int = 15
    refresh_token_expire_days: int = 30
    jwt_algorithm: str = "HS256"

    backend_cors_origins: Annotated[list[AnyHttpUrl | str], NoDecode] = Field(
        default_factory=lambda: ["http://localhost:3000", "http://127.0.0.1:3000"]
    )

    rate_limit_enabled: bool = True
    rate_limit_requests: int = 120
    rate_limit_window_seconds: int = 60

    log_level: str = "INFO"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    @field_validator("backend_cors_origins", mode="before")
    @classmethod
    def parse_cors_origins(cls, value: str | list[str]) -> list[str] | list[AnyHttpUrl | str]:
        if isinstance(value, str):
            value = value.strip()
            if value.startswith("["):
                parsed_value = json.loads(value)
                if not isinstance(parsed_value, list):
                    raise ValueError("BACKEND_CORS_ORIGINS must be a list of origins")
                return parsed_value
            return [origin.strip() for origin in value.split(",") if origin.strip()]
        return value


@lru_cache
def get_settings() -> Settings:
    return Settings()


def validate_production_settings(settings: Settings) -> None:
    secret = settings.secret_key.get_secret_value()
    if settings.environment == "production" and (
        secret.startswith("change-me") or len(secret) < 32
    ):
        raise RuntimeError("SECRET_KEY must be a strong secret in production.")
