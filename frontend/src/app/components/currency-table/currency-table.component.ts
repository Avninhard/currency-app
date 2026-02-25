import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CurrencyRate } from '../../models/currency.model';

@Component({
  selector: 'app-currency-table',
  templateUrl: './currency-table.component.html',
  styleUrls: ['./currency-table.component.css']
})
export class CurrencyTableComponent {
  @Input() currencies: CurrencyRate[] = [];
  @Input() currentPage = 1;
  @Input() totalPages = 0;
  @Input() totalRecords = 0;

  @Output() pageChange = new EventEmitter<number>();

  /**
   * Przechodzi do poprzedniej strony.
   */
  previousPage(): void {
    if (this.currentPage > 1) {
      this.pageChange.emit(this.currentPage - 1);
    }
  }

  /**
   * Przechodzi do następnej strony.
   */
  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.pageChange.emit(this.currentPage + 1);
    }
  }

  /**
   * Przechodzi do konkretnej strony.
   */
  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.pageChange.emit(page);
    }
  }

  /**
   * Generuje tablicę numerów stron do wyświetlenia.
   */
  getPageNumbers(): number[] {
    const pages: number[] = [];
    const maxVisible = 5;
    let start = Math.max(1, this.currentPage - Math.floor(maxVisible / 2));
    let end = Math.min(this.totalPages, start + maxVisible - 1);

    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  }

  /**
   * Zwraca klasę CSS dla zmiany kursu.
   */
  getRateClass(rate: number): string {
    if (rate > 4.5) return 'rate-high';
    if (rate < 3.5) return 'rate-low';
    return '';
  }
}
