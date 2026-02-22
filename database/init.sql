-- Inicjalizacja bazy danych PostgreSQL

CREATE TABLE IF NOT EXISTS currencies (
    id SERIAL PRIMARY KEY,
    currency_code VARCHAR(3) NOT NULL,
    currency_name VARCHAR(100) NOT NULL,
    mid_rate DECIMAL(10, 6) NOT NULL,
    rate_date DATE NOT NULL,
    table_number VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Unikalne ograniczenie: jeden kurs na walutę na dzień
    UNIQUE(currency_code, rate_date)
);

-- Indeksy dla szybszego wyszukiwania
CREATE INDEX idx_currencies_date ON currencies(rate_date);
CREATE INDEX idx_currencies_code ON currencies(currency_code);
CREATE INDEX idx_currencies_code_date ON currencies(currency_code, rate_date);

-- Widok: kursy z informacją o roku, kwartale, miesiącu
CREATE OR REPLACE VIEW currencies_with_periods AS
SELECT 
    id,
    currency_code,
    currency_name,
    mid_rate,
    rate_date,
    table_number,
    EXTRACT(YEAR FROM rate_date)::INTEGER AS year,
    EXTRACT(QUARTER FROM rate_date)::INTEGER AS quarter,
    EXTRACT(MONTH FROM rate_date)::INTEGER AS month,
    EXTRACT(DAY FROM rate_date)::INTEGER AS day,
    TO_CHAR(rate_date, 'YYYY-Q') AS year_quarter,
    TO_CHAR(rate_date, 'YYYY-MM') AS year_month
FROM currencies
ORDER BY rate_date DESC;

-- Funkcja do obliczania średnich kursów
CREATE OR REPLACE FUNCTION get_average_rates(
    p_currency_code VARCHAR(3),
    p_group_by VARCHAR(10) -- 'year', 'quarter', 'month'
)
RETURNS TABLE(
    period TEXT,
    avg_rate DECIMAL(10, 6),
    min_rate DECIMAL(10, 6),
    max_rate DECIMAL(10, 6),
    count BIGINT
) AS $$
BEGIN
    IF p_group_by = 'year' THEN
        RETURN QUERY
        SELECT 
            EXTRACT(YEAR FROM rate_date)::TEXT,
            AVG(mid_rate)::DECIMAL(10,6),
            MIN(mid_rate)::DECIMAL(10,6),
            MAX(mid_rate)::DECIMAL(10,6),
            COUNT(*)
        FROM currencies
        WHERE currency_code = p_currency_code
        GROUP BY EXTRACT(YEAR FROM rate_date)
        ORDER BY EXTRACT(YEAR FROM rate_date);
    ELSIF p_group_by = 'quarter' THEN
        RETURN QUERY
        SELECT 
            TO_CHAR(rate_date, 'YYYY-Q'),
            AVG(mid_rate)::DECIMAL(10,6),
            MIN(mid_rate)::DECIMAL(10,6),
            MAX(mid_rate)::DECIMAL(10,6),
            COUNT(*)
        FROM currencies
        WHERE currency_code = p_currency_code
        GROUP BY TO_CHAR(rate_date, 'YYYY-Q')
        ORDER BY TO_CHAR(rate_date, 'YYYY-Q');
    ELSIF p_group_by = 'month' THEN
        RETURN QUERY
        SELECT 
            TO_CHAR(rate_date, 'YYYY-MM'),
            AVG(mid_rate)::DECIMAL(10,6),
            MIN(mid_rate)::DECIMAL(10,6),
            MAX(mid_rate)::DECIMAL(10,6),
            COUNT(*)
        FROM currencies
        WHERE currency_code = p_currency_code
        GROUP BY TO_CHAR(rate_date, 'YYYY-MM')
        ORDER BY TO_CHAR(rate_date, 'YYYY-MM');
    END IF;
END;
$$ LANGUAGE plpgsql;