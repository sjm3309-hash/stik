from pydantic_settings import BaseSettings
from functools import lru_cache
from dotenv import load_dotenv
import os
from pathlib import Path

# .env 파일 절대 경로로 명시적 로드
env_path = Path(__file__).parent / ".env"
load_dotenv(dotenv_path=env_path)

# 디버그: 환경 변수 로드 확인
print(f"[DEBUG] SUPABASE_URL: {os.getenv('SUPABASE_URL')}")
print(f"[DEBUG] SUPABASE_SERVICE_KEY loaded: {'Yes' if os.getenv('SUPABASE_SERVICE_KEY') else 'No'}")


class Settings(BaseSettings):
    """Application settings"""
    
    # Supabase
    supabase_url: str = os.getenv("SUPABASE_URL", "")
    supabase_service_key: str = os.getenv("SUPABASE_SERVICE_KEY", "")
    
    # Firebase
    firebase_credentials_path: str = os.getenv("FIREBASE_CREDENTIALS_PATH", "./firebase-service-account.json")
    
    # App
    environment: str = os.getenv("ENVIRONMENT", "development")
    log_level: str = os.getenv("LOG_LEVEL", "INFO")
    
    # Stock data settings
    max_alerts_free: int = 1
    max_alerts_premium: int = 100
    
    # Scheduler settings
    check_interval_minutes: int = 1  # 1분마다 체크
    
    class Config:
        env_file = ".env"
        case_sensitive = False


@lru_cache()
def get_settings() -> Settings:
    """Get cached settings instance"""
    return Settings()
