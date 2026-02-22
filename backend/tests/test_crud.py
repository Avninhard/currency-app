"""Testy operacji CRUD."""

import pytest
from datetime import date

from app.crud import (
    get_currencies, get_currencies_by_date,
    get_available_currencies, get_aggregated_rates,
    save_rates, get_date_range
)
from app.schemas import GroupByPeriod
from app.models import Currency


class TestSaveRates:
    def test_save_new_rates(self, db_session):
        rates = [
            {
                "currency_code": "USD",
                "currency_name": "dolar amerykański",
                "mid_rate": 4.05,
                "rate_date": date(2024, 3, 1),
                "table_number": "043/A/NBP/2024"
            },
            {
                "currency_code": "EUR",
                "currency_name": "euro",
                "mid_rate": 4.35,
                "rate_date": date(2024, 3, 1),
                "table_number": "043/A/NBP/2024"
            }
        ]
        saved, skipped = save_rates(db_session, rates)
        assert saved == 2
        assert skipped == 0

    def test_save_duplicate_rates(self, db_session):
        rates = [
            {
                "currency_code": "GBP",
                "currency_name": "funt szterling",
                "mid_rate": 5.10,
                "rate_date": date(2024, 3, 1),
            }
        ]
        save_rates(db_session, rates)
        saved, skipped = save_rates(db_session, rates)
        assert saved == 0
        assert skipped == 1

    def test_save_empty_list(self, db_session):
        saved, skipped = save_rates(db_session, [])
        assert saved == 0
        assert skipped == 0

    def test_save_mixed_new_and_duplicate(self, db_session):
        rates1 = [
            {
                "currency_code": "USD",
                "currency_name": "dolar",
                "mid_rate": 4.0,
                "rate_date": date(2024, 5, 1),
            }
        ]
        save_rates(db_session, rates1)

        rates2 = [
            {
                "currency_code": "USD",
                "currency_name": "dolar",
                "mid_rate": 4.0,
                "rate_date": date(2024, 5, 1),
            },
            {
                "currency_code": "EUR",
                "currency_name": "euro",
                "mid_rate": 4.3,
                "rate_date": date(2024, 5, 1),
            }
        ]
        saved, skipped = save_rates(db_session, rates2)
        assert saved == 1
        assert skipped == 1


class TestGetCurrencies:
    def test_get_all(self, db_session, sample_currencies):
        records, total = get_currencies(db_session)
        assert total == 6
        assert len(records) == 6

    def test_get_filtered_by_code(self, db_session, sample_currencies):
        records, total = get_currencies(db_session, currency_code="EUR")
        assert total == 2
        for r in records:
            assert r.currency_code == "EUR"

    def test_get_filtered_by_date_range(self, db_session, sample_currencies):
        records, total = get_currencies(
            db_session,
            date_from=date(2024, 1, 1),
            date_to=date(2024, 1, 31)
        )
        assert total == 2

    def test_get_with_pagination(self, db_session, sample_currencies):
        records, total = get_currencies(db_session, page=1, per_page=3)
        assert len(records) == 3
        assert total == 6

    def test_get_empty_result(self, db_session):
        records, total = get_currencies(db_session, currency_code="XYZ")
        assert total == 0
        assert records == []


class TestGetCurrenciesByDate:
    def test_existing_date(self, db_session, sample_currencies):
        records = get_currencies_by_date(db_session, date(2024, 1, 15))
        assert len(records) == 2

    def test_nonexistent_date(self, db_session, sample_currencies):
        records = get_currencies_by_date(db_session, date(2024, 12, 25))
        assert len(records) == 0


class TestGetAvailableCurrencies:
    def test_available(self, db_session, sample_currencies):
        result = get_available_currencies(db_session)
        codes = [r.code for r in result]
        assert "USD" in codes
        assert "EUR" in codes
        assert len(codes) == 2

    def test_available_empty(self, db_session):
        result = get_available_currencies(db_session)
        assert result == []


class TestGetAggregatedRates:
    def test_aggregate_by_day(self, db_session, sample_currencies):
        result = get_aggregated_rates(
            db_session, "USD", GroupByPeriod.DAY
        )
        assert len(result) == 4
        assert result[0].count == 1

    def test_aggregate_by_month(self, db_session, sample_currencies):
        result = get_aggregated_rates(
            db_session, "USD", GroupByPeriod.MONTH
        )
        assert len(result) >= 3

    def test_aggregate_by_year(self, db_session, sample_currencies):
        result = get_aggregated_rates(
            db_session, "USD", GroupByPeriod.YEAR
        )
        assert len(result) == 2

    def test_aggregate_with_date_filter(self, db_session, sample_currencies):
        result = get_aggregated_rates(
            db_session, "USD", GroupByPeriod.DAY,
            date_from=date(2024, 1, 1),
            date_to=date(2024, 3, 1)
        )
        assert len(result) == 2

    def test_aggregate_nonexistent_currency(self, db_session, sample_currencies):
        result = get_aggregated_rates(
            db_session, "XYZ", GroupByPeriod.MONTH
        )
        assert result == []


class TestGetDateRange:
    def test_date_range(self, db_session, sample_currencies):
        result = get_date_range(db_session)
        assert result["min_date"] == "2023-06-15"
        assert result["max_date"] == "2024-04-10"
        assert result["total_records"] == 6

    def test_date_range_empty(self, db_session):
        result = get_date_range(db_session)
        assert result["min_date"] is None
        assert result["total_records"] == 0