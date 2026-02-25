import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import {
  AvailableCurrency,
  CurrencyFilterParams,
  GroupByPeriod
} from '../../models/currency.model';

@Component({
  selector: 'app-currency-filter',
  templateUrl: './currency-filter.component.html',
  styleUrls: ['./currency-filter.component.css']
})
export class CurrencyFilterComponent implements OnInit {
  @Input() availableCurrencies: AvailableCurrency[] = [];
  @Input() loading = false;

  @Output() filterChange = new EventEmitter<CurrencyFilterParams>();
  @Output() fetchRequest = new EventEmitter<{
    date_from: string;
    date_to: string;
    table: string;
  }>();

  // Filtry wyświetlania
  selectedCurrency = '';
  dateFrom = '';
  dateTo = '';
  groupBy: GroupByPeriod = 'day';

  // Pobieranie z NBP
  fetchDateFrom = '';
  fetchDateTo = '';
  fetchTable = 'A';
  showFetchPanel = false;

  // Dostępne opcje grupowania
  groupByOptions: { value: GroupByPeriod; label: string }[] = [
    { value: 'day', label: 'Dni' },
    { value: 'month', label: 'Miesiące' },
    { value: 'quarter', label: 'Kwartały' },
    { value: 'year', label: 'Lata' }
  ];

  ngOnInit(): void {
    // Ustaw domyślne daty pobierania (ostatni miesiąc)
    const today = new Date();
    const monthAgo = new Date();
    monthAgo.setMonth(monthAgo.getMonth() - 1);

    this.fetchDateTo = this.formatDate(today);
    this.fetchDateFrom = this.formatDate(monthAgo);
  }

  /**
   * Emituje zmianę filtrów.
   */
  applyFilters(): void {
    const params: CurrencyFilterParams = {};

    if (this.selectedCurrency) {
      params.currency_code = this.selectedCurrency;
    }
    if (this.dateFrom) {
      params.date_from = this.dateFrom;
    }
    if (this.dateTo) {
      params.date_to = this.dateTo;
    }
    if (this.groupBy) {
      params.group_by = this.groupBy;
    }

    this.filterChange.emit(params);
  }

  /**
   * Resetuje wszystkie filtry.
   */
  resetFilters(): void {
    this.selectedCurrency = '';
    this.dateFrom = '';
    this.dateTo = '';
    this.groupBy = 'day';
    this.filterChange.emit({});
  }

  /**
   * Emituje żądanie pobrania danych z NBP.
   */
  submitFetch(): void {
    if (!this.fetchDateFrom || !this.fetchDateTo) {
      return;
    }

    this.fetchRequest.emit({
      date_from: this.fetchDateFrom,
      date_to: this.fetchDateTo,
      table: this.fetchTable
    });
  }

  /**
   * Przełącza widoczność panelu pobierania.
   */
  toggleFetchPanel(): void {
    this.showFetchPanel = !this.showFetchPanel;
  }

  /**
   * Sprawdza czy formularz pobierania jest poprawny.
   */
  isFetchValid(): boolean {
    if (!this.fetchDateFrom || !this.fetchDateTo) {
      return false;
    }
    return this.fetchDateFrom <= this.fetchDateTo;
  }

  /**
   * Sprawdza czy są aktywne filtry.
   */
  hasActiveFilters(): boolean {
    return !!(this.selectedCurrency || this.dateFrom || this.dateTo || this.groupBy !== 'day');
  }

  /**
   * Formatuje datę do stringa YYYY-MM-DD.
   */
  private formatDate(d: Date): string {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}
