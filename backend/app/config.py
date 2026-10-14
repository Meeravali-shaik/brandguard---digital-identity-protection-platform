from pydantic_settings import BaseSettings
from pydantic import Field
from typing import List


class Settings(BaseSettings):
    app_name: str = "BrandGuard API"
    app_version: str = "1.0.0"
    environment: str = "development"
    debug: bool = False
    
    # Database
    database_url: str = Field(
        default="postgresql+psycopg://brandguard:brandguard_dev_password@localhost:5432/brandguard",
        validation_alias="DATABASE_URL"
    )
    
    # CORS
    cors_origins: List[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "https://*.run.app",
        "*"
    ]
    
    # Detection Engine Thresholds
    score_threshold_ignored: float = 30.0
    score_threshold_needs_review: float = 55.0
    score_threshold_medium: float = 75.0
    
    model_config = {
        "env_file": ".env",
        "extra": "ignore"
    }


settings = Settings()
