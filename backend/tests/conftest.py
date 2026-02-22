"""Konfiguracja testów - fixtures i testowa baza danych."""

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from datetime import date

from app.main import app
from app.database import Base, get_db
from app.models import Currency

# Testowa baza SQLite w pamięci
SQLALCHEMY_TEST_URL = "sqlite:///./test.db"
engine = create_engine(
    SQLALCHEMY_TEST_URL, connect_args={"check_same_thread": False}
)
TestingSessionLocal = sessionmaker(
    autocommit=False, autoflush=False, bind=engine
)


@pytest.fixture(scope="function")
def db_session():
    """Tworzy czystą bazę danych dla każdego testu."""
    Base.metadata.create_all(bind=engine)
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=engine)


@pytest.fixture(scope="function")
def client(db_session):
    """Klient testowy FastAPI z podmienioną bazą danych."""
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()


@pytest.fixture
def sample_currencies(db_session):
    """Przykładowe dane walut do testów."""
    currencies = [
        Currency(
            currency_code="USD",
            currency_name="dolar amerykański",
            mid_rate=4.0215,
            rate_date=date(2024, 1, 15),
            table_number="001/A/NBP/2024"
        ),
        Currency(
            currency_code="EUR",
            currency_name="euro",
            mid_rate=4.3712,
            rate_date=date(2024, 1, 15),
            table_number="001/A/NBP/2024"
        ),
        Currency(
            currency_code="USD",
            currency_name="dolar amerykański",
            mid_rate=4.0350,
            rate_date=date(2024, 2, 15),
            table_number="033/A/NBP/2024"
        ),
        Currency(
            currency_code="EUR",
            currency_name="euro",
            mid_rate=4.3500,
            rate_date=date(2024, 2, 15),
            table_number="033/A/NBP/2024"
        ),
        Currency(
            currency_code="USD",
            currency_name="dolar amerykański",
            mid_rate=3.9800,
            rate_date=date(2024, 4, 10),
            table_number="070/A/NBP/2024"
        ),
        Currency(
            currency_code="USD",
            currency_name="dolar amerykański",
            mid_rate=3.9500,
            rate_date=date(2023, 6, 15),
            table_number="115/A/NBP/2023"
        ),
    ]
    for c in currencies:
        db_session.add(c)
    db_session.commit()
    return currencies


@pytest.fixture
def mock_nbp_response():
    return [
        {
            "table": "A",
            "no": "010/A/NBP/2024",
            "effectiveDate": "2024-01-15",
            "rates": [
                {"currency": "dolar amerykański", "code": "USD", "mid": 4.0215},
                {"currency": "euro", "code": "EUR", "mid": 4.3712},
                {"currency": "frank szwajcarski", "code": "CHF", "mid": 4.6543},
            ]
        }
    ]