# 💱 Kursy Walut NBP - Aplikacja Webowa

Aplikacja internetowa do pobierania i wyświetlania kursów walut z API Narodowego Banku Polskiego z podziałem na lata, kwartały, miesiące i dni.

---

## 🏗️ Architektura
┌─────────────┐ ┌─────────────┐ ┌─────────────┐ │ Frontend │────▶│ Backend │────▶│ PostgreSQL │ │ Angular 17 │◀────│ FastAPI │◀────│ Database │ │ (port 3000) │ │ (port 8000) │ │ (port 5432) │ └─────────────┘ └──────┬──────┘ └─────────────┘ │ ┌──────▼──────┐ │ API NBP │ │ api.nbp.pl │ └─────────────┘


Copy code

---

## 🛠️ Technologie
Warstwa

Technologia

Opis

Frontend

Angular 17

Interfejs użytkownika SPA

Wykresy

Chart.js 4

Wizualizacja kursów walut

Backend

FastAPI (Python)

REST API

ORM

SQLAlchemy 2

Mapowanie obiektowo-relacyjne

Baza danych

PostgreSQL 16

Przechowywanie kursów walut

HTTP Client

httpx

Komunikacja z API NBP

Konteneryzacja

Docker Compose

Orkiestracja kontenerów

Testy BE

Pytest + pytest-bdd

Testy jednostkowe i behawioralne

Testy FE

Jasmine + Karma

Testy komponentów Angular

🚀 Uruchomienie
Wymagania
Docker Desktop
Git
Start jednym poleceniem
bash

Copy code
# Klonowanie repozytorium
git clone https://github.com/USERNAME/currency-app.git
cd currency-app

# Uruchomienie wszystkich kontenerów
docker compose up --build
Dostęp do aplikacji
Usługa

URL

Frontend

http://localhost:3000

Backend API

http://localhost:8000

Swagger (API Docs)

http://localhost:8000/docs

ReDoc (API Docs)

http://localhost:8000/redoc

Zatrzymanie
bash

Copy code
# Zatrzymanie kontenerów
docker compose down

# Zatrzymanie z usunięciem danych bazy
docker compose down -v
📡 Endpointy API
Metoda

Endpoint

Opis

GET

/api/health

Status API

GET

/api/currencies/

Lista kursów (paginacja + filtry)

GET

/api/currencies/available

Lista unikalnych walut w bazie

GET

/api/currencies/date-range

Zakres dat dostępnych w bazie

GET

/api/currencies/aggregated

Zagregowane kursy wg okresu

GET

/api/currencies/{date}

Kursy z konkretnego dnia

POST

/api/currencies/fetch

Pobierz z NBP (zakres dat)

POST

/api/currencies/fetch-current

Pobierz aktualne kursy z NBP

Przykłady zapytań
bash

Copy code
# Pobierz kursy z NBP za styczeń 2024
curl -X POST http://localhost:8000/api/currencies/fetch \
  -H "Content-Type: application/json" \
  -d '{"date_from": "2024-01-01", "date_to": "2024-01-31", "table": "A"}'

# Lista kursów USD z paginacją
curl "http://localhost:8000/api/currencies/?currency_code=USD&page=1&per_page=10"

# Średnie miesięczne EUR
curl "http://localhost:8000/api/currencies/aggregated?currency_code=EUR&group_by=month"

# Średnie kwartalne USD za 2024
curl "http://localhost:8000/api/currencies/aggregated?currency_code=USD&group_by=quarter&date_from=2024-01-01&date_to=2024-12-31"

# Średnie roczne GBP
curl "http://localhost:8000/api/currencies/aggregated?currency_code=GBP&group_by=year"

# Kursy z konkretnego dnia
curl "http://localhost:8000/api/currencies/2024-01-15"

# Aktualne kursy
curl -X POST http://localhost:8000/api/currencies/fetch-current
📊 Funkcjonalności
Pobieranie danych
⬇️ Pobieranie aktualnych kursów jednym kliknięciem
📅 Pobieranie kursów z wybranego zakresu dat
📋 Obsługa tabel A (główne waluty) i B (pozostałe waluty)
🔄 Automatyczne pomijanie duplikatów przy ponownym pobieraniu
Wyświetlanie danych
📋 Tabela z kursami dziennymi
📊 Agregacja po latach, kwartałach, miesiącach i dniach
📈 Interaktywny wykres liniowy (średnia, minimum, maksimum)
🔍 Filtrowanie po walucie i zakresie dat
📄 Paginacja wyników
Statystyki na wykresie
Średni kurs w okresie
Kurs minimalny i maksymalny
Rozpiętość kursu (max - min)
Łączna liczba notowań
🧪 Testy
Backend
bash

Copy code
# Wejście do kontenera backendu
docker exec -it currency_backend bash

# Wszystkie testy
pytest -v

# Testy z pokryciem kodu
pytest --cov=app --cov-report=html -v

# Tylko testy endpointów
pytest tests/test_endpoints.py -v

# Tylko testy CRUD
pytest tests/test_crud.py -v

# Tylko testy serwisu NBP
pytest tests/test_nbp_service.py -v

# Tylko testy BDD
pytest tests/features/ -v
Frontend
bash

Copy code
cd frontend

# Testy z przeglądarką
ng test

# Testy CI (headless)
ng test --watch=false --browsers=ChromeHeadless --code-coverage
Podsumowanie testów
Moduł

Testy

Opis

Backend

test_endpoints.py

18

Testy wszystkich endpointów API

test_crud.py

16

Testy operacji na bazie danych

test_nbp_service.py

10

Testy komunikacji z API NBP

BDD (currencies.feature)

9

Scenariusze behawioralne

Frontend

currency.service.spec.ts

18

Testy serwisu HTTP

app.component.spec.ts

14

Testy głównego komponentu

currency-filter.component.spec

20

Testy filtrowania

currency-table.component.spec

18

Testy tabeli i paginacji

currency-chart.component.spec

10

Testy wykresu i statystyk

RAZEM

133

Wszystkie testy

📁 Struktura projektu

Copy code
currency-app/
├── docker-compose.yml              # Orkiestracja kontenerów
├── README.md                       # Dokumentacja projektu
├── .gitignore                      # Pliki ignorowane przez Git
│
├── database/
│   └── init.sql                    # Inicjalizacja bazy danych
│
├── backend/
│   ├── Dockerfile                  # Obraz Docker backendu
│   ├── requirements.txt            # Zależności Python
│   ├── pytest.ini                  # Konfiguracja testów
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py                 # Aplikacja FastAPI + CORS
│   │   ├── config.py               # Konfiguracja środowiska
│   │   ├── database.py             # Połączenie z PostgreSQL
│   │   ├── models.py               # Modele SQLAlchemy (ORM)
│   │   ├── schemas.py              # Schematy Pydantic (walidacja)
│   │   ├── crud.py                 # Operacje CRUD + agregacja
│   │   ├── routers/
│   │   │   ├── __init__.py
│   │   │   └── currencies.py       # Endpointy REST API
│   │   └── services/
│   │       ├── __init__.py
│   │       └── nbp_service.py      # Klient API NBP
│   └── tests/
│       ├── __init__.py
│       ├── conftest.py             # Fixtures testowe (SQLite)
│       ├── test_endpoints.py       # Testy endpointów API
│       ├── test_crud.py            # Testy operacji CRUD
│       ├── test_nbp_service.py     # Testy serwisu NBP
│       └── features/
│           ├── __init__.py
│           ├── conftest.py
│           ├── currencies.feature  # Scenariusze BDD (Gherkin)
│           └── steps/
│               ├── __init__.py
│               └── test_currencies_steps.py
│
└── frontend/
    ├── Dockerfile                  # Multi-stage build (Node → Nginx)
    ├── nginx.conf                  # Konfiguracja reverse proxy
    ├── package.json                # Zależności npm
    ├── angular.json                # Konfiguracja Angular CLI
    ├── proxy.conf.json             # Proxy dev server → backend
    ├── karma.conf.js               # Konfiguracja testów Karma
    ├── tsconfig.json               # Konfiguracja TypeScript
    └── src/
        ├── index.html              # Główny plik HTML
        ├── main.ts                 # Punkt wejścia aplikacji
        ├── styles.css              # Globalne style CSS
        ├── environments/
        │   ├── environment.ts      # Zmienne dev
        │   └── environment.prod.ts # Zmienne produkcyjne
        └── app/
            ├── app.module.ts       # Moduł główny Angular
            ├── app.component.ts    # Komponent główny
            ├── app.component.html  # Szablon główny
            ├── app.component.css   # Style główne
            ├── app.component.spec.ts
            ├── models/
            │   └── currency.model.ts    # Interfejsy TypeScript
            ├── services/
            │   ├── currency.service.ts      # Serwis HTTP
            │   └── currency.service.spec.ts # Testy serwisu
            └── components/
                ├── currency-filter/    # Filtrowanie + pobieranie NBP
                │   ├── currency-filter.component.ts
                │   ├── currency-filter.component.html
                │   ├── currency-filter.component.css
                │   └── currency-filter.component.spec.ts
                ├── currency-table/     # Tabela + paginacja
                │   ├── currency-table.component.ts
                │   ├── currency-table.component.html
                │   ├── currency-table.component.css
                │   └── currency-table.component.spec.ts
                └── currency-chart/     # Wykres Chart.js
                    ├── currency-chart.component.ts
                    ├── currency-chart.component.html
                    ├── currency-chart.component.css
                    └── currency-chart.component.spec.ts
🔧 Rozwój lokalny (bez Dockera)
Backend
bash

Copy code
cd backend

# Wirtualne środowisko
python -m venv venv
source venv/bin/activate        # Linux/Mac
# venv\Scripts\activate         # Windows

# Instalacja zależności
pip install -r requirements.txt

# Zmienna środowiskowa
export DATABASE_URL=postgresql://postgres:postgres@localhost:5432/currency_db

# Uruchomienie
uvicorn app.main:app --reload --port 8000

# Testy
pytest -v --cov=app
Frontend
bash

Copy code
cd frontend

# Instalacja zależności
npm install

# Uruchomienie (dev server z proxy do backendu)
npm start
# Aplikacja dostępna na http://localhost:4200

# Testy
ng test

# Build produkcyjny
ng build --configuration=production
Baza danych (lokalna w Dockerze)
bash

Copy code
docker run -d \
  --name currency_db \
  -e POSTGRES_DB=currency_db \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -p 5432:5432 \
  -v ./database/init.sql:/docker-entrypoint-initdb.d/init.sql \
  postgres:16-alpine
🐛 Rozwiązywanie problemów
Port 80 zajęty (Windows)
yaml

Copy code
# W docker-compose.yml zmień port frontendu:
frontend:
  ports:
    - "3000:80"    # zamiast "80:80"
Backend nie łączy się z bazą
bash

Copy code
# Sprawdź czy baza jest gotowa
docker exec -it currency_db pg_isready -U postgres

# Sprawdź logi
docker compose logs backend
docker compose logs db
Błąd połączenia z API NBP (502)

Copy code
Możliwe przyczyny:
- Brak internetu w kontenerze → dodaj dns: [8.8.8.8] w docker-compose.yml
- Weekend/święto → API NBP nie ma danych (zwraca 404, nie błąd)
- Zbyt duży zakres dat → max 367 dni w jednym zapytaniu
- VPN blokuje połączenie → tymczasowo wyłącz VPN
Frontend nie łączy się z backendem
bash

Copy code
# Sprawdź czy backend działa
curl http://localhost:8000/api/health

# Sprawdź logi nginx
docker compose logs frontend
📝 Źródła danych
API NBP: https://api.nbp