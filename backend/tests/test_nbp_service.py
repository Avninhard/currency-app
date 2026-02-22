"""Testy serwisu NBP API."""

import pytest
from unittest.mock import AsyncMock, patch, MagicMock
from datetime import date
import httpx

from app.services.nbp_service import NBPService, NBPApiError


@pytest.fixture
def nbp_service():
    return NBPService(base_url="https://api.nbp.pl/api")


@pytest.fixture
def mock_nbp_table_response():
    return [
        {
            "table": "A",
            "no": "010/A/NBP/2024",
            "effectiveDate": "2024-01-15",
            "rates": [
                {"currency": "dolar amerykański", "code": "USD", "mid": 4.0215},
                {"currency": "euro", "code": "EUR", "mid": 4.3712},
            ]
        }
    ]


class TestParseResponse:
    def test_parse_valid(self, nbp_service, mock_nbp_table_response):
        result = nbp_service._parse_table_response(
            mock_nbp_table_response, date(2024, 1, 15)
        )
        assert len(result) == 2
        assert result[0]["currency_code"] == "USD"
        assert result[0]["mid_rate"] == 4.0215
        assert result[0]["rate_date"] == date(2024, 1, 15)
        assert result[0]["table_number"] == "010/A/NBP/2024"
        assert result[1]["currency_code"] == "EUR"
        assert result[1]["mid_rate"] == 4.3712

    def test_parse_empty(self, nbp_service):
        result = nbp_service._parse_table_response([], date(2024, 1, 15))
        assert result == []

    def test_parse_multiple_tables(self, nbp_service):
        data = [
            {
                "table": "A", "no": "001", "effectiveDate": "2024-01-15",
                "rates": [{"currency": "dolar", "code": "USD", "mid": 4.0}]
            },
            {
                "table": "A", "no": "002", "effectiveDate": "2024-01-16",
                "rates": [{"currency": "dolar", "code": "USD", "mid": 4.1}]
            }
        ]
        result = nbp_service._parse_table_response(data, date(2024, 1, 15))
        assert len(result) == 2


class TestFetchRatesForDate:
    @pytest.mark.asyncio
    async def test_fetch_success(self, nbp_service, mock_nbp_table_response):
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = mock_nbp_table_response
        mock_response.raise_for_status = MagicMock()

        with patch("httpx.AsyncClient") as mock_client_class:
            mock_client = AsyncMock()
            mock_client.get.return_value = mock_response
            mock_client.__aenter__ = AsyncMock(return_value=mock_client)
            mock_client.__aexit__ = AsyncMock(return_value=False)
            mock_client_class.return_value = mock_client

            result = await nbp_service.fetch_rates_for_date(date(2024, 1, 15))
            assert len(result) == 2
            assert result[0]["currency_code"] == "USD"

    @pytest.mark.asyncio
    async def test_fetch_404_returns_empty(self, nbp_service):
        mock_response = MagicMock()
        mock_response.status_code = 404

        with patch("httpx.AsyncClient") as mock_client_class:
            mock_client = AsyncMock()
            mock_client.get.return_value = mock_response
            mock_client.__aenter__ = AsyncMock(return_value=mock_client)
            mock_client.__aexit__ = AsyncMock(return_value=False)
            mock_client_class.return_value = mock_client

            result = await nbp_service.fetch_rates_for_date(date(2024, 12, 25))
            assert result == []

    @pytest.mark.asyncio
    async def test_fetch_500_raises_error(self, nbp_service):
        mock_response = MagicMock()
        mock_response.status_code = 500
        mock_response.raise_for_status.side_effect = httpx.HTTPStatusError(
            "Server Error",
            request=MagicMock(),
            response=MagicMock(status_code=500)
        )

        with patch("httpx.AsyncClient") as mock_client_class:
            mock_client = AsyncMock()
            mock_client.get.return_value = mock_response
            mock_client.__aenter__ = AsyncMock(return_value=mock_client)
            mock_client.__aexit__ = AsyncMock(return_value=False)
            mock_client_class.return_value = mock_client

            with pytest.raises(NBPApiError):
                await nbp_service.fetch_rates_for_date(date(2024, 1, 15))

    @pytest.mark.asyncio
    async def test_fetch_connection_error(self, nbp_service):
        with patch("httpx.AsyncClient") as mock_client_class:
            mock_client = AsyncMock()
            mock_client.get.side_effect = httpx.RequestError("Connection failed")
            mock_client.__aenter__ = AsyncMock(return_value=mock_client)
            mock_client.__aexit__ = AsyncMock(return_value=False)
            mock_client_class.return_value = mock_client

            with pytest.raises(NBPApiError) as exc_info:
                await nbp_service.fetch_rates_for_date(date(2024, 1, 15))
            assert "Connection failed" in str(exc_info.value)


class TestFetchCurrentRates:
    @pytest.mark.asyncio
    async def test_fetch_current_success(
        self, nbp_service, mock_nbp_table_response
    ):
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = mock_nbp_table_response
        mock_response.raise_for_status = MagicMock()

        with patch("httpx.AsyncClient") as mock_client_class:
            mock_client = AsyncMock()
            mock_client.get.return_value = mock_response
            mock_client.__aenter__ = AsyncMock(return_value=mock_client)
            mock_client.__aexit__ = AsyncMock(return_value=False)
            mock_client_class.return_value = mock_client

            result = await nbp_service.fetch_current_rates()
            assert len(result) == 2


class TestFetchRatesForRange:
    @pytest.mark.asyncio
    async def test_fetch_range_success(
        self, nbp_service, mock_nbp_table_response
    ):
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = mock_nbp_table_response
        mock_response.raise_for_status = MagicMock()

        with patch("httpx.AsyncClient") as mock_client_class:
            mock_client = AsyncMock()
            mock_client.get.return_value = mock_response
            mock_client.__aenter__ = AsyncMock(return_value=mock_client)
            mock_client.__aexit__ = AsyncMock(return_value=False)
            mock_client_class.return_value = mock_client

            result = await nbp_service.fetch_rates_for_range(
                date(2024, 1, 1), date(2024, 1, 31)
            )
            assert len(result) >= 2