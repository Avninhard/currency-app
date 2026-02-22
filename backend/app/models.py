"""Modele SQLAlchemy - definicja tabel w bazie danych."""

from sqlalchemy import (
    Column, Integer, String, Numeric, 
    Date, DateTime, UniqueConstraint
)
from sqlalchemy.sql import func
from app.database import Base


class Currency(Base):
    """
    Model tabeli currencies.
    Przechowuje kursy walut pobrane z API NBP.
    """
    __tablename__ = "currencies"
    
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    currency_code = Column(String(3), nullable=False, index=True)
    currency_name = Column(String(100), nullable=False)
    mid_rate = Column(Numeric(10, 6), nullable=False)
    rate_date = Column(Date, nullable=False, index=True)
    table_number = Column(String(20), nullable=True)
    created_at = Column(DateTime, server_default=func.now())
    
    # Ograniczenie unikalności
    __table_args__ = (
        UniqueConstraint(
            'currency_code', 'rate_date', 
            name='uq_currency_code_date'
        ),
    )
    
    def __repr__(self):
        return (
            f"<Currency(code={self.currency_code}, "
            f"rate={self.mid_rate}, date={self.rate_date})>"
        )
    
    def to_dict(self):
        """Konwersja modelu do słownika."""
        return {
            "id": self.id,
            "currency_code": self.currency_code,
            "currency_name": self.currency_name,
            "mid_rate": float(self.mid_rate),
            "rate_date": self.rate_date.isoformat(),
            "table_number": self.table_number
        }