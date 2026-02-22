Feature: Zarządzanie kursami walut
  Jako użytkownik aplikacji
  Chcę pobierać i przeglądać kursy walut z podziałem na okresy

  Background:
    Given baza danych jest pusta

  Scenario: Pobranie aktualnych kursów z NBP
    When wysyłam żądanie pobrania kursów z dnia "2024-01-15" do "2024-01-15"
    Then odpowiedź ma status 200
    And odpowiedź zawiera pole "records_saved"

  Scenario: Wyświetlenie kursów z konkretnego dnia
    Given w bazie istnieją kursy z dnia "2024-01-15"
    When pobieram kursy z dnia "2024-01-15"
    Then odpowiedź ma status 200
    And lista kursów nie jest pusta

  Scenario: Wyświetlenie kursów z dnia bez danych
    When pobieram kursy z dnia "2099-01-01"
    Then odpowiedź ma status 404

  Scenario: Filtrowanie kursów po walucie
    Given w bazie istnieją kursy z dnia "2024-01-15"
    When pobieram listę kursów z filtrem waluty "USD"
    Then odpowiedź ma status 200
    And wszystkie zwrócone kursy mają kod "USD"

  Scenario: Agregacja kursów po miesiącach
    Given w bazie istnieją kursy z dnia "2024-01-15"
    And w bazie istnieją kursy z dnia "2024-02-15"
    When pobieram zagregowane kursy "USD" grupowane po "month"
    Then odpowiedź ma status 200
    And wynik zawiera co najmniej 2 okresy

  Scenario: Agregacja kursów po latach
    Given w bazie istnieją kursy z dnia "2023-06-15"
    And w bazie istnieją kursy z dnia "2024-01-15"
    When pobieram zagregowane kursy "USD" grupowane po "year"
    Then odpowiedź ma status 200
    And wynik zawiera co najmniej 2 okresy

  Scenario: Lista dostępnych walut
    Given w bazie istnieją kursy z dnia "2024-01-15"
    When pobieram listę dostępnych walut
    Then odpowiedź ma status 200
    And lista zawiera walutę "USD"
    And lista zawiera walutę "EUR"

  Scenario: Paginacja wyników
    Given w bazie istnieją kursy z dnia "2024-01-15"
    And w bazie istnieją kursy z dnia "2024-02-15"
    When pobieram listę kursów ze stroną 1 i limitem 2
    Then odpowiedź ma status 200
    And zwrócono dokładnie 2 rekordy
    And odpowiedź zawiera informację o łącznej liczbie stron

  Scenario: Zakres dat w bazie
    Given w bazie istnieją kursy z dnia "2024-01-15"
    When pobieram zakres dat
    Then odpowiedź ma status 200
    And odpowiedź zawiera pole "min_date"
    And odpowiedź zawiera pole "max_date"