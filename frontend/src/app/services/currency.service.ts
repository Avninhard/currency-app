import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import {
  CurrencyRate,
  AvailableCurrency,
  AggregatedRate,
  PaginatedResponse,
  FetchRequest,
  FetchResponse,
  DateRange,
  CurrencyFilterParams,
  HealthStatus
} from '../models/currency.model';

@Injectable({
  providedIn: 'root'
})
export class CurrencyService {

  private readonly apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  /**
   * Sprawdza status API.
   */
  getHealth(): Observable<HealthStatus> {
    return this.http.get<HealthStatus>(`${this.apiUrl}/health`).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Pobiera listę kursów z filtrowaniem i paginacją.
   */
  getCurrencies(params: CurrencyFilterParams = {}): Observable<PaginatedResponse> {
    let httpParams = new HttpParams();

    if (params.currency_code) {
      httpParams = httpParams.set('currency_code', params.currency_code);
    }
    if (params.date_from) {
      httpParams = httpParams.set('date_from', params.date_from);
    }
    if (params.date_to) {
      httpParams = httpParams.set('date_to', params.date_to);
    }
    if (params.page) {
      httpParams = httpParams.set('page', params.page.toString());
    }
    if (params.per_page) {
      httpParams = httpParams.set('per_page', params.per_page.toString());
    }

    return this.http.get<PaginatedResponse>(
      `${this.apiUrl}/currencies/`,
      { params: httpParams }
    ).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Pobiera kursy z konkretnego dnia.
   */
  getCurrenciesByDate(date: string): Observable<CurrencyRate[]> {
    return this.http.get<CurrencyRate[]>(
      `${this.apiUrl}/currencies/${date}`
    ).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Pobiera listę unikalnych walut w bazie.
   */
  getAvailableCurrencies(): Observable<AvailableCurrency[]> {
    return this.http.get<AvailableCurrency[]>(
      `${this.apiUrl}/currencies/available`
    ).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Pobiera zakres dat dostępnych w bazie.
   */
  getDateRange(): Observable<DateRange> {
    return this.http.get<DateRange>(
      `${this.apiUrl}/currencies/date-range`
    ).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Pobiera zagregowane kursy wg okresu.
   */
  getAggregatedRates(params: CurrencyFilterParams): Observable<AggregatedRate[]> {
    let httpParams = new HttpParams();

    if (params.currency_code) {
      httpParams = httpParams.set('currency_code', params.currency_code);
    }
    if (params.group_by) {
      httpParams = httpParams.set('group_by', params.group_by);
    }
    if (params.date_from) {
      httpParams = httpParams.set('date_from', params.date_from);
    }
    if (params.date_to) {
      httpParams = httpParams.set('date_to', params.date_to);
    }

    return this.http.get<AggregatedRate[]>(
      `${this.apiUrl}/currencies/aggregated`,
      { params: httpParams }
    ).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Pobiera dane z API NBP i zapisuje do bazy.
   */
  fetchFromNBP(request: FetchRequest): Observable<FetchResponse> {
    return this.http.post<FetchResponse>(
      `${this.apiUrl}/currencies/fetch`,
      request
    ).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Pobiera aktualne kursy z NBP.
   */
  fetchCurrentFromNBP(): Observable<FetchResponse> {
    return this.http.post<FetchResponse>(
      `${this.apiUrl}/currencies/fetch-current`,
      {}
    ).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Obsługa błędów HTTP.
   */
  private handleError(error: any): Observable<never> {
    let errorMessage = 'Wystąpił nieznany błąd';

    if (error.error instanceof ErrorEvent) {
      // Błąd po stronie klienta
      errorMessage = `Błąd: ${error.error.message}`;
    } else {
      // Błąd po stronie serwera
      switch (error.status) {
        case 0:
          errorMessage = 'Brak połączenia z serwerem';
          break;
        case 404:
          errorMessage = 'Nie znaleziono danych';
          break;
        case 422:
          errorMessage = 'Nieprawidłowe dane wejściowe';
          break;
        case 502:
          errorMessage = 'Błąd połączenia z API NBP';
          break;
        default:
          errorMessage = error.error?.detail || `Błąd serwera: ${error.status}`;
      }
    }

    console.error('CurrencyService Error:', errorMessage, error);
    return throwError(() => new Error(errorMessage));
  }
}
