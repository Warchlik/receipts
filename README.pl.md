# Receipts

Backend do dzielenia wspólnych rachunków — paragonów, zakupów, kolacji — pomiędzy grupą osób, w tym osobami, które nie mają konta w aplikacji.

> 🇬🇧 English version: [README.md](./README.md)

## Problem

Podział rachunku ze znajomymi brzmi banalnie, dopóki nie spróbuje się tego realnie zaimplementować:

- Nie każdy w grupie chce zakładać konto w aplikacji tylko po to, żeby rozliczyć 20 zł za pizzę.
- "Podział po równo" nie zawsze wystarcza — czasem ktoś nie zamawiał alkoholu, czasem ktoś chce ręcznie skorygować swoją część, a czasem sprawiedliwy podział to "kto zamówił dany item, ten za niego płaci".
- Ktoś musi wyłożyć pieniądze za wszystkich, a grupa potrzebuje prostego, jednoznacznego widoku tego, kto ile jeszcze jest winien.
- Ludzie dołączają do grupy już po jej utworzeniu — gość dodany dziś po imieniu, jutro musi móc stać się prawdziwym, zalogowanym kontem, bez utraty swojej historii.

Ten projekt to API, które modeluje ten problem poprawnie, zamiast zakładać, że każdy uczestnik jest zarejestrowanym użytkownikiem od pierwszego dnia.

## Kluczowe funkcjonalności

- **Goście (guest members)** — dodanie osoby do paragonu wyłącznie po imieniu, bez konieczności zakładania konta. Jej udział, status płatności i historia są śledzone od momentu dodania.
- **Linki z zaproszeniem** — twórca paragonu generuje zaproszenie oparte na tokenie (ważne 7 dni, jednorazowego użytku), które pozwala realnej osobie przejąć istniejącą tożsamość gościa albo dołączyć do paragonu bezpośrednio. Publiczny, niewymagający logowania endpoint podglądu pozwala pokazać _kogo/co_ dotyczy zaproszenie, zanim odbiorca się zaloguje.
- **Trzy tryby podziału**, wybierane per paragon:
  - **Równy (equal)** — kwota dzielona jest równo między członków, z resztą z zaokrąglenia przypisywaną w deterministyczny sposób, tak aby suma zawsze się zgadzała co do grosza.
  - **Ręczny (manual)** — twórca ustawia kwotę każdego członka bezpośrednio.
  - **Pozycyjny (itemized)** — każda pozycja z paragonu jest przypisana do wybranej grupy członków i dzielona po równo tylko między nich; suma dla członka to suma pozycji, w których bierze udział.
- **Ręczne nadpisania** — w trybie równym/pozycyjnym kwota dowolnego członka wciąż może zostać ręcznie skorygowana; po nadpisaniu silnik podziału wyklucza tego członka z automatycznego przeliczania, dopóki nadpisanie nie zostanie jawnie zresetowane.
- **Podsumowanie rozliczenia** — jeden endpoint odpowiadający na pytanie "kto zapłacił, kto nie, i ile jeszcze zostało do zebrania", poprawnie wykluczający udział samego twórcy (zakładamy, że to on wyłożył pieniądze za rachunek, więc nie jest sam sobie nic winien).

## Stos technologiczny

| Warstwa            | Wybór                                                                                                      |
| ------------------ | ---------------------------------------------------------------------------------------------------------- |
| Środowisko / język | Node.js, TypeScript                                                                                        |
| Framework HTTP     | Express 5                                                                                                  |
| Baza danych        | PostgreSQL, [Drizzle ORM](https://orm.drizzle.team/) (schemat, migracje, query builder)                    |
| Autoryzacja        | [better-auth](https://www.better-auth.com/) (email/hasło, tokeny bearer)                                   |
| Walidacja          | Zod v4, middleware na poziomie requestów                                                                   |
| Testy              | Vitest + Supertest — testy integracyjne na realnej, działającej instancji aplikacji i realnej bazie danych |
| Dokumentacja       | OpenAPI 3 (swagger-jsdoc), serwowana pod `/api/docs`                                                       |
| Narzędzia          | monorepo pnpm workspaces + Turborepo, ESLint, Prettier                                                     |

## Architektura

API jest zorganizowane jako małe, samodzielne moduły w `apps/api/src/modules/`, z których każdy trzyma się tej samej konwencji warstw:

```
<moduł>.routes.ts       Router Express + adnotacje OpenAPI
<moduł>.controller.ts   Warstwa HTTP: parsuje request, woła serwis, formatuje odpowiedź
<moduł>.service.ts      Reguły biznesowe i sprawdzanie uprawnień
<moduł>.repository.ts   Zapytania Drizzle — jedyne miejsce dotykające bazy bezpośrednio
<moduł>.schema.ts       Schematy walidacji Zod
```

Obecne moduły: `receipts` (paragony, członkowie, rozliczenie, silnik podziału), `invites`, `expenses`, `profiles`, `auth`.

Wywołania między modułami odbywają się wyłącznie przez publiczne metody serwisów (np. moduł `invites` woła `ReceiptsService`, żeby przejąć członka albo dodać zalogowanego użytkownika) — żaden moduł nie sięga bezpośrednio do repozytorium innego modułu.

## Model danych (uproszczony)

```
receipts               jeden rachunek — kwota, waluta i split_type (equal | manual | itemized)
receipt_members         osoba dzieląca paragon — albo zarejestrowany user_id, albo guest_name, nigdy oba naraz
receipt_invites          jednorazowy, wygasający token pozwalający realnemu userowi przejąć wiersz receipt_member
expenses                pozycja na paragonie (używana w trybie pozycyjnym)
expense_splits           którzy receipt_members dzielą daną pozycję
```

Wiersz `receipt_member` jest celowo punktem łączącym "imię na paragonie" z "prawdziwym kontem" — gość może zostać przejęty przez realnego użytkownika później, bez utraty swojego `amount_owed`, `paid_at` czy historii.

## Przegląd API

Wszystkie trasy są zamontowane pod `/api` i wymagają tokenu bearer, chyba że zaznaczono inaczej.

```
POST   /api/auth/sign-up/email          Rejestracja
POST   /api/auth/sign-in/email          Logowanie
GET    /api/auth/session                 Aktualna sesja

GET    /api/receipts                     Lista paragonów, w których bierzesz udział
POST   /api/receipts                     Utworzenie paragonu
GET    /api/receipts/:id                 Pobranie paragonu
PATCH  /api/receipts/:id                 Aktualizacja paragonu (tylko twórca)
DELETE /api/receipts/:id                 Usunięcie paragonu (tylko twórca)
GET    /api/receipts/:id/settlement      Kto ile jest winien, kto zapłacił

GET    /api/receipts/:id/members         Lista członków
POST   /api/receipts/:id/members         Dodanie członka (gość lub zarejestrowany user)
PATCH  /api/receipts/:id/members/:memberId          Aktualizacja kwoty / statusu płatności
DELETE /api/receipts/:id/members/:memberId          Usunięcie członka
PATCH  /api/receipts/:id/members/:memberId/claim     Przejęcie tożsamości gościa jako siebie

GET    /api/receipts/:id/expenses                   Lista pozycji na paragonie
POST   /api/receipts/:id/expenses                   Dodanie pozycji
PATCH  /api/receipts/:id/expenses/:expenseId         Aktualizacja pozycji
DELETE /api/receipts/:id/expenses/:expenseId         Usunięcie pozycji
PUT    /api/receipts/:id/expenses/:expenseId/splits  Ustawienie, którzy członkowie dzielą tę pozycję

POST   /api/receipts/:id/invites          Wygenerowanie linku z zaproszeniem (tylko twórca)
GET    /api/invites/:token                Publiczny podgląd zaproszenia (bez logowania)
POST   /api/invites/:token/accept         Akceptacja zaproszenia

GET    /api/profiles/me                   Pobranie własnego profilu
PATCH  /api/profiles/me                   Aktualizacja własnego profilu
```

Pełna, interaktywna dokumentacja (schematy requestów/odpowiedzi) jest serwowana pod `/api/docs`, gdy serwer jest uruchomiony.

## Testy

Testy integracyjne uruchamiane są na realnej instancji aplikacji Express i realnej bazie Postgres — bez mockowania warstwy bazodanowej. Pokrywają m.in.:

- Logikę zaokrągleń i nadpisań w silniku podziału (tryby równy / pozycyjny).
- Granice autoryzacji (członek nie może przejąć uprawnień twórcy; dane paragonu nie wyciekają do osób spoza niego).
- Przypadki brzegowe znalezione poprzez celowy, adwersarialny przegląd kodu: znaki wildcard SQL `LIKE` w imionach gości, race condition między dwiema osobami akceptującymi to samo zaproszenie, tworzenie duplikatów tokenów zaproszeń.

```bash
pnpm --filter api test
```

## Uruchomienie lokalnie

```bash
pnpm install
cp apps/api/.env.example apps/api/.env   # następnie ustaw DATABASE_URL na działający Postgres
pnpm --filter api db:migrate
pnpm dev
```

Alternatywnie: `docker-compose.yml`, żeby uruchomić Postgres razem z API.

## Status projektu i dalsze plany

To repozytorium obejmuje obecnie wyłącznie **backend**. Zaplanowane, ale jeszcze nierozpoczęte są dwa klienty:

- Aplikacja mobilna (React Native + Expo) — główny klient.
- Strona typu landing page (Next.js).

Po powstaniu klienta mobilnego, kolejną planowaną funkcjonalnością backendu jest **skanowanie paragonów przez OCR** — wyciąganie pozycji bezpośrednio ze zdjęcia paragonu, zamiast wpisywania ich ręcznie.
