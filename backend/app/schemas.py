# backend/app/schemas.py
"""Schematy Pydantic - walidacja danych wejściowych i wyjściowych."""

from pydantic import BaseModel, Field, field_validator
from datetime import date, datetime
from typing import Optional
from enum import Enum


# ============ ENUMS ============

class GroupByPeriod(str, Enum):
    """Dostępne okresy grupowania."""
    YEAR = "year"
    QUARTER = "quarter"
    MONTH = "month"
    DAY = "day"


# ============ SCHEMATY BAZOWE ============

class CurrencyBase(BaseModel):
    """Bazowy schemat waluty."""
    currency_code: str = Field(
        ..., min_length=3, max_length=3,
        description="Trzyliterowy kod waluty (np. USD, EUR)"
    )
    currency_name: str = Field(
        ..., min_length=1, max_length=100,
        description="Pełna nazwa waluty"
    )
    mid_rate: float = Field(
        ..., gt=0,
        description="Średni kurs waluty"
    )
    rate_date: date = Field(
        ..., description="Data kursu"
    )


class CurrencyCreate(CurrencyBase):
    """Schemat do tworzenia rekordu waluty."""
    table_number: Optional[str] = None


class CurrencyResponse(CurrencyBase):
    """Schemat odpowiedzi z danymi waluty."""
    id: int
    table_number: Optional[str] = None
    created_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True


# ============ SCHEMATY FILTROWANIA ============

class CurrencyFilter(BaseModel):
    """Schemat filtrowania kursów walut."""
    currency_code: Optional[str] = Field(
        None, description="Kod waluty do filtrowania"
    )
    date_from: Optional[date] = Field(
        None, description="Data początkowa"
    )
    date_to: Optional[date] = Field(
        None, description="Data końcowa"
    )
    group_by: GroupByPeriod = Field(
        GroupByPeriod.DAY,
        description="Grupowanie wyników"
    )
    
    @field_validator('date_to')
    @classmethod
    def date_to_after_date_from(cls, v, info):
        date_from = info.data.get('date_from')
        if v and date_from and v < date_from:
            raise ValueError('date_to musi być późniejsza niż date_from')
        return v


class AggregatedRate(BaseModel):
    """Zagregowany kurs dla danego okresu."""
    period: str
    currency_code: str
    avg_rate: float
    min_rate: float
    max_rate: float
    count: int


class FetchRequest(BaseModel):
    """Żądanie pobrania danych z NBP."""
    date_from: date
    date_to: date
    table: str = Field(default="A", pattern="^[ABC]$")

    @field_validator('date_to')
    @classmethod
    def validate_dates(cls, v, info):
        date_from = info.data.get('date_from')
        if v and date_from and v < date_from:
            raise ValueError('date_to musi być późniejsza niż date_from')
        if v and date_from and (v - date_from).days > 367:
            raise ValueError('Zakres dat nie może przekraczać 367 dni')
        return v


class FetchResponse(BaseModel):
    message: str
    records_saved: int
    records_skipped: int


class CurrencyListResponse(BaseModel):
    """Lista unikalnych walut w bazie."""
    code: str
    name: str


class PaginatedResponse(BaseModel):
    data: List[CurrencyResponse]
    total: int
    page: int
    per_page: int
    total_pages: int