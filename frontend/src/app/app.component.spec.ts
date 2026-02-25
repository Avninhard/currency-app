import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { of, throwError } from 'rxjs';
import { AppComponent } from './app.component';
import { CurrencyService } from './services/currency.service';
import { CurrencyFilterComponent } from './components/currency-filter/currency-filter.component';
import { CurrencyTableComponent } from './components/currency-table/currency-table.component';
import { CurrencyChartComponent } from './components/currency-chart/currency-chart.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { PaginatedResponse, FetchResponse, AggregatedRate } from './models/currency.model';

describe('AppComponent', () => {
  let component: AppComponent;
  let fixture: ComponentFixture<AppComponent>;
  let currencyService: jasmine.SpyObj<CurrencyService>;

  const mockPaginatedResponse: PaginatedResponse = {
    data: [
      {
        id: 1,
        currency_code: 'USD',
        currency_name: 'dolar amerykański',
        mid_rate: 4.0215,
        rate_date: '2024-01-15',
        table_number: '001/A/NBP/2024'
      }
    ],
    total: 1,
    page: 1,
    per_page: 50,
    total_pages: 1
  };

  const mockFetchResponse: FetchResponse = {
    message: 'Pobrano dane',
    records_saved: 10,
    records_skipped: 0
  };

  beforeEach(async () => {
    const spy = jasmine.createSpyObj('CurrencyService', [
      'getCurrencies',
      'getAvailableCurrencies',
      'getAggregatedRates',
      'fetchFromNBP',
      'fetchCurrentFromNBP',
      'getDateRange'
    ]);

    spy.getCurrencies.and.returnValue(of(mockPaginatedResponse));
    spy.getAvailableCurrencies.and.returnValue(of([
      { code: 'USD', name: 'dolar amerykański' },
      { code: 'EUR', name: 'euro' }
    ]));
    spy.getDateRange.and.returnValue(of({
      min_date: '2024-01-01',
      max_date: '2024-06-01',
      total_records: 100
    }));

    await TestBed.configureTestingModule({
      declarations: [
        AppComponent,
        CurrencyFilterComponent,
        CurrencyTableComponent,
        CurrencyChartComponent
      ],
      imports: [
        HttpClientTestingModule,
        FormsModule,
        ReactiveFormsModule
      ],
      providers: [
        { provide: CurrencyService, useValue: spy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(AppComponent);
    component = fixture.componentInstance;
    currencyService = TestBed.inject(CurrencyService) as jasmine.SpyObj<CurrencyService>;
  });

  it('powinien się utworzyć', () => {
    expect(component).toBeTruthy();
  });

  it('powinien załadować dane przy inicjalizacji', () => {
    fixture.detectChanges();
    expect(currencyService.getAvailableCurrencies).toHaveBeenCalled();
    expect(currencyService.getCurrencies).toHaveBeenCalled();
  });

  it('powinien załadować listę walut', fakeAsync(() => {
    fixture.detectChanges();
    tick();
    expect(component.availableCurrencies.length).toBe(2);
    expect(component.availableCurrencies[0].code).toBe('USD');
  }));

  it('powinien załadować kursy walut', fakeAsync(() => {
    fixture.detectChanges();
    tick();
    expect(component.currencies.length).toBe(1);
    expect(component.totalRecords).toBe(1);
  }));

  it('powinien obsłużyć błąd ładowania kursów', fakeAsync(() => {
    currencyService.getCurrencies.and.returnValue(
      throwError(() => new Error('Błąd serwera'))
    );
    component.loadCurrencies();
    tick();
    expect(component.errorMessage).toBe('Błąd serwera');
    expect(component.loading).toBeFalse();
  }));

    it('powinien pobrać aktualne kursy z NBP', fakeAsync(() => {
    currencyService.fetchCurrentFromNBP.and.returnValue(of(mockFetchResponse));
    fixture.detectChanges();

    component.onFetchCurrent();
    tick();

    expect(currencyService.fetchCurrentFromNBP).toHaveBeenCalled();
    expect(component.successMessage).toContain('Zapisano: 10');
    expect(component.fetching).toBeFalse();
  }));

  it('powinien obsłużyć błąd pobierania z NBP', fakeAsync(() => {
    currencyService.fetchCurrentFromNBP.and.returnValue(
      throwError(() => new Error('Błąd API NBP'))
    );
    fixture.detectChanges();

    component.onFetchCurrent();
    tick();

    expect(component.errorMessage).toBe('Błąd API NBP');
    expect(component.fetching).toBeFalse();
  }));

  it('powinien pobrać dane z NBP dla zakresu dat', fakeAsync(() => {
    currencyService.fetchFromNBP.and.returnValue(of(mockFetchResponse));
    fixture.detectChanges();

    component.onFetchFromNBP({
      date_from: '2024-01-01',
      date_to: '2024-01-31',
      table: 'A'
    });
    tick();

    expect(currencyService.fetchFromNBP).toHaveBeenCalledWith({
      date_from: '2024-01-01',
      date_to: '2024-01-31',
      table: 'A'
    });
    expect(component.successMessage).toContain('Zapisano: 10');
  }));

  it('powinien załadować zagregowane dane', fakeAsync(() => {
    const mockAggregated: AggregatedRate[] = [
      {
        period: '2024-01',
        currency_code: 'USD',
        avg_rate: 4.02,
        min_rate: 3.98,
        max_rate: 4.05,
        count: 22
      }
    ];
    currencyService.getAggregatedRates.and.returnValue(of(mockAggregated));
    fixture.detectChanges();

    component.loadAggregated({ currency_code: 'USD', group_by: 'month' });
    tick();

    expect(component.aggregatedRates.length).toBe(1);
    expect(component.aggregatedRates[0].period).toBe('2024-01');
    expect(component.loading).toBeFalse();
  }));

  it('powinien wymagać waluty do agregacji', () => {
    component.loadAggregated({ group_by: 'month' });
    expect(component.errorMessage).toContain('Wybierz walutę');
  });

  it('powinien obsłużyć zmianę filtrów - widok dzienny', fakeAsync(() => {
    fixture.detectChanges();

    component.onFilterChange({ currency_code: 'USD', group_by: 'day' });
    tick();

    expect(component.viewMode).toBe('table');
    expect(currencyService.getCurrencies).toHaveBeenCalled();
  }));

  it('powinien obsłużyć zmianę filtrów - widok zagregowany', fakeAsync(() => {
    const mockAggregated: AggregatedRate[] = [
      {
        period: '2024',
        currency_code: 'USD',
        avg_rate: 4.0,
        min_rate: 3.9,
        max_rate: 4.1,
        count: 250
      }
    ];
    currencyService.getAggregatedRates.and.returnValue(of(mockAggregated));
    fixture.detectChanges();

    component.onFilterChange({ currency_code: 'USD', group_by: 'year' });
    tick();

    expect(component.viewMode).toBe('aggregated');
    expect(currencyService.getAggregatedRates).toHaveBeenCalled();
  }));

  it('powinien zmienić stronę', fakeAsync(() => {
    fixture.detectChanges();

    component.onPageChange(3);
    tick();

    expect(component.currentPage).toBe(3);
    expect(currencyService.getCurrencies).toHaveBeenCalled();
  }));

  it('powinien przełączyć na widok wykresu', () => {
    component.aggregatedRates = [
      {
        period: '2024-01',
        currency_code: 'USD',
        avg_rate: 4.0,
        min_rate: 3.9,
        max_rate: 4.1,
        count: 22
      }
    ];

    component.onShowChart();
    expect(component.viewMode).toBe('chart');
  });

  it('nie powinien przełączyć na wykres bez danych', () => {
    component.aggregatedRates = [];
    component.viewMode = 'table';

    component.onShowChart();
    expect(component.viewMode).toBe('table');
  });

  it('powinien wyczyścić komunikaty', () => {
    component.errorMessage = 'Błąd';
    component.successMessage = 'Sukces';

    component.clearMessages();

    expect(component.errorMessage).toBe('');
    expect(component.successMessage).toBe('');
  });

  it('powinien resetować stronę przy zmianie filtrów', fakeAsync(() => {
    component.currentPage = 5;
    fixture.detectChanges();

    component.onFilterChange({ currency_code: 'EUR' });
    tick();

    expect(component.currentPage).toBe(1);
  }));
});
