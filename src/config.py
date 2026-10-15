"""
Configuration module for ShopSphere Support Agent.
"""
import os
from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    # API & Model Configuration
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    GEMINI_MODEL: str = os.getenv("GEMINI_MODEL", "gemini-3.8-flash")
    
    # Feature Flags & Safety Controls
    AUTO_REFUND_ENABLED: bool = os.getenv("AUTO_REFUND_ENABLED", "true").lower() in ("true", "1", "yes")
    
    # Paths & Persistence
    BASE_DIR: Path = Path(__file__).resolve().parent.parent
    DATA_DIR: Path = Path(os.getenv("DATA_DIR", "shopsphere_data"))
    DB_PATH: Path = Path(os.getenv("DB_PATH", "shopsphere.db"))

    def get_data_dir(self) -> Path:
        if self.DATA_DIR.is_absolute() and self.DATA_DIR.exists():
            return self.DATA_DIR
        local_path = self.BASE_DIR / "shopsphere_data"
        if local_path.exists():
            return local_path
        return self.DATA_DIR

    def get_db_path(self) -> Path:
        try:
            self.DB_PATH.parent.mkdir(parents=True, exist_ok=True)
            return self.DB_PATH
        except (PermissionError, OSError):
            return self.BASE_DIR / "shopsphere.db"
    
    # Prompt & Agent Versions
    PROMPT_VERSION: str = os.getenv("PROMPT_VERSION", "v1")
    AGENT_VERSION: str = os.getenv("AGENT_VERSION", "v1")
    
    # Fixed Reference Date for ShopSphere Test (NEVER use system clock)
    FIXED_TODAY_DATE: str = "2026-10-01"
    
    # Observability & Tracing
    OTEL_EXPORTER_OTLP_ENDPOINT: str = os.getenv("OTEL_EXPORTER_OTLP_ENDPOINT", "http://localhost:4318")
    TRACING_ENABLED: bool = os.getenv("TRACING_ENABLED", "true").lower() in ("true", "1", "yes")
    
    # Offline Replay / Caching
    REPLAY_FILE: str = os.getenv("REPLAY_FILE", "")
    RECORD_FILE: str = os.getenv("RECORD_FILE", "")

settings = Settings()
