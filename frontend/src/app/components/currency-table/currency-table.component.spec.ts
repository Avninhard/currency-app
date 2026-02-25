import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CurrencyTableComponent } from './currency-table.component';
import { CurrencyRate } from '../../models/currency.model';

describe('CurrencyTableComponent', () => {
  let component: CurrencyTableComponent;
  let fixture: ComponentFixture<CurrencyTableComponent>;

  const mockCurrencies: CurrencyRate[] = [
    {
      id: 1,
      currency_code: 'USD',
      currency_name: 'dolar amerykański',
      mid_rate: 4.0215,
      rate_date: '2024-01-15',
      table_number: '001/A/NBP/2024'
    },
    {
      id: 2,
      currency_code: 'EUR',
      currency_name: 'euro',
      mid_rate: 4.3712,
      rate_date: '2024-01-15',
      table_number: '001/A/NBP/2024'
    },
    {
      id: 3,
      currency_code: 'GBP',
      currency_name: 'funt szterling',
      mid_rate: 5.1023,
      rate_date: '2024-01-15',
      table_number: '001/A/NBP/2024'
    }
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [CurrencyTableComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(CurrencyTableComponent);
    component = fixture.componentInstance;
  });

  it('powinien się utworzyć', () => {
    expect(component).toBeTruthy();
  });

  // ============ Wyświetlanie danych ============

  describe('wyświetlanie danych', () => {
    it('powinien wyświetlić komunikat o braku danych', () => {
      component.currencies = [];
      fixture.detectChanges();

      const emptyState = fixture.nativeElement.querySelector('.empty-state');
      expect(emptyState).toBeTruthy();
      expect(emptyState.textContent).toContain('Brak danych');
    });

    it('powinien wyświetlić tabelę z danymi', () => {
      component.currencies = mockCurrencies;
      component.totalRecords = 3;
      fixture.detectChanges();

      const rows = fixture.nativeElement.querySelectorAll('tbody tr');
      expect(rows.length).toBe(3);
    });

    it('powinien wyświetlić poprawne dane w wierszu', () => {
      component.currencies = mockCurrencies;
      fixture.detectChanges();

      const firstRow = fixture.nativeElement.querySelector('tbody tr');
      expect(firstRow.textContent).toContain('USD');
      expect(firstRow.textContent).toContain('dolar amerykański');
      expect(firstRow.textContent).toContain('2024-01-15');
    });

    it('powinien wyświetlić liczbę rekordów', () => {
      component.currencies = mockCurrencies;
      component.totalRecords = 150;
      fixture.detectChanges();

      const badge = fixture.nativeElement.querySelector('.badge');
      expect(badge.textContent).toContain('150');
    });

    it('powinien wyświetlić kod waluty w badge', () => {
      component.currencies = mockCurrencies;
      fixture.detectChanges();

      const codes = fixture.nativeElement.querySelectorAll('.currency-code');
      expect(codes.length).toBe(3);
      expect(codes[0].textContent.trim()).toBe('USD');
    });

    it('nie powinien wyświetlić tabeli gdy brak danych', () => {
      component.currencies = [];
      fixture.detectChanges();

      const table = fixture.nativeElement.querySelector('table');
      expect(table).toBeNull();
    });
  });

  // ============ Paginacja ============

  describe('paginacja', () => {
    it('nie powinien wyświetlić paginacji dla 1 strony', () => {
      component.currencies = mockCurrencies;
      component.totalPages = 1;
      fixture.detectChanges();

      const pagination = fixture.nativeElement.querySelector('.pagination');
      expect(pagination).toBeNull();
    });

    it('powinien wyświetlić paginację dla wielu stron', () => {
      component.currencies = mockCurrencies;
      component.totalPages = 5;
      component.currentPage = 1;
      fixture.detectChanges();

      const pagination = fixture.nativeElement.querySelector('.pagination');
      expect(pagination).toBeTruthy();
    });

    it('powinien wyświetlić informację o stronie', () => {
      component.currencies = mockCurrencies;
      component.totalPages = 5;
      component.currentPage = 2;
      component.totalRecords = 250;
      fixture.detectChanges();

      const info = fixture.nativeElement.querySelector('.pagination-info');
      expect(info.textContent).toContain('Strona 2 z 5');
      expect(info.textContent).toContain('250');
    });
  });

  // ============ previousPage ============

  describe('previousPage', () => {
    it('powinien emitować poprzednią stronę', () => {
      spyOn(component.pageChange, 'emit');
      component.currentPage = 3;

      component.previousPage();

      expect(component.pageChange.emit).toHaveBeenCalledWith(2);
    });

    it('nie powinien emitować na pierwszej stronie', () => {
      spyOn(component.pageChange, 'emit');
      component.currentPage = 1;

      component.previousPage();

      expect(component.pageChange.emit).not.toHaveBeenCalled();
    });
  });

  // ============ nextPage ============

  describe('nextPage', () => {
    it('powinien emitować następną stronę', () => {
      spyOn(component.pageChange, 'emit');
      component.currentPage = 2;
      component.totalPages = 5;

      component.nextPage();

      expect(component.pageChange.emit).toHaveBeenCalledWith(3);
    });

    it('nie powinien emitować na ostatniej stronie', () => {
      spyOn(component.pageChange, 'emit');
      component.currentPage = 5;
      component.totalPages = 5;

      component.nextPage();

      expect(component.pageChange.emit).not.toHaveBeenCalled();
    });
  });

  // ============ goToPage ============

  describe('goToPage', () => {
    it('powinien emitować poprawną stronę', () => {
      spyOn(component.pageChange, 'emit');
      component.totalPages = 10;

      component.goToPage(5);

      expect(component.pageChange.emit).toHaveBeenCalledWith(5);
    });

    it('nie powinien emitować strony poniżej 1', () => {
      spyOn(component.pageChange, 'emit');
      component.totalPages = 10;

      component.goToPage(0);

      expect(component.pageChange.emit).not.toHaveBeenCalled();
    });

    it('nie powinien emitować strony powyżej max', () => {
      spyOn(component.pageChange, 'emit');
      component.totalPages = 10;

      component.goToPage(11);

      expect(component.pageChange.emit).not.toHaveBeenCalled();
    });
  });

  // ============ getPageNumbers ============

  describe('getPageNumbers', () => {
    it('powinien zwrócić poprawne numery stron na początku', () => {
      component.currentPage = 1;
      component.totalPages = 10;

      const pages = component.getPageNumbers();

      expect(pages).toEqual([1, 2, 3, 4, 5]);
    });

    it('powinien zwrócić poprawne numery stron w środku', () => {
      component.currentPage = 5;
      component.totalPages = 10;

      const pages = component.getPageNumbers();

      expect(pages).toEqual([3, 4, 5, 6, 7]);
    });

    it('powinien zwrócić poprawne numery stron na końcu', () => {
      component.currentPage = 10;
      component.totalPages = 10;

      const pages = component.getPageNumbers();

      expect(pages).toEqual([6, 7, 8, 9, 10]);
    });

    it('powinien zwrócić mniej stron gdy totalPages < 5', () => {
      component.currentPage = 1;
      component.totalPages = 3;

      const pages = component.getPageNumbers();

      expect(pages).toEqual([1, 2, 3]);
    });

    it('powinien zwrócić jedną stronę', () => {
      component.currentPage = 1;
      component.totalPages = 1;

      const pages = component.getPageNumbers();

      expect(pages).toEqual([1]);
    });
  });

  // ============ getRateClass ============

  describe('getRateClass', () => {
    it('powinien zwrócić rate-high dla kursu > 4.5', () => {
      expect(component.getRateClass(5.1)).toBe('rate-high');
    });

    it('powinien zwrócić rate-low dla kursu < 3.5', () => {
      expect(component.getRateClass(3.2)).toBe('rate-low');
    });

    it('powinien zwrócić pusty string dla normalnego kursu', () => {
      expect(component.getRateClass(4.0)).toBe('');
    });
  });
});
