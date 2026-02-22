"""Implementacja kroków BDD dla testów kursów walut."""

import pytest
from pytest_bdd import scenarios, given, when, then, parsers
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from datetime import date
from unittest.mock import patch, AsyncMock

from app.main import app
from app.database import Base, get_db
from app.models import Currency

# Ładowanie scenariuszy
scenarios("../currencies.feature")

# Testowa baza danych
SQLALCHEMY_TEST_URL = "sqlite:///./test_bdd.db"
engine = create_engine(
    SQLALCHEMY_TEST_URL, connect_args={"check_same_thread": False}
)
TestSession = sessionmaker(autocommit=False, autoflush=False, bind=engine)


# ============ FIXTURES ============

@pytest.fixture
def db():
    Base.metadata.create_all(bind=engine)
    session = TestSession()
    yield session
    session.close()
    Base.metadata.drop_all(bind=engine)


@pytest.fixture
def api_client(db):
    def override():
        try:
            yield db
        finally:
            pass
    app.dependency_overrides[get_db] = override
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()


@pytest.fixture
def context():
    """Współdzielony kontekst między krokami."""
    return {}


# ============ HELPER ============

def _insert_sample_rates(db, rate_date_str: str):
    """Wstawia przykładowe kursy dla danej daty."""
    d = date.fromisoformat(rate_date_str)
    rates = [
        Currency(
            currency_code="USD",
            currency_name="dolar amerykański",
            mid_rate=4.0215,
            rate_date=d,
            table_number=f"test/{d.isoformat()}"
        ),
        Currency(
            currency_code="EUR",
            currency_name="euro",
            mid_rate=4.3712,
            rate_date=d,
            table_number=f"test/{d.isoformat()}"
        ),
    ]
    for r in rates:
        existing = (
            db.query(Currency)
            .filter(Currency.currency_code == r.currency_code,
                    Currency.rate_date == r.rate_date)
            .first()
        )
        if not existing:
            db.add(r)
    db.commit()


# ============ GIVEN ============

@given("baza danych jest pusta")
def db_is_empty(db):
    db.query(Currency).delete()
    db.commit()


@given(parsers.parse('w bazie istnieją kursy z dnia "{rate_date}"'))
def rates_exist_for_date(db, rate_date):
    _insert_sample_rates(db, rate_date)


# ============ WHEN ============

@when(
    parsers.parse(
        'wysyłam żądanie pobrania kursów z dnia "{date_from}" do "{date_to}"'
    ),
    target_fixture="context"
)
def fetch_rates_from_nbp(api_client, context, date_from, date_to):
    with patch("app.routers.currencies.nbp_service") as mock_svc:
        d = date.fromisoformat(date_from)
        mock_svc.fetch_rates_for_range = AsyncMock(return_value=[
            {
                "currency_code": "USD",
                "currency_name": "dolar amerykański",
                "mid_rate": 4.05,
                "rate_date": d,
                "table_number": "test"
            }
        ])
        response = api_client.post("/api/currencies/fetch", json={
            "date_from": date_from,
            "date_to": date_to,
            "table": "A"
        })
    context["response"] = response
    return context


@when(
    parsers.parse('pobieram kursy z dnia "{rate_date}"'),
    target_fixture="context"
)
def get_rates_by_date(api_client, context, rate_date):
    response = api_client.get(f"/api/currencies/{rate_date}")
    context["response"] = response
    return context


@when(
    parsers.parse('pobieram listę kursów z filtrem waluty "{code}"'),
    target_fixture="context"
)
def get_rates_filtered(api_client, context, code):
    response = api_client.get(f"/api/currencies/?currency_code={code}")
    context["response"] = response
    return context


@when(
    parsers.parse(
        'pobieram zagregowane kursy "{code}" grupowane po "{group_by}"'
    ),
    target_fixture="context"
)
def get_aggregated(api_client, context, code, group_by):
    response = api_client.get(
        f"/api/currencies/aggregated?currency_code={code}&group_by={group_by}"
    )
    context["response"] = response
    return context


@when("pobieram listę dostępnych walut", target_fixture="context")
def get_available(api_client, context):
    response = api_client.get("/api/currencies/available")
    context["response"] = response
    return context


@when(
    parsers.parse(
        "pobieram listę kursów ze stroną {page:d} i limitem {limit:d}"
    ),
    target_fixture="context"
)
def get_paginated(api_client, context, page, limit):
    response = api_client.get(
        f"/api/currencies/?page={page}&per_page={limit}"
    )
    context["response"] = response
    return context


@when("pobieram zakres dat", target_fixture="context")
def get_date_range(api_client, context):
    response = api_client.get("/api/currencies/date-range")
    context["response"] = response
    return context


# ============ THEN ============

@then(parsers.parse("odpowiedź ma status {status:d}"))
def check_status(context, status):
    assert context["response"].status_code == status


@then(parsers.parse('odpowiedź zawiera pole "{field}"'))
def check_field_exists(context, field):
    data = context["response"].json()
    assert field in data


@then("lista kursów nie jest pusta")
def check_list_not_empty(context):
    data = context["response"].json()
    assert len(data) > 0


@then(parsers.parse('wszystkie zwrócone kursy mają kod "{code}"'))
def check_all_codes(context, code):
    data = context["response"].json()
    for record in data["data"]:
        assert record["currency_code"] == code


@then(parsers.parse("wynik zawiera co najmniej {count:d} okresy"))
def check_min_periods(context, count):
    data = context["response"].json()
    assert len(data) >= count


@then(parsers.parse('lista zawiera walutę "{code}"'))
def check_currency_in_list(context, code):
    data = context["response"].json()
    codes = [c["code"] for c in data]
    assert code in codes


@then(parsers.parse("zwrócono dokładnie {count:d} rekordy"))
def check_exact_count(context, count):
    data = context["response"].json()
    assert len(data["data"]) == count


@then("odpowiedź zawiera informację o łącznej liczbie stron")
def check_total_pages(context):
    data = context["response"].json()
    assert "total_pages" in data
    assert data["total_pages"] > 0