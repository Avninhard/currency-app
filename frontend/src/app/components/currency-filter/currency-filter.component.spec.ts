import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { CurrencyFilterComponent } from './currency-filter.component';
import { AvailableCurrency } from '../../models/currency.model';

describe('CurrencyFilterComponent', () => {
  let component: CurrencyFilterComponent;
  let fixture: ComponentFixture<CurrencyFilterComponent>;

  const mockCurrencies: AvailableCurrency[] = [
    { code: 'USD', name: 'dolar amerykański' },
    { code: 'EUR', name: 'euro' },
    { code: 'GBP', name: 'funt szterling' }
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [CurrencyFilterComponent],
      imports: [FormsModule]
    }).compileComponents();

    fixture = TestBed.createComponent(CurrencyFilterComponent);
    component = fixture.componentInstance;
    component.availableCurrencies = mockCurrencies;
    fixture.detectChanges();
  });

  it('powinien się utworzyć', () => {
    expect(component).toBeTruthy();
  });

  it('powinien ustawić domyślne daty pobierania', () => {
    expect(component.fetchDateFrom).toBeTruthy();
    expect(component.fetchDateTo).toBeTruthy();
    expect(component.fetchDateFrom < component.fetchDateTo).toBeTrue();
  });

  it('powinien mieć domyślne grupowanie na dni', () => {
    expect(component.groupBy).toBe('day');
  });

  it('powinien mieć 4 opcje grupowania', () => {
    expect(component.groupByOptions.length).toBe(4);
    const values = component.groupByOptions.map(o => o.value);
    expect(values).toContain('day');
    expect(values).toContain('month');
    expect(values).toContain('quarter');
    expect(values).toContain('year');
  });

  // ============ applyFilters ============

  describe('applyFilters', () => {
    it('powinien emitować puste filtry domyślnie', () => {
      spyOn(component.filterChange, 'emit');

      component.applyFilters();

      expect(component.filterChange.emit).toHaveBeenCalledWith({
        group_by: 'day'
      });
    });

    it('powinien emitować filtr waluty', () => {
      spyOn(component.filterChange, 'emit');
      component.selectedCurrency = 'USD';

      component.applyFilters();

      expect(component.filterChange.emit).toHaveBeenCalledWith(
        jasmine.objectContaining({ currency_code: 'USD' })
      );
    });

    it('powinien emitować filtr dat', () => {
      spyOn(component.filterChange, 'emit');
      component.dateFrom = '2024-01-01';
      component.dateTo = '2024-06-30';

      component.applyFilters();

      expect(component.filterChange.emit).toHaveBeenCalledWith(
        jasmine.objectContaining({
          date_from: '2024-01-01',
          date_to: '2024-06-30'
        })
      );
    });

    it('powinien emitować grupowanie', () => {
      spyOn(component.filterChange, 'emit');
      component.selectedCurrency = 'EUR';
      component.groupBy = 'month';

      component.applyFilters();

      expect(component.filterChange.emit).toHaveBeenCalledWith(
        jasmine.objectContaining({
          currency_code: 'EUR',
          group_by: 'month'
        })
      );
    });

    it('powinien emitować wszystkie filtry naraz', () => {
      spyOn(component.filterChange, 'emit');
      component.selectedCurrency = 'GBP';
      component.dateFrom = '2024-01-01';
      component.dateTo = '2024-03-31';
      component.groupBy = 'quarter';

      component.applyFilters();

      expect(component.filterChange.emit).toHaveBeenCalledWith({
        currency_code: 'GBP',
        date_from: '2024-01-01',
        date_to: '2024-03-31',
        group_by: 'quarter'
      });
    });
  });

  // ============ resetFilters ============

  describe('resetFilters', () => {
    it('powinien zresetować wszystkie filtry', () => {
      spyOn(component.filterChange, 'emit');
      component.selectedCurrency = 'USD';
      component.dateFrom = '2024-01-01';
      component.dateTo = '2024-06-30';
      component.groupBy = 'year';

      component.resetFilters();

      expect(component.selectedCurrency).toBe('');
      expect(component.dateFrom).toBe('');
      expect(component.dateTo).toBe('');
      expect(component.groupBy).toBe('day');
      expect(component.filterChange.emit).toHaveBeenCalledWith({});
    });
  });

  // ============ submitFetch ============

  describe('submitFetch', () => {
    it('powinien emitować żądanie pobrania', () => {
      spyOn(component.fetchRequest, 'emit');
      component.fetchDateFrom = '2024-01-01';
      component.fetchDateTo = '2024-01-31';
      component.fetchTable = 'A';

      component.submitFetch();

      expect(component.fetchRequest.emit).toHaveBeenCalledWith({
        date_from: '2024-01-01',
        date_to: '2024-01-31',
        table: 'A'
      });
    });

    it('nie powinien emitować bez dat', () => {
      spyOn(component.fetchRequest, 'emit');
      component.fetchDateFrom = '';
      component.fetchDateTo = '';

      component.submitFetch();

      expect(component.fetchRequest.emit).not.toHaveBeenCalled();
    });

    it('nie powinien emitować bez daty początkowej', () => {
      spyOn(component.fetchRequest, 'emit');
      component.fetchDateFrom = '';
      component.fetchDateTo = '2024-01-31';

      component.submitFetch();

      expect(component.fetchRequest.emit).not.toHaveBeenCalled();
    });
  });

  // ============ isFetchValid ============

  describe('isFetchValid', () => {
    it('powinien zwrócić true dla poprawnych dat', () => {
      component.fetchDateFrom = '2024-01-01';
      component.fetchDateTo = '2024-01-31';
      expect(component.isFetchValid()).toBeTrue();
    });

    it('powinien zwrócić true dla tych samych dat', () => {
      component.fetchDateFrom = '2024-01-15';
      component.fetchDateTo = '2024-01-15';
      expect(component.isFetchValid()).toBeTrue();
    });

    it('powinien zwrócić false gdy data od > data do', () => {
      component.fetchDateFrom = '2024-02-01';
      component.fetchDateTo = '2024-01-01';
      expect(component.isFetchValid()).toBeFalse();
    });

    it('powinien zwrócić false bez dat', () => {
      component.fetchDateFrom = '';
      component.fetchDateTo = '';
      expect(component.isFetchValid()).toBeFalse();
    });
  });

  // ============ hasActiveFilters ============

  describe('hasActiveFilters', () => {
    it('powinien zwrócić false bez aktywnych filtrów', () => {
      component.selectedCurrency = '';
      component.dateFrom = '';
      component.dateTo = '';
      component.groupBy = 'day';
      expect(component.hasActiveFilters()).toBeFalse();
    });

    it('powinien zwrócić true z wybraną walutą', () => {
      component.selectedCurrency = 'USD';
      expect(component.hasActiveFilters()).toBeTrue();
    });

    it('powinien zwrócić true z datą od', () => {
      component.dateFrom = '2024-01-01';
      expect(component.hasActiveFilters()).toBeTrue();
    });

    it('powinien zwrócić true z grupowaniem innym niż dzień', () => {
      component.groupBy = 'month';
      expect(component.hasActiveFilters()).toBeTrue();
    });
  });

  // ============ toggleFetchPanel ============

  describe('toggleFetchPanel', () => {
    it('powinien przełączyć widoczność panelu', () => {
      expect(component.showFetchPanel).toBeFalse();

      component.toggleFetchPanel();
      expect(component.showFetchPanel).toBeTrue();

      component.toggleFetchPanel();
      expect(component.showFetchPanel).toBeFalse();
    });
  });

  // ============ Renderowanie ============

  describe('renderowanie', () => {
    it('powinien wyświetlić select z walutami', () => {
      const select = fixture.nativeElement.querySelector('#currency');
      expect(select).toBeTruthy();
      // "Wszystkie waluty" + 3 waluty
      expect(select.options.length).toBe(4);
    });

    it('powinien wyświetlić pola dat', () => {
      expect(fixture.nativeElement.querySelector('#dateFrom')).toBeTruthy();
      expect(fixture.nativeElement.querySelector('#dateTo')).toBeTruthy();
    });

    it('powinien wyświetlić select grupowania', () => {
      const select = fixture.nativeElement.querySelector('#groupBy');
      expect(select).toBeTruthy();
      expect(select.options.length).toBe(4);
    });

    it('powinien wyświetlić przycisk filtrowania', () => {
      const buttons = fixture.nativeElement.querySelectorAll('.btn-primary');
      const filterBtn = Array.from(buttons).find(
        (b: any) => b.textContent.includes('Filtruj')
      );
      expect(filterBtn).toBeTruthy();
    });

    it('nie powinien wyświetlić panelu NBP domyślnie', () => {
      expect(fixture.nativeElement.querySelector('.fetch-panel')).toBeNull();
    });

    it('powinien wyświetlić panel NBP po kliknięciu', () => {
      component.showFetchPanel = true;
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('.fetch-panel')).toBeTruthy();
    });
  });
});
