import { Component, OnInit } from '@angular/core';
import { CurrencyService } from './services/currency.service';
import {
  CurrencyRate,
  AggregatedRate,
  AvailableCurrency,
  FetchResponse,
  CurrencyFilterParams,
  GroupByPeriod,
  PaginatedResponse
} from './models/currency.model';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  // Dane
  currencies: CurrencyRate[] = [];
  aggregatedRates: AggregatedRate[] = [];
  availableCurrencies: AvailableCurrency[] = [];

  // Paginacja
  currentPage = 1;
  totalPages = 0;
  totalRecords = 0;
  perPage = 50;

  // Stan UI
  loading = false;
  fetching = false;
  errorMessage = '';
  successMessage = '';
  viewMode: 'table' | 'aggregated' | 'chart' = 'table';

  // Filtry
  currentFilters: CurrencyFilterParams = {};

  constructor(private currencyService: CurrencyService) {}

  ngOnInit(): void {
    this.loadAvailableCurrencies();
    this.loadCurrencies();
  }

  /**
   * Ładuje listę unikalnych walut.
   */
  loadAvailableCurrencies(): void {
    this.currencyService.getAvailableCurrencies().subscribe({
      next: (data) => {
        this.availableCurrencies = data;
      },
      error: (err) => {
        console.error('Błąd ładowania walut:', err);
      }
    });
  }

  /**
   * Ładuje kursy walut z filtrami.
   */
  loadCurrencies(params: CurrencyFilterParams = {}): void {
    this.loading = true;
    this.errorMessage = '';
    this.currentFilters = params;

    const requestParams: CurrencyFilterParams = {
      ...params,
      page: this.currentPage,
      per_page: this.perPage
    };

    this.currencyService.getCurrencies(requestParams).subscribe({
      next: (response: PaginatedResponse) => {
        this.currencies = response.data;
        this.totalRecords = response.total;
        this.totalPages = response.total_pages;
        this.loading = false;
      },
      error: (err) => {
        this.errorMessage = err.message;
        this.loading = false;
      }
    });
  }

  /**
   * Ładuje zagregowane kursy.
   */
  loadAggregated(params: CurrencyFilterParams): void {
    if (!params.currency_code) {
      this.errorMessage = 'Wybierz walutę do agregacji';
      return;
    }

    this.loading = true;
    this.errorMessage = '';
    this.currentFilters = params;

    this.currencyService.getAggregatedRates(params).subscribe({
      next: (data) => {
        this.aggregatedRates = data;
        this.loading = false;
      },
      error: (err) => {
        this.errorMessage = err.message;
        this.aggregatedRates = [];
        this.loading = false;
      }
    });
  }

  /**
   * Obsługuje zmianę filtrów z komponentu filtrowania.
   */
  onFilterChange(params: CurrencyFilterParams): void {
    this.currentPage = 1;

    if (params.group_by && params.group_by !== 'day') {
      this.viewMode = 'aggregated';
      this.loadAggregated(params);
    } else {
      this.viewMode = 'table';
      this.loadCurrencies(params);
    }
  }

  /**
   * Przełącza na widok wykresu.
   */
  onShowChart(): void {
    if (this.aggregatedRates.length > 0) {
      this.viewMode = 'chart';
    }
  }

  /**
   * Pobiera dane z API NBP.
   */
  onFetchFromNBP(request: { date_from: string; date_to: string; table: string }): void {
    this.fetching = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.currencyService.fetchFromNBP(request).subscribe({
      next: (response: FetchResponse) => {
        this.successMessage = `${response.message}. Zapisano: ${response.records_saved}, pominięto: ${response.records_skipped}`;
        this.fetching = false;
        // Odśwież dane
        this.loadAvailableCurrencies();
        this.loadCurrencies(this.currentFilters);
      },
      error: (err) => {
        this.errorMessage = err.message;
        this.fetching = false;
      }
    });
  }

  /**
   * Pobiera aktualne kursy z NBP.
   */
  onFetchCurrent(): void {
    this.fetching = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.currencyService.fetchCurrentFromNBP().subscribe({
      next: (response: FetchResponse) => {
        this.successMessage = `${response.message}. Zapisano: ${response.records_saved}, pominięto: ${response.records_skipped}`;
        this.fetching = false;
        this.loadAvailableCurrencies();
        this.loadCurrencies(this.currentFilters);
      },
      error: (err) => {
        this.errorMessage = err.message;
        this.fetching = false;
      }
    });
  }

  /**
   * Zmiana strony.
   */
  onPageChange(page: number): void {
    this.currentPage = page;
    this.loadCurrencies(this.currentFilters);
  }

  /**
   * Zamyka komunikaty.
   */
  clearMessages(): void {
    this.errorMessage = '';
    this.successMessage = '';
  }
}
