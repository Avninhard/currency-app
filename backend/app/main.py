# backend/app/main.py
"""Główny plik aplikacji FastAPI."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import logging

from app.config import get_settings
from app.database import create_tables
from app.routers.currencies import router as currencies_router

# Konfiguracja logowania
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

settings = get_settings()

# Tworzenie aplikacji
app = FastAPI(
    title=settings.APP_TITLE,
    version=settings.APP_VERSION,
    description=settings.APP_DESCRIPTION,
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Rejestracja routerów
app.include_router(currencies_router, prefix="/api")


@app.on_event("startup")
def startup_event():
    logger.info("Uruchamianie aplikacji...")
    create_tables()
    logger.info("Tabele bazy danych utworzone/zweryfikowane")


@app.get("/api/health")
def health_check():
    return {"status": "ok", "version": settings.APP_VERSION}