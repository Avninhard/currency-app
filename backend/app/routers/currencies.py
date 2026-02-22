"""Endpointy API do obsługi kursów walut."""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from datetime import date
from typing import Optional, List
import math

from app.database import get_db
from app.schemas import (
    CurrencyResponse, FetchRequest, FetchResponse,
    CurrencyListResponse, AggregatedRate, GroupByPeriod,
    PaginatedResponse
)
from app.crud import (
    get_currencies, get_currencies_by_date,
    get_available_currencies, get_aggregated_rates,
    save_rates, get_date_range
)
from app.services.nbp_service import nbp_service, NBPApiError

router = APIRouter(prefix="/currencies", tags=["currencies"])


@router.get("/", response_model=PaginatedResponse)
def list_currencies(
    currency_code: Optional[str] = Query(None, description="Kod waluty np. USD"),
    date_from: Optional[date] = Query(None, description="Data od"),
    date_to: Optional[date] = Query(None, description="Data do"),
    page: int = Query(1, ge=1, description="Numer strony"),
    per_page: int = Query(50, ge=1, le=200, description="Rekordów na stronę"),
    db: Session = Depends(get_db)
):
    """Zwraca listę kursów walut z filtrowaniem i paginacją."""
    records, total = get_currencies(
        db, currency_code, date_from, date_to, page, per_page
    )
    return PaginatedResponse(
        data=[CurrencyResponse.model_validate(r) for r in records],
        total=total,
        page=page,
        per_page=per_page,
        total_pages=math.ceil(total / per_page) if total > 0 else 0
    )


@router.get("/available", response_model=List[CurrencyListResponse])
def list_available_currencies(db: Session = Depends(get_db)):
    """Zwraca listę unikalnych walut dostępnych w bazie."""
    return get_available_currencies(db)


@router.get("/date-range")
def get_available_date_range(db: Session = Depends(get_db)):
    """Zwraca zakres dat dostępnych w bazie."""
    return get_date_range(db)


@router.get("/aggregated", response_model=List[AggregatedRate])
def get_aggregated(
    currency_code: str = Query(..., description="Kod waluty"),
    group_by: GroupByPeriod = Query(GroupByPeriod.MONTH, description="Grupowanie"),
    date_from: Optional[date] = Query(None),
    date_to: Optional[date] = Query(None),
    db: Session = Depends(get_db)
):
    """Zwraca zagregowane kursy walut wg okresu (rok/kwartał/miesiąc/dzień)."""
    results = get_aggregated_rates(
        db, currency_code, group_by, date_from, date_to
    )
    if not results:
        raise HTTPException(
            status_code=404,
            detail=f"Brak danych dla waluty {currency_code}"
        )
    return results


@router.get("/{rate_date}", response_model=List[CurrencyResponse])
def get_by_date(
    rate_date: date,
    db: Session = Depends(get_db)
):
    """Zwraca kursy walut z wybranej daty."""
    records = get_currencies_by_date(db, rate_date)
    if not records:
        raise HTTPException(
            status_code=404,
            detail=f"Brak kursów dla daty {rate_date}"
        )
    return [CurrencyResponse.model_validate(r) for r in records]


@router.post("/fetch", response_model=FetchResponse)
async def fetch_from_nbp(
    request: FetchRequest,
    db: Session = Depends(get_db)
):
    """Pobiera kursy walut z API NBP i zapisuje do bazy danych."""
    try:
        rates = await nbp_service.fetch_rates_for_range(
            request.date_from, request.date_to, request.table
        )

        if not rates:
            return FetchResponse(
                message="Brak danych z API NBP dla podanego zakresu",
                records_saved=0,
                records_skipped=0
            )

        saved, skipped = save_rates(db, rates)

        return FetchResponse(
            message=f"Pobrano dane z API NBP",
            records_saved=saved,
            records_skipped=skipped
        )

    except NBPApiError as e:
        raise HTTPException(status_code=502, detail=str(e.message))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/fetch-current", response_model=FetchResponse)
async def fetch_current_from_nbp(
    db: Session = Depends(get_db)
):
    """Pobiera aktualne kursy walut z API NBP."""
    try:
        rates = await nbp_service.fetch_current_rates()
        saved, skipped = save_rates(db, rates)

        return FetchResponse(
            message="Pobrano aktualne kursy",
            records_saved=saved,
            records_skipped=skipped
        )
    except NBPApiError as e:
        raise HTTPException(status_code=502, detail=str(e.message))