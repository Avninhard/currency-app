"""Testy endpointów API."""

import pytest
from datetime import date
from unittest.mock import patch, AsyncMock


class TestHealthCheck:
    def test_health_check(self, client):
        response = client.get("/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "ok"
        assert "version" in data


class TestListCurrencies:
    def test_list_empty(self, client):
        response = client.get("/api/currencies/")
        assert response.status_code == 200
        data = response.json()
        assert data["data"] == []
        assert data["total"] == 0

    def test_list_with_data(self, client, sample_currencies):
        response = client.get("/api/currencies/")
        assert response.status_code == 200
        data = response.json()
        assert data["total"] == 6
        assert len(data["data"]) == 6

    def test_filter_by_currency_code(self, client, sample_currencies):
        response = client.get("/api/currencies/?currency_code=USD")
        assert response.status_code == 200
        data = response.json()
        assert data["total"] == 4
        for record in data["data"]:
            assert record["currency_code"] == "USD"

    def test_filter_by_date_range(self, client, sample_currencies):
        response = client.get(
            "/api/currencies/?date_from=2024-01-01&date_to=2024-01-31"
        )
        assert response.status_code == 200
        data = response.json()
        assert data["total"] == 2

    def test_pagination(self, client, sample_currencies):
        response = client.get("/api/currencies/?page=1&per_page=2")
        assert response.status_code == 200
        data = response.json()
        assert len(data["data"]) == 2
        assert data["total"] == 6
        assert data["total_pages"] == 3
        assert data["page"] == 1

    def test_pagination_page_2(self, client, sample_currencies):
        response = client.get("/api/currencies/?page=2&per_page=2")
        data = response.json()
        assert len(data["data"]) == 2
        assert data["page"] == 2


class TestGetByDate:
    def test_get_existing_date(self, client, sample_currencies):
        response = client.get("/api/currencies/2024-01-15")
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 2
        codes = [r["currency_code"] for r in data]
        assert "USD" in codes
        assert "EUR" in codes

    def test_get_nonexistent_date(self, client, sample_currencies):
        response = client.get("/api/currencies/2024-12-25")
        assert response.status_code == 404

    def test_invalid_date_format(self, client):
        response = client.get("/api/currencies/not-a-date")
        assert response.status_code == 422


class TestAvailableCurrencies:
    def test_available_empty(self, client):
        response = client.get("/api/currencies/available")
        assert response.status_code == 200
        assert response.json() == []

    def test_available_with_data(self, client, sample_currencies):
        response = client.get("/api/currencies/available")
        assert response.status_code == 200
        data = response.json()
        codes = [c["code"] for c in data]
        assert "USD" in codes
        assert "EUR" in codes
        assert len(codes) == 2


class TestDateRange:
    def test_date_range_empty(self, client):
        response = client.get("/api/currencies/date-range")
        assert response.status_code == 200
        data = response.json()
        assert data["total_records"] == 0

    def test_date_range_with_data(self, client, sample_currencies):
        response = client.get("/api/currencies/date-range")
        data = response.json()
        assert data["min_date"] == "2023-06-15"
        assert data["max_date"] == "2024-04-10"
        assert data["total_records"] == 6


class TestAggregated:
    def test_aggregated_by_month(self, client, sample_currencies):
        response = client.get(
            "/api/currencies/aggregated?currency_code=USD&group_by=month"
        )
        assert response.status_code == 200
        data = response.json()
        assert len(data) >= 2
        for item in data:
            assert "period" in item
            assert "avg_rate" in item
            assert "min_rate" in item
            assert "max_rate" in item

    def test_aggregated_by_year(self, client, sample_currencies):
        response = client.get(
            "/api/currencies/aggregated?currency_code=USD&group_by=year"
        )
        assert response.status_code == 200
        data = response.json()
        years = [d["period"] for d in data]
        assert "2023" in years
        assert "2024" in years

    def test_aggregated_by_day(self, client, sample_currencies):
        response = client.get(
            "/api/currencies/aggregated?currency_code=USD&group_by=day"
        )
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 4

    def test_aggregated_nonexistent_currency(self, client, sample_currencies):
        response = client.get(
            "/api/currencies/aggregated?currency_code=XYZ&group_by=month"
        )
        assert response.status_code == 404

    def test_aggregated_with_date_filter(self, client, sample_currencies):
        response = client.get(
            "/api/currencies/aggregated"
            "?currency_code=USD&group_by=day"
            "&date_from=2024-01-01&date_to=2024-03-01"
        )
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 2


class TestFetchFromNBP:
    @patch("app.routers.currencies.nbp_service")
    def test_fetch_success(self, mock_service, client):
        mock_service.fetch_rates_for_range = AsyncMock(return_value=[
            {
                "currency_code": "USD",
                "currency_name": "dolar amerykański",
                "mid_rate": 4.05,
                "rate_date": date(2024, 3, 1),
                "table_number": "043/A/NBP/2024"
            }
        ])

        response = client.post("/api/currencies/fetch", json={
            "date_from": "2024-03-01",
            "date_to": "2024-03-01",
            "table": "A"
        })
        assert response.status_code == 200
        data = response.json()
        assert data["records_saved"] == 1

    @patch("app.routers.currencies.nbp_service")
    def test_fetch_empty_response(self, mock_service, client):
        mock_service.fetch_rates_for_range = AsyncMock(return_value=[])

        response = client.post("/api/currencies/fetch", json={
            "date_from": "2024-12-25",
            "date_to": "2024-12-25",
            "table": "A"
        })
        assert response.status_code == 200
        data = response.json()
        assert data["records_saved"] == 0

    @patch("app.routers.currencies.nbp_service")
    def test_fetch_duplicate_skipped(self, mock_service, client, sample_currencies):
        mock_service.fetch_rates_for_range = AsyncMock(return_value=[
            {
                "currency_code": "USD",
                "currency_name": "dolar amerykański",
                "mid_rate": 4.0215,
                "rate_date": date(2024, 1, 15),
                "table_number": "001/A/NBP/2024"
            }
        ])

        response = client.post("/api/currencies/fetch", json={
            "date_from": "2024-01-15",
            "date_to": "2024-01-15",
            "table": "A"
        })
        data = response.json()
        assert data["records_saved"] == 0
        assert data["records_skipped"] == 1

    def test_fetch_invalid_dates(self, client):
        response = client.post("/api/currencies/fetch", json={
            "date_from": "2024-03-15",
            "date_to": "2024-03-01",
            "table": "A"
        })
        assert response.status_code == 422

    def test_fetch_invalid_table(self, client):
        response = client.post("/api/currencies/fetch", json={
            "date_from": "2024-03-01",
            "date_to": "2024-03-15",
            "table": "Z"
        })
        assert response.status_code == 422