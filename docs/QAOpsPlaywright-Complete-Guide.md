# QAOpsPlaywright — Complete Framework Guide

> Playwright + TypeScript test automation framework for a team of 5.
> Supports local execution, Docker, and GitHub Actions (with a UI dropdown for test selection).

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Project Structure](#2-project-structure)
3. [How to Run Locally](#3-how-to-run-locally)
4. [How to Run with Docker](#4-how-to-run-with-docker)
5. [How to Run via GitHub Actions](#5-how-to-run-via-github-actions)
6. [Environment Configuration](#6-environment-configuration)
7. [Test Suites — What Exists](#7-test-suites--what-exists)
8. [How to Add a New Test](#8-how-to-add-a-new-test)
9. [Page Object Model (POM)](#9-page-object-model-pom)
10. [Fixtures and Helpers](#10-fixtures-and-helpers)
11. [EventHub REST API — Key Facts](#11-eventhub-rest-api--key-facts)
12. [SOAP API Testing Approach](#12-soap-api-testing-approach)
13. [TypeScript Configuration](#13-typescript-configuration)
14. [Generating and Viewing Reports](#14-generating-and-viewing-reports)

---

## 1. Project Overview

| Item | Value |
|------|-------|
| Framework | [Playwright](https://playwright.dev/) v1.59.1 |
| Language | TypeScript (strict mode) |
| Node.js | v24+ (LTS) |
| Test types | REST API, SOAP API, E2E (browser), UI component |
| Browsers | Chromium (CI), Chromium + WebKit (local) |
| GitHub repo | https://github.com/nurajarjun/QAOpsPlaywright |

**Team workflow:**
- 1 person writes and maintains tests
- 4 people trigger tests from GitHub Actions UI (no code required)
- Anyone can pass custom login credentials and product names at runtime via the Actions dropdown

---

## 2. Project Structure

```
QAOpsPlaywright/
│
├── config/                         # Playwright configuration
│   ├── playwright.config.ts        # Master config (reads env from TEST_ENV variable)
│   └── environments/
│       ├── dev.json                # Development environment settings
│       ├── staging.json            # Staging environment settings
│       └── prod.json               # Production environment settings
│
├── src/                            # All reusable TypeScript source code
│   ├── pages/                      # Page Object Model classes
│   │   ├── BasePage.ts             # Abstract base — shared helpers (waitForLoad, getTitle, etc.)
│   │   ├── LoginPage.ts
│   │   ├── DashboardPage.ts
│   │   ├── CartPage.ts
│   │   ├── OrdersReviewPage.ts
│   │   ├── OrdersHistoryPage.ts
│   │   └── POManager.ts            # Facade — instantiates all pages, single import point
│   │
│   ├── helpers/                    # API client wrappers
│   │   ├── ApiHelper.ts            # Ecom REST API (rahulshettyacademy.com)
│   │   └── EventHubApiHelper.ts    # EventHub REST API (full CRUD + auth)
│   │
│   ├── fixtures/
│   │   └── index.ts                # Custom Playwright fixtures (poManager, apiHelper, eventHubApi)
│   │
│   ├── types/
│   │   ├── index.ts                # Interfaces for Ecom API (User, OrderPayload, etc.)
│   │   └── eventhub.ts             # Interfaces for EventHub API (Event, Booking, AuthResponse, etc.)
│   │
│   └── constants/
│       └── index.ts                # URLs, API endpoints, timeouts, test tags (@Web, @API, etc.)
│
├── tests/                          # All test specs
│   ├── api/                        # REST and SOAP API tests (no browser)
│   │   ├── auth.spec.ts            # EventHub: register, login, /me
│   │   ├── events.spec.ts          # EventHub: CRUD for events
│   │   ├── bookings.spec.ts        # EventHub: CRUD for bookings
│   │   ├── health.spec.ts          # EventHub: /health and /config
│   │   ├── orders-api.spec.ts      # Ecom API: login + create order
│   │   └── soap-version.spec.ts    # SOAP: Axis2 Version service (SOAP 1.1 + 1.2)
│   │
│   ├── e2e/
│   │   └── order-flow.spec.ts      # Full browser order flow (login → add to cart → checkout)
│   │
│   └── ui/
│       ├── login.spec.ts           # UI login validation
│       └── calendar.spec.ts        # Date picker interactions
│
├── data/                           # Test data JSON files
│   ├── order-test-data.json        # Default username, password, product for ecom tests
│   ├── eventhub-test-data.json     # EventHub test data
│   └── users.json                  # User credentials
│
├── docs/                           # Documentation (this folder)
│
├── .github/workflows/
│   └── playwright.yml              # GitHub Actions pipeline with manual trigger UI
│
├── Dockerfile                      # Docker image for running tests in containers
├── docker-compose.yml              # Docker Compose for easy local container runs
├── tsconfig.json                   # TypeScript compiler config
└── package.json                    # Scripts and dependencies
```

---

## 3. How to Run Locally

### Prerequisites

- Node.js v18+ installed (on this machine: `C:\Program Files\nodejs\`)
- Clone the repo: `git clone https://github.com/nurajarjun/QAOpsPlaywright`

### Install dependencies

```bash
npm ci
```

### Install browsers (first time only)

```bash
npx playwright install --with-deps chromium
```

### Run all tests

```bash
npm test
```

### Run only API tests

```bash
npm run test:api
```

### Run only E2E tests

```bash
npm run test:e2e
```

### Run only UI tests

```bash
npm run test:ui
```

### Run against a specific environment

```bash
npm run test:dev        # uses config/environments/dev.json
npm run test:staging    # uses config/environments/staging.json
npm run test:prod       # uses config/environments/prod.json
```

### Run a single spec file

```bash
npx playwright test --config=config/playwright.config.ts tests/api/soap-version.spec.ts --project=chromium
```

### Run tests matching a tag

```bash
npx playwright test --config=config/playwright.config.ts --grep @API
npx playwright test --config=config/playwright.config.ts --grep @Web
```

### View the HTML report after a run

```bash
npm run report
```

> **Windows Git Bash note:** Node.js is not in Git Bash PATH automatically.
> Add it first: `export PATH="/c/Program Files/nodejs:$PATH"`

---

## 4. How to Run with Docker

Docker is useful when you want a clean, isolated environment with browsers pre-installed — no local Node.js setup needed.

### What the Docker image provides

The `Dockerfile` uses the official Playwright image:
```
mcr.microsoft.com/playwright:v1.59.1-noble
```
This image already has Chromium and all browser dependencies installed. No `playwright install` needed inside the container.

### Build and run with Docker Compose

```bash
# Build the image and run all tests
docker-compose up --build

# Run in background
docker-compose up --build -d
docker-compose logs -f   # watch output
```

### Run a specific suite inside Docker

```bash
docker-compose run --rm playwright \
  npx playwright test --config=config/playwright.config.ts tests/api/ --project=chromium
```

### Where do reports go?

Docker Compose mounts two volumes:
```
./playwright-report  →  /app/playwright-report
./test-results       →  /app/test-results
```
After the container runs, the HTML report is available locally at `./playwright-report/index.html`.

### How browsers work inside Docker

The container uses headless Chromium. There is no display (no GUI), but Playwright runs perfectly in headless mode. The container also has:
- All Linux browser dependencies (libglib, libnss, fonts, etc.)
- Network access to external URLs (firewall rules permitting)
- No GPU required — headless rendering is software-based

---

## 5. How to Run via GitHub Actions

### Who can trigger tests

Anyone with access to the GitHub repository can trigger a test run manually — no local setup required.

### How to trigger a manual run

1. Go to the GitHub repository
2. Click **Actions** tab
3. Click **Playwright Tests** in the left sidebar
4. Click **Run workflow**
5. Fill in the dropdown form:

| Field | What it does |
|-------|-------------|
| **Which tests to run?** | Choose a specific spec file, all tests, or filter by tag |
| **Parallel workers** | 1, 2, or 4 — controls how many tests run simultaneously |
| **Product name** | Override the default product (optional) |
| **Login email** | Override the default test user email (optional) |
| **Login password** | Override the default test user password (optional) |

6. Click **Run workflow** (green button)

### What happens automatically

- GitHub spins up a fresh Ubuntu virtual machine
- Installs Node.js and runs `npm ci`
- Installs Chromium browser
- Runs the selected tests
- Uploads the HTML report as an artifact

### Viewing results

After the workflow completes:
1. Click on the completed workflow run
2. Scroll to **Artifacts** at the bottom
3. Download **playwright-report**
4. Open `index.html` in your browser

Reports are kept for **30 days**.

### Triggered automatically on

- Every push to `main` or `master`
- Every pull request targeting `main` or `master`

---

## 6. Environment Configuration

Each environment has its own JSON file in `config/environments/`:

```json
// dev.json
{
  "baseUrl":    "https://rahulshettyacademy.com",
  "apiBaseUrl": "https://rahulshettyacademy.com/api/ecom",
  "timeout":    30000,
  "retries":    0,
  "headless":   true
}
```

```json
// staging.json
{
  "baseUrl":    "https://rahulshettyacademy.com",
  "apiBaseUrl": "https://rahulshettyacademy.com/api/ecom",
  "timeout":    45000,
  "retries":    1,
  "headless":   true
}
```

```json
// prod.json
{
  "baseUrl":    "https://rahulshettyacademy.com",
  "apiBaseUrl": "https://rahulshettyacademy.com/api/ecom",
  "timeout":    60000,
  "retries":    2,
  "headless":   true
}
```

The active environment is chosen via the `TEST_ENV` environment variable.
If `TEST_ENV` is not set, `dev` is used by default.

---

## 7. Test Suites — What Exists

### API Tests (`tests/api/`) — 50 tests total

| Spec | Tests | What it covers |
|------|-------|----------------|
| `auth.spec.ts` | 10 | Register, login, GET /me — valid and invalid cases |
| `events.spec.ts` | 10 | Create, read, update, delete events — auth, validation |
| `bookings.spec.ts` | 15 | Create, read, cancel bookings — seat count, filters |
| `health.spec.ts` | 2 | /health (db status) and /config (feature flags) |
| `orders-api.spec.ts` | 1 pass, 1 skip | Ecom API login + order creation |
| `soap-version.spec.ts` | 11 | SOAP 1.1 + 1.2 getVersion, error handling |

**Current status:** 49 passed, 1 skipped

The skipped test (`create order`) dynamically fetches a product ID before ordering.
It skips when the ecom API's product listing endpoint is unavailable.

### E2E Tests (`tests/e2e/`)

| Spec | What it covers |
|------|---------------|
| `order-flow.spec.ts` | Full browser flow: login → select product → add to cart → checkout → verify order history |

### UI Tests (`tests/ui/`)

| Spec | What it covers |
|------|---------------|
| `login.spec.ts` | Login page validation (valid, wrong password, empty fields) |
| `calendar.spec.ts` | Date picker component interactions |

---

## 8. How to Add a New Test

### Adding a new API test

1. Create a file in `tests/api/` — e.g. `tests/api/payments.spec.ts`
2. Import the custom fixture:
   ```typescript
   import { test, expect } from '../../src/fixtures/index.js';
   ```
3. Tag the test for filtering:
   ```typescript
   test.describe('@API Payments', () => { ... });
   ```
4. If the API needs authentication, add `beforeAll` to register/login and `beforeEach` to refresh the token:
   ```typescript
   test.beforeAll(async ({ eventHubApi }) => {
     await eventHubApi.register(testUser);
     await eventHubApi.loginAndSetToken(testUser);
   });

   test.beforeEach(async ({ eventHubApi }) => {
     await eventHubApi.loginAndSetToken(testUser);  // fresh token each test
   });
   ```

### Adding a new E2E test

1. Create a file in `tests/e2e/`
2. Use the `poManager` fixture to access page objects:
   ```typescript
   import { test, expect } from '../../src/fixtures/index.js';

   test('@Web checkout flow', async ({ poManager, testDataForOrder }) => {
     const login     = poManager.getLoginPage();
     const dashboard = poManager.getDashboardPage();

     await login.goTo();
     await login.loginWith(testDataForOrder.username, testDataForOrder.password);
     // ...
   });
   ```

### Adding a new SOAP test

1. Add to `tests/api/soap-version.spec.ts` or create a new spec for a different WSDL
2. Fetch the WSDL to get operation names and namespaces: `curl http://<host>/service?wsdl`
3. Build the SOAP envelope XML manually with the correct namespace
4. POST it with `Content-Type: text/xml` (SOAP 1.1) or `application/soap+xml` (SOAP 1.2)
5. Parse the XML response using `fast-xml-parser` with `removeNSPrefix: true`

### Adding a new page object

1. Create `src/pages/MyPage.ts` extending `BasePage`:
   ```typescript
   import { BasePage } from './BasePage.js';

   export class MyPage extends BasePage {
     async clickSubmit() {
       await this.locator('#submit').click();
     }
   }
   ```
2. Add it to `src/pages/POManager.ts` (instantiate in constructor, add a getter)
3. The fixture auto-provides `poManager` — no other changes needed

---

## 9. Page Object Model (POM)

The framework uses the POM pattern so tests never contain raw selectors.

```
BasePage (abstract)
  ↑
  ├── LoginPage
  ├── DashboardPage
  ├── CartPage
  ├── OrdersReviewPage
  └── OrdersHistoryPage

POManager        ← single entry point used in tests
  └── holds instances of all pages above
```

**In a test:**
```typescript
const login     = poManager.getLoginPage();
const dashboard = poManager.getDashboardPage();
```

`POManager` is provided via the custom `poManager` fixture — Playwright injects it automatically.

---

## 10. Fixtures and Helpers

Fixtures are defined in `src/fixtures/index.ts`. They extend Playwright's built-in `test` object.

| Fixture | Type | What it provides |
|---------|------|-----------------|
| `poManager` | `POManager` | All page object instances |
| `apiHelper` | `ApiHelper` | Ecom REST API client |
| `eventHubApi` | `EventHubApiHelper` | EventHub REST API client with auth |
| `testDataForOrder` | `OrderTestData` | Credentials/product from JSON or env vars |

### EventHubApiHelper — important behaviour

- Has a `token` public property (starts as empty string)
- Call `loginAndSetToken(user)` to populate it
- All methods use `this.token` automatically — no need to pass it each time
- Playwright creates a **fresh fixture instance per test**, so `beforeEach` must call `loginAndSetToken()` to re-auth each test

```typescript
// Correct pattern for authenticated API tests
test.beforeAll(async ({ eventHubApi }) => {
  await eventHubApi.register(testUser);
});

test.beforeEach(async ({ eventHubApi }) => {
  await eventHubApi.loginAndSetToken(testUser);  // ensures each test has a token
});
```

### Overriding test data at runtime

Test data comes from `data/order-test-data.json` by default.
Override via environment variables (useful for GitHub Actions):

```bash
TEST_USERNAME=myemail@example.com \
TEST_PASSWORD=mypassword \
TEST_PRODUCT="ZARA COAT 3" \
npx playwright test --config=config/playwright.config.ts
```

---

## 11. EventHub REST API — Key Facts

**Base URL:** `https://api.eventhub.rahulshettyacademy.com/api`

### Response envelope

Every response is wrapped:
```json
{
  "success": true,
  "data": { ... },
  "pagination": { "total": 10, "page": 1, "limit": 20, "totalPages": 1 },
  "message": "..."
}
```

Use these helpers in tests to unwrap cleanly:
```typescript
function item<T>(raw: any): T   { return raw.data ?? raw; }
function list<T>(raw: any): T[] { return Array.isArray(raw.data) ? raw.data : raw; }
```

For list endpoints, check `raw.data` and `raw.pagination` directly (don't unwrap the paginated list before asserting on pagination):
```typescript
const raw = await res.json();
expect(Array.isArray(raw.data)).toBe(true);
expect(raw.pagination).toBeDefined();
```

### Authentication

- ALL endpoints require `Authorization: Bearer <token>` — even GET requests
- No token → 401, bad token → 401
- `GET /auth/me` may return either `{ email }` or `{ user: { email } }` — handle both:
  ```typescript
  const email = body.email ?? body.user?.email;
  ```

### Field name gotchas

| Field | Correct name | Wrong (don't use) |
|-------|-------------|-------------------|
| Booking reference | `bookingRef` | `ref` |
| Booking ref format | `P-XXXXXX` | `EVT-XXXXXX` |
| Event price | returned as **string** `"1299"` | not a number |

**Price comparison:**
```typescript
expect(Number(body.price)).toBe(1299);  // always convert with Number()
```

### Non-existent user login

Returns **400**, not 404. Always allow both:
```typescript
expect([400, 404]).toContain(res.status());
```

---

## 12. SOAP API Testing Approach

Playwright has no native SOAP client. The approach used in this framework:

### How it works

1. Build the SOAP XML envelope manually as a template string
2. POST it using `request.post()` with the correct Content-Type header
3. Read the response as raw text (`res.text()`)
4. Parse the XML with `fast-xml-parser` (already installed as a dependency)
5. Navigate the parsed object to assert on values

### SOAP 1.1 request pattern

```typescript
const res = await request.post(endpoint, {
  headers: {
    'Content-Type': 'text/xml; charset=UTF-8',
    SOAPAction: 'urn:operationName',       // Required for SOAP 1.1
  },
  data: `<?xml version="1.0" encoding="UTF-8"?>
  <soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/"
                    xmlns:ns="http://your.namespace.here">
    <soapenv:Header/>
    <soapenv:Body>
      <ns:operationName/>
    </soapenv:Body>
  </soapenv:Envelope>`,
});
```

### SOAP 1.2 request pattern

```typescript
const res = await request.post(endpoint, {
  headers: {
    // SOAPAction goes inside Content-Type for SOAP 1.2
    'Content-Type': 'application/soap+xml; charset=UTF-8; action="urn:operationName"',
  },
  data: `<?xml version="1.0" encoding="UTF-8"?>
  <soapenv:Envelope xmlns:soapenv="http://www.w3.org/2003/05/soap-envelope"
                    xmlns:ns="http://your.namespace.here">
    <soapenv:Header/>
    <soapenv:Body>
      <ns:operationName/>
    </soapenv:Body>
  </soapenv:Envelope>`,
});
```

### Parsing the XML response

```typescript
import { XMLParser } from 'fast-xml-parser';

const parser = new XMLParser({ ignoreAttributes: false, removeNSPrefix: true });
const doc    = parser.parse(await res.text());
// Access: doc.Envelope.Body.YourResponse.fieldName
```

`removeNSPrefix: true` strips namespace prefixes (e.g. `soapenv:`, `ns:`) so you can
navigate the object with clean property names.

### Axios2 error response quirk

When Apache Axis2 receives an invalid request (bad XML, wrong Content-Type), it sends
a malformed HTTP response missing the required CR character after the status line.
Playwright's HTTP parser throws a `"Parse Error"` instead of returning a response.

Always wrap error-path SOAP tests in try/catch:
```typescript
try {
  const res = await request.post(endpoint, { ... });
  expect([400, 500]).toContain(res.status());
} catch (err: any) {
  // This is also a valid failure signal from Axis2
  expect(err.message).toMatch(/parse error|connect|network/i);
}
```

### Axis2 Version Service (current target)

| Item | Value |
|------|-------|
| WSDL | `http://216.10.245.166:8080/axis2/services/Version?wsdl` |
| Operation | `getVersion` (no input parameters) |
| Namespace | `http://axisversion.sample` |
| SOAPAction | `urn:getVersion` |
| SOAP 1.1 endpoint | `.../Version.VersionHttpSoap11Endpoint/` |
| SOAP 1.2 endpoint | `.../Version.VersionHttpSoap12Endpoint/` |
| Response field | `<ns:return>Hi - the Axis2 version is 1.6.2</ns:return>` |

---

## 13. TypeScript Configuration

Key settings in `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "Node16",
    "moduleResolution": "node16",
    "esModuleInterop": true,
    "strict": true,
    "skipLibCheck": true,
    "resolveJsonModule": true
  }
}
```

**Why `module: Node16`?**
The older `"module": "commonjs"` + `"moduleResolution": "node"` was deprecated in TypeScript 7.0.
`Node16` is the current correct setting for Node.js projects.

**Import paths must use `.js` extension:**
```typescript
// Correct
import { test } from '../../src/fixtures/index.js';

// Wrong — will fail at runtime even though the file is .ts
import { test } from '../../src/fixtures/index';
```
TypeScript with `Node16` resolution requires the `.js` extension in imports even when the source file is `.ts`.
Node.js resolves it correctly at runtime.

---

## 14. Generating and Viewing Reports

### HTML report (local)

After any test run, the HTML report is generated at `reports/html/`:
```bash
npm run report
# Opens reports/html/index.html in your browser
```

### What the report shows

- Pass / fail status per test
- Screenshots on failure
- Videos on failure (retained automatically)
- Full trace viewer for debugging — click any failed test → "Traces" tab
- Execution timeline

### Trace viewer (debugging failures)

Traces are saved automatically on failure to `test-results/`.
Open a trace:
```bash
npx playwright show-trace test-results/<test-folder>/trace.zip
```

The trace viewer shows every browser action, network call, and DOM snapshot at each step — extremely useful for diagnosing E2E failures.

### GitHub Actions report

After a CI run completes:
1. Open the workflow run in GitHub
2. Scroll to **Artifacts** section
3. Download `playwright-report`
4. Unzip and open `index.html`

Reports are retained for 30 days.
