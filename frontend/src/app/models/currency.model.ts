/**
 * Pojedynczy kurs waluty z bazy danych.
 */
export interface CurrencyRate {
  id: number;
  currency_code: string;
  currency_name: string;
  mid_rate: number;
  rate_date: string;
  table_number: string | null;
  created_at?: string;
}

/**
 * Waluta dostępna w bazie (unikalna).
 */
export interface AvailableCurrency {
  code: string;
  name: string;
}

/**
 * Zagregowany kurs za okres (rok/kwartał/miesiąc/dzień).
 */
export interface AggregatedRate {
  period: string;
  currency_code: string;
  avg_rate: number;
  min_rate: number;
  max_rate: number;
  count: number;
}

/**
 * Odpowiedź z paginacją.
 */
export interface PaginatedResponse {
  data: CurrencyRate[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

/**
 * Żądanie pobrania danych z NBP.
 */
export interface FetchRequest {
  date_from: string;
  date_to: string;
  table: string;
}

/**
 * Odpowiedź po pobraniu danych z NBP.
 */
export interface FetchResponse {
  message: string;
  records_saved: number;
  records_skipped: number;
}

/**
 * Zakres dat dostępnych w bazie.
 */
export interface DateRange {
  min_date: string | null;
  max_date: string | null;
  total_records: number;
}

/**
 * Typ grupowania.
 */
export type GroupByPeriod = 'year' | 'quarter' | 'month' | 'day';

/**
 * Parametry filtrowania kursów.
 */
export interface CurrencyFilterParams {
  currency_code?: string;
  date_from?: string;
  date_to?: string;
  group_by?: GroupByPeriod;
  page?: number;
  per_page?: number;
}

/**
 * Status zdrowia API.
 */
export interface HealthStatus {
  status: string;
  version: string;
}
