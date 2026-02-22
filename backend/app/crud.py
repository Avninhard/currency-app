# backend/app/crud.py
"""Operacje CRUD na bazie danych."""

from sqlalchemy.orm import Session
from sqlalchemy import func, extract, distinct, and_
from datetime import date
from typing import List, Optional, Tuple
import logging

from app.models import Currency
from app.schemas import (
    CurrencyCreate, GroupByPeriod, 
    AggregatedRate, CurrencyListResponse
)

logger = logging.getLogger(__name__)


def get_currencies(
    db: Session,
    currency_code: Optional[str] = None,
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    page: int = 1,
    per_page: int = 50
) -> Tuple[List[Currency], int]:
    """
    Pobiera kursy walut z filtrami i paginacją.
    
    Returns:
        Tuple (lista rekordów, łączna liczba)
    """
    query = db.query(Currency)

    # Filtry
    if currency_code:
        query = query.filter(
            Currency.currency_code == currency_code.upper()
        )
    if date_from:
        query = query.filter(Currency.rate_date >= date_from)
    if date_to:
        query = query.filter(Currency.rate_date <= date_to)

    # Łączna liczba
    total = query.count()

    # Paginacja i sortowanie
    records = (
        query
        .order_by(Currency.rate_date.desc(), Currency.currency_code)
        .offset((page - 1) * per_page)
        .limit(per_page)
        .all()
    )

    return records, total


def get_currencies_by_date(
    db: Session, rate_date: date
) -> List[Currency]:
    """Pobiera wszystkie kursy z danego dnia."""
    return (
        db.query(Currency)
        .filter(Currency.rate_date == rate_date)
        .order_by(Currency.currency_code)
        .all()
    )


def get_available_currencies(db: Session) -> List[CurrencyListResponse]:
    """Pobiera listę unikalnych walut w bazie."""
    results = (
        db.query(
            Currency.currency_code,
            Currency.currency_name
        )
        .distinct()
        .order_by(Currency.currency_code)
        .all()
    )
    return [
        CurrencyListResponse(code=r[0], name=r[1]) 
        for r in results
    ]


def get_aggregated_rates(
    db: Session,
    currency_code: str,
    group_by: GroupByPeriod,
    date_from: Optional[date] = None,
    date_to: Optional[date] = None
) -> List[AggregatedRate]:
    """
    Pobiera zagregowane kursy walut wg okresu.
    
    Grupowanie:
    - year: średnie roczne
    - quarter: średnie kwartalne
    - month: średnie miesięczne
    - day: dzienne (bez agregacji)
    """
    query = db.query(Currency).filter(
        Currency.currency_code == currency_code.upper()
    )

    if date_from:
        query = query.filter(Currency.rate_date >= date_from)
    if date_to:
        query = query.filter(Currency.rate_date <= date_to)

    if group_by == GroupByPeriod.DAY:
        # Bez agregacji - zwracamy dzienne kursy
        records = query.order_by(Currency.rate_date).all()
        return [
            AggregatedRate(
                period=r.rate_date.isoformat(),
                currency_code=r.currency_code,
                avg_rate=float(r.mid_rate),
                min_rate=float(r.mid_rate),
                max_rate=float(r.mid_rate),
                count=1
            )
            for r in records
        ]

    # Budowanie wyrażenia grupowania
    if group_by == GroupByPeriod.YEAR:
        group_expr = extract('year', Currency.rate_date)
        period_expr = func.to_char(Currency.rate_date, 'YYYY')
    elif group_by == GroupByPeriod.QUARTER:
        group_expr = func.to_char(Currency.rate_date, 'YYYY-Q')
        period_expr = func.to_char(Currency.rate_date, 'YYYY-Q')
    elif group_by == GroupByPeriod.MONTH:
        group_expr = func.to_char(Currency.rate_date, 'YYYY-MM')

    results = (
        db.query(
            period_expr.label('period'),
            func.avg(Currency.mid_rate).label('avg_rate'),
            func.min(Currency.mid_rate).label('min_rate'),
            func.max(Currency.mid_rate).label('max_rate'),
            func.count(Currency.id).label('count')
        )
        .filter(Currency.currency_code == currency_code.upper())
        .group_by(period_expr)
        .order_by(period_expr)
    )

    if date_from:
        results = results.filter(Currency.rate_date >= date_from)
    if date_to:
        results = results.filter(Currency.rate_date <= date_to)

    return [
        AggregatedRate(
            period=r.period,
            currency_code=currency_code.upper(),
            avg_rate=round(float(r.avg_rate), 6),
            min_rate=round(float(r.min_rate), 6),
            max_rate=round(float(r.max_rate), 6),
            count=r.count
        )
        for r in results.all()
    ]


def save_rates(db: Session, rates: List[dict]) -> Tuple[int, int]:
    saved = 0
    skipped = 0

    for rate_data in rates:
        existing = (
            db.query(Currency)
            .filter(
                Currency.currency_code == rate_data["currency_code"],
                Currency.rate_date == rate_data["rate_date"]
            )
            .first()
        )

        if existing:
            skipped += 1
            continue

        currency = Currency(
            currency_code=rate_data["currency_code"],
            currency_name=rate_data["currency_name"],
            mid_rate=rate_data["mid_rate"],
            rate_date=rate_data["rate_date"],
            table_number=rate_data.get("table_number")
        )
        db.add(currency)
        saved += 1

    db.commit()
    logger.info(f"Zapisano {saved}, pominięto {skipped} rekordów")
    return saved, skipped


def get_date_range(db: Session) -> dict:
    result = db.query(
        func.min(Currency.rate_date),
        func.max(Currency.rate_date),
        func.count(Currency.id)
    ).first()

    return {
        "min_date": result[0].isoformat() if result[0] else None,
        "max_date": result[1].isoformat() if result[1] else None,
        "total_records": result[2]
    }