"""Konfiguracja połączenia z bazą danych SQLAlchemy."""

from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from typing import Generator

from app.config import get_settings

settings = get_settings()

# Silnik bazy danych
engine = create_engine(
    settings.DATABASE_URL,
    pool_pre_ping=True,        # Sprawdzanie połączenia przed użyciem
    pool_size=10,               # Rozmiar puli połączeń
    max_overflow=20,            # Maksymalna liczba dodatkowych połączeń
    echo=False                  # Logowanie SQL (True dla debugowania)
)

# Fabryka sesji
SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

# Klasa bazowa dla modeli
Base = declarative_base()


def get_db() -> Generator[Session, None, None]:
    """
    Dependency injection dla sesji bazy danych.
    Zapewnia automatyczne zamknięcie sesji po zakończeniu żądania.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def create_tables():
    """Tworzy wszystkie tabele w bazie danych."""
    Base.metadata.create_all(bind=engine)