"""Konfiguracja aplikacji - zmienne środowiskowe i ustawienia."""

from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    """Główne ustawienia aplikacji."""
    
    # Baza danych
    DATABASE_URL: str = "postgresql://postgres:postgres@db:5432/currency_db"
    
    # API NBP
    NBP_API_BASE_URL: str = "https://api.nbp.pl/api"
    
    # Aplikacja
    APP_TITLE: str = "Currency Exchange Rates API"
    APP_VERSION: str = "1.0.0"
    APP_DESCRIPTION: str = "API do pobierania i wyświetlania kursów walut NBP"
    
    # CORS
    ALLOWED_ORIGINS: list[str] = [
        "http://localhost:4200",
        "http://localhost:80",
        "http://frontend:80"
    ]
    
    # Tryb testowy
    TESTING: bool = False
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


@lru_cache()
def get_settings() -> Settings:
    """Singleton dla ustawień."""
    return Settings()