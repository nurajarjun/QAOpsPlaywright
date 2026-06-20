# QAOpsPlaywright — Project Reference

> Single source of truth. Everything about how this project is built, how it works, and how to use it.

---

## Table of Contents

1. [What This Project Is](#1-what-this-project-is)
2. [Tech Stack](#2-tech-stack)
3. [Project Structure](#3-project-structure)
4. [The src/ Layer — Building Blocks](#4-the-src-layer--building-blocks)
5. [Test Suites](#5-test-suites)
6. [Configuration System](#6-configuration-system)
7. [Test Data](#7-test-data)
8. [GitHub Actions Workflow](#8-github-actions-workflow)
9. [Credential Handling and Secrets](#9-credential-handling-and-secrets)
10. [How to Run Locally](#10-how-to-run-locally)
11. [Docker](#11-docker)
12. [How to Add a New Test](#12-how-to-add-a-new-test)
13. [EventHub API — Key Facts](#13-eventhub-api--key-facts)
14. [SOAP Testing Approach](#14-soap-testing-approach)
15. [Known Limitations](#15-known-limitations)

---

## 1. What This Project Is

**QAOpsPlaywright** is a test automation framework for a team of 5:
- **1 person** writes and maintains tests (TypeScript)
- **4 people** trigger runs from GitHub Actions — no code, just a dropdown UI

The framework tests two applications:
- **EventHub API** (`api.eventhub.rahulshettyacademy.com`) — a REST API for events and bookings
- **Ecom web app** (`rahulshettyacademy.com`) — a demo e-commerce site (browser + API)
- **Axis2 SOAP service** (`216.10.245.166:8080`) — an internal Apache Axis2 SOAP service (internal network only)

**GitHub repo:** https://github.com/nurajarjun/QAOpsPlaywright

---

## 2. Tech Stack

| Tool | Version | Purpose |
|------|---------|---------|
| Playwright | 1.59.1 | Test runner, browser automation, HTTP request context |
| TypeScript | 5.4.5 | Language for all tests and src/ code |
| Node.js | LTS (v24 in CI) | Runtime |
| fast-xml-parser | 4.5.0 | Parsing SOAP XML responses |
| GitHub Actions | — | CI/CD, team test execution UI |
| Docker | — | Container-based local execution |

**Browser in CI:** System Chrome (`channel: 'chrome'` in playwright.config.ts). GitHub's `ubuntu-latest` runners have `google-chrome-stable` pre-installed — **no `npx playwright install` step needed**.

**Browser locally:** Playwright-managed Chromium + WebKit (run `npx playwright install` once).

---

## 3. Project Structure

```
QAOpsPlaywright/
│
├── .github/
│   └── workflows/
│       └── playwright.yml        ← GitHub Actions pipeline (team's execution UI)
│
├── config/
│   ├── playwright.config.ts      ← Master Playwright config (reads TEST_ENV variable)
│   └── environments/
│       ├── dev.json              ← baseUrl, timeout: 30s, retries: 1
│       ├── staging.json          ← baseUrl, timeout: 45s, retries: 1
│       └── prod.json             ← baseUrl, timeout: 60s, retries: 2
│
├── src/                          ← All reusable TypeScript code (not tests)
│   ├── pages/
│   │   ├── BasePage.ts           ← Abstract base: waitForPageLoad, getTitle, getURL, locator()
│   │   ├── LoginPage.ts          ← goTo(), validLogin(), loginExpectingError()
│   │   ├── DashboardPage.ts      ← searchProductAddCart(), navigateToCart(), navigateToOrders()
│   │   ├── CartPage.ts           ← verifyProductIsDisplayed(), checkout()
│   │   ├── OrdersReviewPage.ts   ← searchCountryAndSelect(), submitAndGetOrderId()
│   │   ├── OrdersHistoryPage.ts  ← searchOrderAndSelect(), getOrderId()
│   │   └── POManager.ts          ← Facade: creates all pages, single import point
│   │
│   ├── helpers/
│   │   ├── EventHubApiHelper.ts  ← Full EventHub REST API client (auth, events, bookings, health)
│   │   └── ApiHelper.ts          ← Ecom API client (getToken, createOrder)
│   │
│   ├── fixtures/
│   │   └── index.ts              ← Custom Playwright fixtures: poManager, apiHelper, eventHubApi, testDataForOrder
│   │
│   ├── types/
│   │   ├── index.ts              ← Ecom interfaces: User, OrderTestData, LoginPayload, OrderPayload, ApiResponse, EnvironmentConfig
│   │   └── eventhub.ts           ← EventHub interfaces: AuthInput, AuthResponse, Event, Booking, PaginatedResponse, etc.
│   │
│   └── constants/
│       └── index.ts              ← URLS, API_ENDPOINTS, TIMEOUTS, BROWSERS, TestTag enum
│
├── tests/
│   ├── api/                      ← API tests — no browser, use request context
│   │   ├── auth.spec.ts          ← EventHub: register, login, /auth/me (10 tests)
│   │   ├── events.spec.ts        ← EventHub: GET/POST/PUT/DELETE /events (10 tests)
│   │   ├── bookings.spec.ts      ← EventHub: GET/POST/DELETE /bookings (15 tests)
│   │   ├── health.spec.ts        ← EventHub: /health, /config (2 tests)
│   │   ├── orders-api.spec.ts    ← Ecom: login + create order (2 tests — skips without credentials)
│   │   └── soap-version.spec.ts  ← Axis2 SOAP: SOAP 1.1, SOAP 1.2, error handling (internal only)
│   │
│   ├── e2e/
│   │   └── order-flow.spec.ts    ← Full browser order flow: login → search → cart → checkout → confirm (skips without credentials)
│   │
│   └── ui/
│       ├── login.spec.ts         ← Browser login: valid login navigates to dashboard, invalid stays on page (skips without credentials)
│       └── calendar.spec.ts      ← Placeholder — navigates to date picker page, no assertions yet
│
├── data/
│   ├── order-test-data.json      ← Default ecom credentials and product name
│   ├── eventhub-test-data.json   ← EventHub test user, event shape, booking shape
│   └── users.json                ← Additional user data
│
├── docs/
│   ├── REFERENCE.md              ← This file
│   ├── Framework-Reference.md    ← Concise layer-by-layer explanation
│   ├── QAOpsPlaywright-Complete-Guide.md ← Expanded guide with examples
│   └── IT-Network-Setup-Request.md ← IT/firewall request for SOAP internal access
│
├── utils/                        ← Legacy JavaScript utilities (kept for reference, not used by TypeScript tests)
│   ├── test-base.js
│   ├── APiUtils.js
│   └── placeorderTestData.json
│
├── Dockerfile                    ← Container image for running tests
├── docker-compose.yml            ← Docker Compose: mounts reports/ and test-results/ volumes
├── tsconfig.json                 ← TypeScript: module Node16, moduleResolution node16, strict
└── package.json                  ← Scripts and dependencies
```

---

## 4. The src/ Layer — Building Blocks

### 4.1 BasePage

`src/pages/BasePage.ts` — abstract class that all page objects extend.

```
BasePage
  ├── this.page         ← Playwright Page object
  ├── waitForPageLoad() ← waits for networkidle (all network requests settled)
  ├── getTitle()        ← returns page <title>
  ├── getURL()          ← returns current URL
  └── locator(selector) ← thin wrapper over page.locator() for DRY selectors
```

Every page object calls `super(page)` to get these shared helpers.

---

### 4.2 Page Objects

Each page maps to one screen in the Ecom app.

**LoginPage** (`/client`)
```
goTo()                          → navigates to /client
validLogin(user, pass)          → fills #userEmail, #userPassword, clicks Login, waits for networkidle
loginExpectingError(user, pass) → same but races with the error toast (toast appears and disappears quickly)
```

**DashboardPage** (`/client/dashboard`)
```
searchProductAddCart(name)  → loops .card-body cards, finds exact name match, clicks "Add To Cart"
navigateToCart()            → clicks cart router link, waits for networkidle
navigateToOrders()          → clicks orders button, waits for networkidle
```

**CartPage**
```
verifyProductIsDisplayed(name) → asserts h3 with product name is visible
checkout()                     → clicks Checkout, waits for networkidle
```

**OrdersReviewPage**
```
searchCountryAndSelect(text, country) → types into country autocomplete, waits for dropdown,
                                        uses regex ^\\s*country\\s*$ to avoid partial matches
                                        (e.g. prevents "British Indian Ocean" matching "India")
submitAndGetOrderId()                 → clicks submit, waits for networkidle,
                                        extracts order ID from .em-spacer-1 text,
                                        strips surrounding pipe characters "| abc123 |"
```

**OrdersHistoryPage**
```
searchOrderAndSelect(orderId) → scans tbody rows, uses orderId.includes(rowId) match
                                 (server ID may be a substring of the order ID)
                                 clicks the row's first button, waits for networkidle
getOrderId()                  → reads .col-text text content
```

**POManager** — single import point for tests. Creates all five page objects from one `Page` instance.

```typescript
// In a test:
const { poManager } = fixtures;
const loginPage = poManager.getLoginPage();
const dashboard = poManager.getDashboardPage();
// ... etc
```

---

### 4.3 EventHubApiHelper

`src/helpers/EventHubApiHelper.ts`

Full REST API client for the EventHub backend. Base URL: `https://api.eventhub.rahulshettyacademy.com/api` (overridable via `EVENTHUB_API_URL` env var).

**Auth methods**
```
register(input)          → POST /auth/register
login(input)             → POST /auth/login
loginAndSetToken(input)  → login + extracts token + stores as this.token (used by all subsequent calls)
me(token?)               → GET /auth/me
```

**Token handling:** `loginAndSetToken()` stores the token on the instance. All other methods have an optional `token?` param — if omitted, they use `this.token`. This means:
```typescript
await api.loginAndSetToken({ email, password }); // sets this.token
await api.createEvent(payload);                  // automatically uses this.token
await api.listEvents();                          // automatically uses this.token
```

**Events methods**
```
listEvents(params?, token?)        → GET /events (supports ?city=, ?page=, ?limit=)
createEvent(input, token?)         → POST /events (requires auth)
getEvent(id, token?)               → GET /events/:id
updateEvent(id, input, token?)     → PUT /events/:id (requires auth)
deleteEvent(id, token?)            → DELETE /events/:id (requires auth)
```

**Bookings methods**
```
listBookings(params?, token?)      → GET /bookings (supports ?eventId=, ?status=, ?page=, ?limit=)
createBooking(input, token?)       → POST /bookings (requires auth)
getBooking(id, token?)             → GET /bookings/:id
getBookingByRef(ref, token?)       → GET /bookings/ref/:ref
cancelBooking(id, token?)          → DELETE /bookings/:id
```

**Utility**
```
health()  → GET /health  → { status, timestamp, dbStatus }
config()  → GET /config  → feature flags object
```

**Private `bearer()` method** — builds the `{ Authorization: "Bearer <token>" }` header. Returns an empty object `{}` if no token, so unauthenticated request tests don't need to do anything special.

---

### 4.4 ApiHelper

`src/helpers/ApiHelper.ts`

Simpler client for the Ecom REST API. Base URL: `https://rahulshettyacademy.com/api/ecom` (overridable via `API_BASE_URL` env var).

```
getToken(loginPayload)                → POST /auth/login → returns token string
createOrder(loginPayload, orderPayload) → getToken() then POST /order/create-order
                                         → returns { token, orderId }
```

Note: `createOrder` is a two-step operation that handles auth internally.

---

### 4.5 Fixtures

`src/fixtures/index.ts` — extends Playwright's base `test` with four fixtures available in every test file.

```
poManager        ← new POManager(page)    — all page objects wired to the current page
apiHelper        ← new ApiHelper(ctx)     — Ecom API client with its own request context
eventHubApi      ← new EventHubApiHelper(ctx) — EventHub API client with its own request context
testDataForOrder ← { username, password, productName }
                   priority: TEST_USERNAME/TEST_PASSWORD/TEST_PRODUCT env vars
                   fallback: data/order-test-data.json[0]
```

All tests import from `src/fixtures/index.js` instead of `@playwright/test` directly. This gives access to all four fixtures as test parameters.

```typescript
import { test, expect } from '../../src/fixtures/index.js';

test('example', async ({ poManager, eventHubApi, testDataForOrder }) => {
  // poManager, eventHubApi, testDataForOrder all ready to use
});
```

The `.js` extension in imports is required by TypeScript's `moduleResolution: node16` — TypeScript compiles `.ts` files to `.js`, so imports reference the output extension.

---

### 4.6 Types

**`src/types/index.ts`** — Ecom API shapes:
- `User` — `{ username, password }`
- `OrderTestData` — `{ username, password, productName }`
- `LoginPayload` — `{ userEmail, userPassword }` (matches Ecom API field names)
- `OrderPayload` — `{ orders: [{ country, productOrderedId }] }`
- `ApiResponse` — `{ token, orderId }`
- `EnvironmentConfig` — `{ baseUrl, apiBaseUrl, timeout, retries, headless }`

**`src/types/eventhub.ts`** — EventHub API shapes:
- `AuthInput` — `{ email, password }`
- `AuthResponse` — `{ token, user: { id, email } }`
- `Event` — full event object with `id, title, category, venue, city, eventDate, price, totalSeats, availableSeats`
- `CreateEventInput` — event without `id` and `availableSeats` (server-computed)
- `Booking` — full booking: `id, bookingRef, eventId, customerName, customerEmail, customerPhone, quantity, status`
- `CreateBookingInput` — booking without `id, bookingRef, status`
- `PaginatedResponse<T>` — `{ data: T[], pagination: { total, page, limit, totalPages } }`
- `HealthResponse` — `{ status, timestamp, dbStatus }`

---

### 4.7 Constants

`src/constants/index.ts`

```typescript
URLS = {
  LOGIN:          '/client',
  DASHBOARD:      '/client/dashboard',
  ORDERS_HISTORY: '/client/ordersHistory',
}

API_ENDPOINTS = {
  LOGIN:        '/auth/login',
  CREATE_ORDER: '/order/create-order',
  GET_ORDERS:   '/order/get-orders-for-customer',
}

TIMEOUTS = {
  SHORT:   5_000,
  DEFAULT: 30_000,
  LONG:    60_000,
}

TestTag = {
  WEB: '@Web',
  API: '@API',
  E2E: '@E2E',
  UI:  '@UI',
}
```

---

## 5. Test Suites

### 5.1 EventHub Auth (`tests/api/auth.spec.ts`) — 10 tests

Tag: `@API`

Tests the EventHub authentication endpoints.

| Test | What it verifies |
|------|-----------------|
| valid registration returns 201 with token | POST /auth/register with valid email/password |
| duplicate registration returns 400 | same email cannot register twice |
| missing email returns 400 | validation on registration |
| missing password returns 400 | validation on registration |
| valid login returns 200 with token | POST /auth/login |
| wrong password returns 400 | auth rejects bad credentials |
| non-existent user returns 400 or 404 | auth rejects unknown user |
| valid token returns user identity | GET /auth/me with valid Bearer token |
| missing token returns 401 | /auth/me without Authorization header |
| invalid token returns 401 | /auth/me with garbage token |

**Pattern:** Each test calls `beforeEach` which calls `loginAndSetToken()` to refresh the token. Tests that verify auth endpoints directly make their own requests without using the fixture token.

---

### 5.2 EventHub Events (`tests/api/events.spec.ts`) — 10 tests

Tag: `@API`

| Test | What it verifies |
|------|-----------------|
| returns paginated event list | GET /events returns `{ data, pagination }` structure |
| filters by city | GET /events?city= returns only matching events |
| custom page and limit respected | GET /events?page=1&limit=5 returns correct slice |
| creates event — availableSeats equals totalSeats | POST /events; confirms server sets availableSeats = totalSeats |
| missing required field returns 400 | POST /events without title |
| unauthenticated request returns 401 | POST /events without token |
| returns event by id | GET /events/:id |
| non-existent id returns 404 | GET /events/999999 |
| updates event title and price | PUT /events/:id; re-fetches and asserts new values |
| deletes event — subsequent GET returns 404 | DELETE /events/:id; confirms 404 after |

---

### 5.3 EventHub Bookings (`tests/api/bookings.spec.ts`) — 15 tests

Tag: `@API`

Creates a test event in `beforeAll`, uses its ID for booking tests, then deletes it in `afterAll`.

| Test | What it verifies |
|------|-----------------|
| creates booking and decrements available seats | POST /bookings; asserts availableSeats reduced |
| quantity exceeding available seats returns 400 | over-capacity check |
| quantity 0 returns 400 | minimum quantity validation |
| quantity 11 (above max 10) returns 400 | maximum quantity per booking |
| non-existent eventId returns 400 or 404 | booking for unknown event |
| missing customerName returns 400 | required field validation |
| returns paginated booking list | GET /bookings |
| filters by eventId | GET /bookings?eventId= |
| filters by status=confirmed | GET /bookings?status=confirmed |
| returns booking by id | GET /bookings/:id |
| non-existent id returns 404 | GET /bookings/999999 |
| returns booking by reference | GET /bookings/ref/:bookingRef |
| invalid reference returns 404 | GET /bookings/ref/FAKE |
| cancels booking and restores seats | DELETE /bookings/:id; asserts availableSeats restored |
| cancel non-existent booking returns 404 | DELETE /bookings/999999 |

---

### 5.4 EventHub Health (`tests/api/health.spec.ts`) — 2 tests

Tag: `@API`

| Test | What it verifies |
|------|-----------------|
| GET /health returns status 200 with db online | `{ status: "ok", dbStatus: "online" }` |
| GET /config returns feature flags | response contains an object with at least one key |

---

### 5.5 Ecom Orders API (`tests/api/orders-api.spec.ts`) — 2 tests

Tag: `@API`

**Skip guard:** entire suite skips if `TEST_USERNAME` or `TEST_PASSWORD` env vars are not set.

| Test | What it verifies |
|------|-----------------|
| login returns a valid token | POST /api/ecom/auth/login with provided credentials |
| create order returns orderId | POST /api/ecom/order/create-order (skipped if product list returns HTML) |

Credentials come from `TEST_USERNAME` / `TEST_PASSWORD` env vars only — no hardcoded fallback.

---

### 5.6 SOAP Version Service (`tests/api/soap-version.spec.ts`) — 11 tests

Tag: `@API`

**Reachability:** Target IP `216.10.245.166` is on an internal network. Not reachable from GitHub Actions runners — use the "SOAP Version (internal network only)" option only when running on a machine with LAN access or a self-hosted runner on that network.

See [Section 14](#14-soap-testing-approach) for the full technical explanation.

| Group | Tests |
|-------|-------|
| SOAP 1.1 | returns HTTP 200; Content-Type is text/xml; body contains SOAP Envelope; version string contains "Axis2"; version string matches semver pattern |
| SOAP 1.2 | returns HTTP 200; Content-Type is application/soap+xml; version matches SOAP 1.1 result |
| Error handling | malformed XML rejected; missing SOAPAction still returns 200 (Axis2 lenient); wrong Content-Type rejected |

---

### 5.7 E2E Order Flow (`tests/e2e/order-flow.spec.ts`) — 1 test

Tag: `@E2E`

**Skip guard:** skips if `TEST_USERNAME` or `TEST_PASSWORD` are not set.

Full browser journey:
```
Login → Dashboard (search product, add to cart) → Cart (verify product, checkout)
→ Review page (select India, submit) → Dashboard (navigate to orders)
→ Orders History (find order by ID, verify ID matches)
```

Timeout is 90 seconds (increased from the 30s global default because this flow has many steps).

---

### 5.8 UI Login (`tests/ui/login.spec.ts`) — 2 tests

Tag: `@UI`

**Skip guard:** skips if `TEST_USERNAME` or `TEST_PASSWORD` are not set.

| Test | What it verifies |
|------|-----------------|
| valid login navigates to dashboard | URL matches `/dashboard` after successful login |
| invalid login stays on login page | URL still matches `/client` after failed login |

---

### 5.9 Calendar (`tests/ui/calendar.spec.ts`) — 1 test (placeholder)

Navigates to the date picker practice page. No assertions. Will always pass. Needs to be wired up with actual date picker interactions.

---

## 6. Configuration System

### 6.1 playwright.config.ts

Location: `config/playwright.config.ts`

Reads the `TEST_ENV` environment variable (default: `dev`) and loads the matching environment JSON file.

```
Key settings:
  testDir:       ../tests           ← all .spec.ts files under tests/
  testMatch:     **/*.spec.ts       ← TypeScript specs only (not .js)
  timeout:       from env JSON      ← per-test timeout
  retries:       from env JSON      ← 0=dev, 1=staging, 2=prod
  workers:       2 in CI, 1 locally ← parallel execution
  fullyParallel: false              ← tests within a file run sequentially
  reporter:      HTML + list        ← HTML report to reports/html/, console list
  headless:      from env JSON
  screenshot:    only-on-failure
  video:         off in CI, retain-on-failure locally
  trace:         retain-on-failure

Projects:
  chromium  → channel: 'chrome' (system Chrome — no install needed in CI)
  webkit    → iPhone 11 emulation
```

The `channel: 'chrome'` setting is the key reason there is no `npx playwright install` step in the GitHub Actions workflow. System Chrome is pre-installed on all GitHub `ubuntu-latest` runners.

---

### 6.2 Environment Files

| File | baseUrl | timeout | retries |
|------|---------|---------|---------|
| `dev.json` | `https://rahulshettyacademy.com` | 30s | 1 |
| `staging.json` | `https://staging.rahulshettyacademy.com` | 45s | 1 |
| `prod.json` | `https://prod.rahulshettyacademy.com` | 60s | 2 |

`retries: 1` in dev was set to handle transient API blips from the EventHub backend (which occasionally returns HTML error pages instead of JSON).

---

## 7. Test Data

### `data/order-test-data.json`

Default credentials for Ecom and UI/E2E tests:
```json
[{ "username": "anshikaw@gmail.com", "password": "Learning@830$3mK3", "productName": "ZARA COAT 3" }]
```

**These credentials may be expired.** They are only used when `TEST_USERNAME`/`TEST_PASSWORD` env vars are NOT set. If credentials are invalid, tests with skip guards (orders-api, ui/login, e2e/order-flow) will skip. Supply working credentials via the workflow inputs or GitHub secrets.

### `data/eventhub-test-data.json`

Template data for EventHub tests:
```json
{
  "users": { "valid": { "email": "qatest_{{timestamp}}@mailinator.com", "password": "Test@12345" } },
  "event": { "title": "QA Automation Summit 2026", "category": "Technology", ... },
  "booking": { "customerName": "QA Tester", "customerEmail": "qatester@mailinator.com", ... }
}
```

Note: `{{timestamp}}` is a placeholder in the JSON — the EventHub test specs generate unique emails dynamically in code using `Date.now()`.

---

## 8. GitHub Actions Workflow

File: `.github/workflows/playwright.yml`

### Triggers

| Trigger | When |
|---------|------|
| `push` to main/master | Every commit — runs automatically |
| `pull_request` to main/master | Every PR — runs automatically |
| `workflow_dispatch` | Manual trigger — team uses this |

### Manual Trigger Inputs (the team dropdown)

| Input | Options | Default |
|-------|---------|---------|
| test_suite | See table below | All Tests |
| workers | 1 / 2 / 4 | 2 |
| environment | dev / staging / prod | dev |
| username | text (leave blank) | — |
| password | text (leave blank) | — |
| product_name | text (leave blank) | — |

### Test Suite Options — What Each Runs

| Selection | Command issued |
|-----------|---------------|
| All Tests | API tests (excl. SOAP) + tests/e2e/ + tests/ui/ |
| API Tests only (EventHub + Ecom) | auth + events + bookings + health + orders-api |
| EventHub Auth | tests/api/auth.spec.ts |
| EventHub Events | tests/api/events.spec.ts |
| EventHub Bookings | tests/api/bookings.spec.ts |
| EventHub Health | tests/api/health.spec.ts |
| Ecom Orders API | tests/api/orders-api.spec.ts |
| SOAP Version (internal network only) | tests/api/soap-version.spec.ts |
| E2E Order Flow | tests/e2e/order-flow.spec.ts |
| UI Tests | tests/ui/ |
| Tag - @API | --grep @API (all specs tagged @API) |
| Tag - @Web | --grep @Web |
| Tag - @E2E | --grep @E2E |

**SOAP is always excluded from "All Tests"** because `216.10.245.166` is unreachable from GitHub's cloud runners.

### Workflow Steps

```
1. Checkout code            (actions/checkout@v7)
2. Setup Node.js LTS        (actions/setup-node@v6, with npm cache)
3. npm ci                   (installs exact versions from package-lock.json)
4. Set test command         (bash case statement → writes to $GITHUB_OUTPUT)
5. Run Playwright tests     (the command from step 4, with env vars)
6. Upload HTML report       (actions/upload-artifact@v7, always, 30-day retention)
7. Upload test-results      (actions/upload-artifact@v7, only on failure, 7-day retention)
```

### Artifacts

After every run:
- **playwright-report** — full HTML report with test results, timeline, and screenshots on failure
- **test-results** — raw traces and screenshots (only uploaded when there are failures)

Download from: GitHub → Actions → [run] → Artifacts section.

Or download and open locally:
```bash
gh run download <run-id> --name playwright-report --dir reports/html
npx playwright show-report reports/html
```

---

## 9. Credential Handling and Secrets

### How credentials flow

```
GitHub Actions "Run workflow" form
  └── username / password inputs (optional)
         │ if blank
         ▼
  Repository secrets: ECOM_USERNAME / ECOM_PASSWORD / ECOM_PRODUCT
         │ if secret also not set
         ▼
  data/order-test-data.json defaults (may be expired)
```

In the workflow env block:
```yaml
TEST_USERNAME: ${{ github.event.inputs.username || secrets.ECOM_USERNAME }}
TEST_PASSWORD: ${{ github.event.inputs.password || secrets.ECOM_PASSWORD }}
TEST_PRODUCT:  ${{ github.event.inputs.product_name || secrets.ECOM_PRODUCT }}
```

### Setting up secrets (one-time setup)

Go to: **https://github.com/nurajarjun/QAOpsPlaywright/settings/secrets/actions**

Add three secrets:
- `ECOM_USERNAME` — working rahulshettyacademy.com email
- `ECOM_PASSWORD` — password for that account
- `ECOM_PRODUCT` — product name (e.g. `ZARA COAT 3`)

Once set, the team leaves username/password blank in the workflow form — secrets are used automatically.

### Skip guards

Three test suites skip gracefully when `TEST_USERNAME` or `TEST_PASSWORD` are empty:
- `tests/api/orders-api.spec.ts` — `beforeAll` → `test.skip()`
- `tests/ui/login.spec.ts` — `beforeAll` → `test.skip()`
- `tests/e2e/order-flow.spec.ts` — `beforeAll` → `test.skip()`

This means "All Tests" runs cleanly even without secrets — those suites simply show as skipped, not failed.

---

## 10. How to Run Locally

### First-time setup

```bash
# Install Node dependencies
npm ci

# Install Playwright browsers (local only — not needed in CI)
npx playwright install chromium
```

### Running tests

```bash
# All tests (default config, dev environment)
npm test

# API tests only
npm run test:api

# E2E tests only
npm run test:e2e

# UI tests only
npm run test:ui

# Specific environment
TEST_ENV=staging npm test
TEST_ENV=prod npm test

# With credentials (for UI/E2E/Ecom tests)
TEST_USERNAME=you@email.com TEST_PASSWORD=yourpass npm run test:e2e

# Open HTML report after a run
npm run report
```

### Running a specific spec or test

```bash
# Single spec file
npx playwright test --config=config/playwright.config.ts tests/api/auth.spec.ts

# Single test by name
npx playwright test --config=config/playwright.config.ts --grep "valid login"

# Interactive UI mode (useful for debugging)
npx playwright test --config=config/playwright.config.ts --ui
```

---

## 11. Docker

### Files

**`Dockerfile`** — builds an image using `mcr.microsoft.com/playwright:v1.59.1-noble`. Installs npm dependencies and copies the project.

**`docker-compose.yml`** — mounts `./reports` and `./test-results` so output is available on the host machine after the container exits.

```yaml
environment:
  - CI=true
  - TEST_ENV=dev
```

### Running with Docker

```bash
# Build and run (report saved to ./reports on your machine)
docker compose up --build

# Specific suite or credentials
docker run --rm \
  -e TEST_ENV=dev \
  -e TEST_USERNAME=you@email.com \
  -e TEST_PASSWORD=yourpass \
  -v $(pwd)/reports:/app/reports \
  qaops-playwright npx playwright test --config=config/playwright.config.ts tests/api/
```

---

## 12. How to Add a New Test

### New API test (EventHub)

1. Create `tests/api/my-feature.spec.ts`
2. Import fixtures: `import { test, expect } from '../../src/fixtures/index.js';`
3. Use the `eventHubApi` fixture — it's already authenticated after `loginAndSetToken()`

```typescript
import { test, expect } from '../../src/fixtures/index.js';

test.describe('@API My Feature', () => {

  test.beforeEach(async ({ eventHubApi }) => {
    await eventHubApi.loginAndSetToken({ email: '...', password: '...' });
  });

  test('does something', async ({ eventHubApi }) => {
    const res = await eventHubApi.listEvents();
    expect(res.status()).toBe(200);
  });

});
```

4. Add the spec to the workflow's `"API Tests only"` case in `playwright.yml` if it should run in that suite.

### New UI/E2E test

1. Create `tests/ui/my-page.spec.ts` or `tests/e2e/my-flow.spec.ts`
2. Add a credential skip guard at the top (copy the pattern from `login.spec.ts`)
3. Use the `poManager` fixture for browser interactions

```typescript
import { test, expect } from '../../src/fixtures/index.js';

const HAS_CREDS = !!(process.env.TEST_USERNAME && process.env.TEST_PASSWORD);

test.describe('@UI My Page', () => {

  test.beforeAll(() => {
    if (!HAS_CREDS) test.skip(true, 'Requires TEST_USERNAME and TEST_PASSWORD');
  });

  test('something works', async ({ poManager, testDataForOrder }) => {
    const loginPage = poManager.getLoginPage();
    await loginPage.goTo();
    await loginPage.validLogin(testDataForOrder.username, testDataForOrder.password);
    // ... your test
  });

});
```

### New page object

1. Create `src/pages/MyPage.ts` extending `BasePage`
2. Add a getter in `src/pages/POManager.ts`
3. Instantiate it in `POManager` constructor

---

## 13. EventHub API — Key Facts

**Base URL:** `https://api.eventhub.rahulshettyacademy.com/api`

**Auth:** JWT Bearer token. Register once per test run, login to get token, pass as `Authorization: Bearer <token>`.

**Registration:** Generates a unique email per test run using `Date.now()` suffix (e.g. `qatest_1718900000000@mailinator.com`) to avoid duplicate registration errors across parallel runs.

**Response envelope:**
```json
{
  "data": [...],
  "pagination": { "total": 50, "page": 1, "limit": 10, "totalPages": 5 }
}
```

**Key field quirks:**
- `price` is returned as a **number** in GET responses but some endpoints accept it as either
- `bookingRef` is a string reference code (not the numeric `id`) used for ref-based lookups
- `availableSeats` is server-computed — it equals `totalSeats` on creation and decrements per booking

**Auth rules:**
- `POST /events` — requires token
- `PUT /events/:id` — requires token
- `DELETE /events/:id` — requires token
- `POST /bookings` — requires token
- `DELETE /bookings/:id` — requires token
- GET endpoints — no token required

**Transient failures:** The EventHub server occasionally returns an HTML error page instead of JSON (server overload). This causes `"Unexpected token '<'"` errors. Handled by `retries: 1` in all environment configs.

---

## 14. SOAP Testing Approach

**Target:** Apache Axis2 Version Service at `http://216.10.245.166:8080/axis2/services/Version?wsdl`

**Why this approach:** Playwright has no native SOAP client. We send raw XML via `request.post()` and parse the XML response with `fast-xml-parser`.

### SOAP 1.1 vs SOAP 1.2

| | SOAP 1.1 | SOAP 1.2 |
|--|---------|---------|
| Content-Type | `text/xml; charset=UTF-8` | `application/soap+xml; charset=UTF-8; action="urn:getVersion"` |
| SOAPAction | Separate header: `SOAPAction: urn:getVersion` | Embedded in Content-Type (no separate header) |
| Namespace | `http://schemas.xmlsoap.org/soap/envelope/` | `http://www.w3.org/2003/05/soap-envelope` |

### XML Parsing

```typescript
const parser = new XMLParser({ ignoreAttributes: false, removeNSPrefix: true });
```

`removeNSPrefix: true` strips namespace prefixes (`soapenv:`, `ns:`) so the path is clean:
```typescript
doc.Envelope.Body.getVersionResponse.return  // → "Hi - the Axis2 version is 1.6.2"
```

### Axis2 quirk

When Axis2 receives an invalid request (malformed XML, wrong Content-Type), it returns a non-RFC-compliant HTTP response — the status line is missing a required CR character. Playwright's HTTP parser throws a `"Parse Error"` error instead of returning a response object. Error-handling tests use `try/catch` to handle both outcomes:

```typescript
try {
  const res = await request.post(...);
  expect([400, 500]).toContain(res.status()); // Playwright parsed it
} catch (err: any) {
  expect(err.message).toMatch(/parse error|connect|network/i); // Axis2 quirk
}
```

### Network requirement

The Axis2 server at `216.10.245.166` is on an internal LAN. Tests only work from:
- A developer machine on that network
- A Docker container on that network
- A self-hosted GitHub Actions runner on that network

See `docs/IT-Network-Setup-Request.md` for the firewall rule request.

---

## 15. Known Limitations

| Area | Issue |
|------|-------|
| SOAP tests | Only run on internal network — always skipped/excluded in GitHub Actions |
| calendar.spec.ts | Placeholder — navigates to page but has no assertions |
| Ecom credentials | `data/order-test-data.json` defaults may expire — rahulshettyacademy.com accounts reset periodically |
| EventHub flakiness | Server occasionally returns HTML instead of JSON — `retries: 1` mitigates but doesn't eliminate |
| `webkit` project | Defined in playwright.config.ts but the GitHub Actions workflow only runs `--project=chromium` |
| utils/ folder | Contains legacy JavaScript files from before the TypeScript refactor — not used by any current tests, kept for reference |
