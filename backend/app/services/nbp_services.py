# backend/app/services/nbp_service.py
"""Serwis do komunikacji z API Narodowego Banku Polskiego."""

import httpx
from datetime import date, timedelta
from typing import List, Dict, Any, Optional
import logging

from app.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()


class NBPApiError(Exception):
    """Wyjątek dla błędów API NBP."""
    def __init__(self, message: str, status_code: int = None):
        self.message = message
        self.status_code = status_code
        super().__init__(self.message)


class NBPService:
    """
    Serwis do pobierania kursów walut z API NBP.
    
    Dokumentacja API: https://api.nbp.pl/
    
    Endpointy:
    - /api/exchangerates/tables/{table}/ - tabela kursów
    - /api/exchangerates/tables/{table}/{date}/ - tabela z konkretnego dnia
    - /api/exchangerates/tables/{table}/{startDate}/{endDate}/ - zakres dat
    """

    def __init__(self, base_url: str = None):
        self.base_url = base_url or settings.NBP_API_BASE_URL
        self.timeout = 30.0

    async def fetch_rates_for_date(
        self, rate_date: date, table: str = "A"
    ) -> List[Dict[str, Any]]:
        """
        Pobiera kursy walut z konkretnego dnia.
        
        Args:
            rate_date: Data kursu
            table: Typ tabeli (A, B lub C)
            
        Returns:
            Lista słowników z danymi walut
        """
        url = (
            f"{self.base_url}/exchangerates/tables/"
            f"{table}/{rate_date.isoformat()}/"
        )

        async with httpx.AsyncClient(timeout=self.timeout) as client:
            try:
                response = await client.get(
                    url,
                    params={"format": "json"}
                )

                if response.status_code == 404:
                    logger.info(
                        f"Brak danych dla daty {rate_date} "
                        f"(prawdopodobnie dzień wolny)"
                    )
                    return []

                response.raise_for_status()
                data = response.json()

                return self._parse_table_response(data, rate_date)

            except httpx.HTTPStatusError as e:
                logger.error(f"Błąd HTTP z API NBP: {e.response.status_code}")
                raise NBPApiError(
                    f"API NBP zwróciło błąd: {e.response.status_code}",
                    e.response.status_code
                )
            except httpx.RequestError as e:
                logger.error(f"Błąd połączenia z API NBP: {str(e)}")
                raise NBPApiError(f"Nie można połączyć się z API NBP: {str(e)}")

    async def fetch_rates_for_range(
        self, date_from: date, date_to: date, table: str = "A"
    ) -> List[Dict[str, Any]]:
        """
        Pobiera kursy walut z zakresu dat.
        API NBP pozwala na max 367 dni w jednym zapytaniu.
        
        Args:
            date_from: Data początkowa
            date_to: Data końcowa
            table: Typ tabeli
            
        Returns:
            Lista słowników z danymi walut
        """
        all_rates = []
        current_start = date_from

        # Dzielimy na fragmenty po 90 dni (bezpieczny margines)
        while current_start <= date_to:
            current_end = min(
                current_start + timedelta(days=90),
                date_to
            )

            url = (
                f"{self.base_url}/exchangerates/tables/{table}/"
                f"{current_start.isoformat()}/{current_end.isoformat()}/"
            )

            async with httpx.AsyncClient(timeout=self.timeout) as client:
                try:
                    response = await client.get(
                        url,
                        params={"format": "json"}
                    )

                    if response.status_code == 404:
                        logger.info(
                            f"Brak danych dla zakresu "
                            f"{current_start} - {current_end}"
                        )
                    elif response.status_code == 200:
                        data = response.json()
                        for table_data in data:
                            effective_date = date.fromisoformat(
                                table_data["effectiveDate"]
                            )
                            rates = self._parse_table_response(
                                [table_data], effective_date
                            )
                            all_rates.extend(rates)
                    else:
                        response.raise_for_status()

                except httpx.HTTPStatusError as e:
                    logger.error(
                        f"Błąd HTTP: {e.response.status_code} "
                        f"dla zakresu {current_start}-{current_end}"
                    )
                except httpx.RequestError as e:
                    logger.error(f"Błąd połączenia: {str(e)}")
                    raise NBPApiError(
                        f"Nie można połączyć się z API NBP: {str(e)}"
                    )

            current_start = current_end + timedelta(days=1)

        logger.info(f"Pobrano łącznie {len(all_rates)} rekordów z API NBP")
        return all_rates

    async def fetch_current_rates(
        self, table: str = "A"
    ) -> List[Dict[str, Any]]:
        """Pobiera aktualne kursy walut."""
        url = f"{self.base_url}/exchangerates/tables/{table}/"

        async with httpx.AsyncClient(timeout=self.timeout) as client:
            try:
                response = await client.get(
                    url, params={"format": "json"}
                )
                response.raise_for_status()
                data = response.json()

                effective_date = date.fromisoformat(
                    data[0]["effectiveDate"]
                )
                return self._parse_table_response(data, effective_date)

            except httpx.HTTPStatusError as e:
                raise NBPApiError(
                    f"API NBP error: {e.response.status_code}",
                    e.response.status_code
                )
            except httpx.RequestError as e:
                raise NBPApiError(f"Connection error: {str(e)}")

    def _parse_table_response(
        self, data: List[Dict], rate_date: date
    ) -> List[Dict[str, Any]]:
        """
        Parsuje odpowiedź z API NBP do ustandaryzowanego formatu.
        
        Args:
            data: Surowe dane z API
            rate_date: Data kursu
            
        Returns:
            Lista sparsowanych rekordów
        """
        parsed_rates = []

        for table_data in data:
            table_number = table_data.get("no", "")
            effective_date = date.fromisoformat(
                table_data.get("effectiveDate", rate_date.isoformat())
            )

            for rate in table_data.get("rates", []):
                parsed_rates.append({
                    "currency_code": rate["code"],
                    "currency_name": rate["currency"],
                    "mid_rate": rate["mid"],
                    "rate_date": effective_date,
                    "table_number": table_number
                })

        return parsed_rates


# Singleton
nbp_service = NBPService()