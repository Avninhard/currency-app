import { TestBed } from '@angular/core/testing';
import {
  HttpClientTestingModule,
  HttpTestingController
} from '@angular/common/http/testing';
import { CurrencyService } from './currency.service';
import {
  PaginatedResponse,
  CurrencyRate,
  AggregatedRate,
  FetchResponse,
  AvailableCurrency,
  DateRange
} from '../models/currency.model';

describe('CurrencyService', () => {
  let service: CurrencyService;
  let httpMock: HttpTestingController;

  const mockCurrencyRate: CurrencyRate = {
    id: 1,
    currency_code: 'USD',
    currency_name: 'dolar amerykański',
    mid_rate: 4.0215,
    rate_date: '2024-01-15',
    table_number: '001/A/NBP/2024'
  };

  const mockPaginatedResponse: PaginatedResponse = {
    data: [mockCurrencyRate],
    total: 1,
    page: 1,
    per_page: 50,
    total_pages: 1
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [CurrencyService]
    });
    service = TestBed.inject(CurrencyService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('powinien zostać utworzony', () => {
    expect(service).toBeTruthy();
  });

  // ============ getHealth ============

  describe('getHealth', () => {
    it('powinien zwrócić status API', () => {
      const mockHealth = { status: 'ok', version: '1.0.0' };

      service.getHealth().subscribe(result => {
        expect(result.status).toBe('ok');
        expect(result.version).toBe('1.0.0');
      });

      const req = httpMock.expectOne('/api/health');
      expect(req.request.method).toBe('GET');
      req.flush(mockHealth);
    });
  });

  // ============ getCurrencies ============

  describe('getCurrencies', () => {
    it('powinien pobrać listę kursów bez filtrów', () => {
      service.getCurrencies().subscribe(result => {
        expect(result.data.length).toBe(1);
        expect(result.total).toBe(1);
      });

      const req = httpMock.expectOne('/api/currencies/');
      expect(req.request.method).toBe('GET');
      req.flush(mockPaginatedResponse);
    });

    it('powinien pobrać listę kursów z filtrem waluty', () => {
      service.getCurrencies({ currency_code: 'USD' }).subscribe(result => {
        expect(result.data[0].currency_code).toBe('USD');
      });

      const req = httpMock.expectOne(
        (r) => r.url === '/api/currencies/' && r.params.get('currency_code') === 'USD'
      );
      expect(req.request.method).toBe('GET');
      req.flush(mockPaginatedResponse);
    });

    it('powinien pobrać listę kursów z filtrem dat', () => {
      service.getCurrencies({
        date_from: '2024-01-01',
        date_to: '2024-01-31'
      }).subscribe();

      const req = httpMock.expectOne(
        (r) => r.url === '/api/currencies/'
          && r.params.get('date_from') === '2024-01-01'
          && r.params.get('date_to') === '2024-01-31'
      );
      expect(req.request.method).toBe('GET');
      req.flush(mockPaginatedResponse);
    });

    it('powinien pobrać listę z paginacją', () => {
      service.getCurrencies({ page: 2, per_page: 10 }).subscribe();

      const req = httpMock.expectOne(
        (r) => r.url === '/api/currencies/'
          && r.params.get('page') === '2'
          && r.params.get('per_page') === '10'
      );
      req.flush(mockPaginatedResponse);
    });

    it('powinien obsłużyć błąd serwera', () => {
      service.getCurrencies().subscribe({
        error: (err) => {
          expect(err.message).toContain('Błąd serwera');
        }
      });

      const req = httpMock.expectOne('/api/currencies/');
      req.flush('Server Error', { status: 500, statusText: 'Internal Server Error' });
    });
  });

  // ============ getCurrenciesByDate ============

  describe('getCurrenciesByDate', () => {
    it('powinien pobrać kursy z konkretnego dnia', () => {
      const mockRates: CurrencyRate[] = [mockCurrencyRate];

      service.getCurrenciesByDate('2024-01-15').subscribe(result => {
        expect(result.length).toBe(1);
        expect(result[0].currency_code).toBe('USD');
        expect(result[0].rate_date).toBe('2024-01-15');
      });

      const req = httpMock.expectOne('/api/currencies/2024-01-15');
      expect(req.request.method).toBe('GET');
      req.flush(mockRates);
    });

    it('powinien obsłużyć 404 dla brakującej daty', () => {
      service.getCurrenciesByDate('2099-01-01').subscribe({
        error: (err) => {
          expect(err.message).toContain('Nie znaleziono');
        }
      });

      const req = httpMock.expectOne('/api/currencies/2099-01-01');
      req.flush('Not Found', { status: 404, statusText: 'Not Found' });
    });
  });

  // ============ getAvailableCurrencies ============

  describe('getAvailableCurrencies', () => {
    it('powinien pobrać listę dostępnych walut', () => {
      const mockAvailable: AvailableCurrency[] = [
        { code: 'USD', name: 'dolar amerykański' },
        { code: 'EUR', name: 'euro' }
      ];

      service.getAvailableCurrencies().subscribe(result => {
        expect(result.length).toBe(2);
        expect(result[0].code).toBe('USD');
        expect(result[1].code).toBe('EUR');
      });

            const req = httpMock.expectOne('/api/currencies/available');
      expect(req.request.method).toBe('GET');
      req.flush(mockAvailable);
    });

    it('powinien zwrócić pustą listę gdy brak danych', () => {
      service.getAvailableCurrencies().subscribe(result => {
        expect(result.length).toBe(0);
      });

      const req = httpMock.expectOne('/api/currencies/available');
      req.flush([]);
    });
  });

  // ============ getDateRange ============

  describe('getDateRange', () => {
    it('powinien pobrać zakres dat', () => {
      const mockRange: DateRange = {
        min_date: '2023-01-01',
        max_date: '2024-06-15',
        total_records: 500
      };

      service.getDateRange().subscribe(result => {
        expect(result.min_date).toBe('2023-01-01');
        expect(result.max_date).toBe('2024-06-15');
        expect(result.total_records).toBe(500);
      });

      const req = httpMock.expectOne('/api/currencies/date-range');
      expect(req.request.method).toBe('GET');
      req.flush(mockRange);
    });

    it('powinien obsłużyć pustą bazę', () => {
      const mockRange: DateRange = {
        min_date: null,
        max_date: null,
        total_records: 0
      };

      service.getDateRange().subscribe(result => {
        expect(result.min_date).toBeNull();
        expect(result.total_records).toBe(0);
      });

      const req = httpMock.expectOne('/api/currencies/date-range');
      req.flush(mockRange);
    });
  });

  // ============ getAggregatedRates ============

  describe('getAggregatedRates', () => {
    const mockAggregated: AggregatedRate[] = [
      {
        period: '2024-01',
        currency_code: 'USD',
        avg_rate: 4.0215,
        min_rate: 3.98,
        max_rate: 4.05,
        count: 22
      },
      {
        period: '2024-02',
        currency_code: 'USD',
        avg_rate: 4.035,
        min_rate: 3.99,
        max_rate: 4.08,
        count: 20
      }
    ];

    it('powinien pobrać zagregowane kursy po miesiącach', () => {
      service.getAggregatedRates({
        currency_code: 'USD',
        group_by: 'month'
      }).subscribe(result => {
        expect(result.length).toBe(2);
        expect(result[0].period).toBe('2024-01');
        expect(result[0].avg_rate).toBe(4.0215);
        expect(result[0].count).toBe(22);
      });

      const req = httpMock.expectOne(
        (r) => r.url === '/api/currencies/aggregated'
          && r.params.get('currency_code') === 'USD'
          && r.params.get('group_by') === 'month'
      );
      expect(req.request.method).toBe('GET');
      req.flush(mockAggregated);
    });

    it('powinien pobrać zagregowane kursy po latach', () => {
      const yearlyData: AggregatedRate[] = [
        {
          period: '2023',
          currency_code: 'USD',
          avg_rate: 3.95,
          min_rate: 3.80,
          max_rate: 4.10,
          count: 250
        }
      ];

      service.getAggregatedRates({
        currency_code: 'USD',
        group_by: 'year'
      }).subscribe(result => {
        expect(result.length).toBe(1);
        expect(result[0].period).toBe('2023');
      });

      const req = httpMock.expectOne(
        (r) => r.params.get('group_by') === 'year'
      );
      req.flush(yearlyData);
    });

    it('powinien pobrać zagregowane kursy z filtrem dat', () => {
      service.getAggregatedRates({
        currency_code: 'EUR',
        group_by: 'day',
        date_from: '2024-01-01',
        date_to: '2024-01-31'
      }).subscribe();

      const req = httpMock.expectOne(
        (r) => r.url === '/api/currencies/aggregated'
          && r.params.get('date_from') === '2024-01-01'
          && r.params.get('date_to') === '2024-01-31'
      );
      req.flush(mockAggregated);
    });

    it('powinien obsłużyć 404 dla nieznanej waluty', () => {
      service.getAggregatedRates({
        currency_code: 'XYZ',
        group_by: 'month'
      }).subscribe({
        error: (err) => {
          expect(err.message).toContain('Nie znaleziono');
        }
      });

      const req = httpMock.expectOne(
        (r) => r.params.get('currency_code') === 'XYZ'
      );
      req.flush('Not Found', { status: 404, statusText: 'Not Found' });
    });
  });

  // ============ fetchFromNBP ============

  describe('fetchFromNBP', () => {
    it('powinien pobrać dane z NBP', () => {
      const mockResponse: FetchResponse = {
        message: 'Pobrano dane z API NBP',
        records_saved: 35,
        records_skipped: 0
      };

      service.fetchFromNBP({
        date_from: '2024-01-01',
        date_to: '2024-01-31',
        table: 'A'
      }).subscribe(result => {
        expect(result.records_saved).toBe(35);
        expect(result.records_skipped).toBe(0);
        expect(result.message).toContain('Pobrano');
      });

      const req = httpMock.expectOne('/api/currencies/fetch');
      expect(req.request.method).toBe('POST');
      expect(req.request.body.date_from).toBe('2024-01-01');
      expect(req.request.body.table).toBe('A');
      req.flush(mockResponse);
    });

    it('powinien obsłużyć duplikaty', () => {
      const mockResponse: FetchResponse = {
        message: 'Pobrano dane z API NBP',
        records_saved: 0,
        records_skipped: 35
      };

      service.fetchFromNBP({
        date_from: '2024-01-01',
        date_to: '2024-01-31',
        table: 'A'
      }).subscribe(result => {
        expect(result.records_saved).toBe(0);
        expect(result.records_skipped).toBe(35);
      });

      const req = httpMock.expectOne('/api/currencies/fetch');
      req.flush(mockResponse);
    });

    it('powinien obsłużyć błąd API NBP', () => {
      service.fetchFromNBP({
        date_from: '2024-01-01',
        date_to: '2024-01-31',
        table: 'A'
      }).subscribe({
        error: (err) => {
          expect(err.message).toContain('API NBP');
        }
      });

      const req = httpMock.expectOne('/api/currencies/fetch');
      req.flush(
        { detail: 'Błąd połączenia z API NBP' },
        { status: 502, statusText: 'Bad Gateway' }
      );
    });
  });

  // ============ fetchCurrentFromNBP ============

  describe('fetchCurrentFromNBP', () => {
    it('powinien pobrać aktualne kursy', () => {
      const mockResponse: FetchResponse = {
        message: 'Pobrano aktualne kursy',
        records_saved: 33,
        records_skipped: 0
      };

      service.fetchCurrentFromNBP().subscribe(result => {
        expect(result.records_saved).toBe(33);
      });

      const req = httpMock.expectOne('/api/currencies/fetch-current');
      expect(req.request.method).toBe('POST');
      req.flush(mockResponse);
    });
  });

  // ============ Obsługa błędów ============

  describe('obsługa błędów', () => {
    it('powinien obsłużyć brak połączenia z serwerem', () => {
      service.getCurrencies().subscribe({
        error: (err) => {
          expect(err.message).toContain('Brak połączenia');
        }
      });

      const req = httpMock.expectOne('/api/currencies/');
      req.error(new ProgressEvent('error'), { status: 0, statusText: 'Unknown Error' });
    });

    it('powinien obsłużyć błąd 422', () => {
      service.fetchFromNBP({
        date_from: '2024-03-15',
        date_to: '2024-03-01',
        table: 'A'
      }).subscribe({
        error: (err) => {
          expect(err.message).toContain('Nieprawidłowe');
        }
      });

      const req = httpMock.expectOne('/api/currencies/fetch');
      req.flush(
        { detail: 'Validation error' },
        { status: 422, statusText: 'Unprocessable Entity' }
      );
    });
  });
});
