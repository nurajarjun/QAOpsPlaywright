# QAOpsPlaywright — Framework Reference

A reference document for QA engineers working on this project.
Covers what the framework is, how it is structured, how each part works, and how to reuse or extend it.

---

## What This Framework Is

QAOpsPlaywright is a test automation framework built on **Playwright** and **TypeScript**.
It covers three types of testing:

- **REST API testing** — sending HTTP requests and asserting on responses (no browser)
- **SOAP API testing** — sending XML messages to legacy web services (no browser)
- **End-to-end browser testing** — controlling a real browser to test UI flows

The framework is designed for a team where one person writes tests and others trigger them.
The team does not need to install anything locally — they trigger test runs from **GitHub Actions** using a point-and-click form.

---

## How the Project Is Organized

```
src/            Reusable building blocks (pages, helpers, fixtures, types)
tests/          The actual test files
config/         Playwright settings and environment configs
data/           Test data JSON files
docs/           Documentation
.github/        GitHub Actions CI/CD pipeline
```

The key principle: **tests are thin**. A test file should only describe what to verify.
All the "how to do it" logic lives in `src/`.

---

## The Layers of the Framework

```
┌─────────────────────────────────────────────┐
│              TEST FILES (tests/)            │  ← What to test, what to assert
└───────────────────┬─────────────────────────┘
                    │ use
┌───────────────────▼─────────────────────────┐
│           FIXTURES (src/fixtures/)          │  ← Inject ready-to-use objects into tests
└───────┬──────────────────────┬──────────────┘
        │                      │
┌───────▼──────────┐  ┌───────▼──────────────┐
│  PAGE OBJECTS    │  │   API HELPERS         │
│  (src/pages/)   │  │   (src/helpers/)      │  ← How to interact with the app
└───────┬──────────┘  └───────┬──────────────┘
        │                      │
┌───────▼──────────────────────▼──────────────┐
│         BROWSER / HTTP / XML                │  ← Playwright under the hood
└─────────────────────────────────────────────┘
```

Each layer has one responsibility. Tests don't know how to click buttons or build HTTP requests — that knowledge lives in the layer below.

---

## Page Objects — How the UI Layer Works

A **Page Object** is a TypeScript class that represents one page of the web application.
It exposes methods for actions a user can take on that page (e.g. `loginWith()`, `addToCart()`).
Tests call these methods — they never contain raw selectors like `#username` or `button.submit`.

### The hierarchy

```
BasePage (abstract)
  └── shared helpers: waitForPageLoad(), getTitle(), locator()
        ↑
  ├── LoginPage          login(), goTo()
  ├── DashboardPage      searchProduct(), selectProduct()
  ├── CartPage           proceedToCheckout()
  ├── OrdersReviewPage   selectCountry(), submitOrder()
  └── OrdersHistoryPage  getOrderId()
```

`BasePage` holds anything every page needs. Concrete pages extend it and add their own methods.

### POManager — the single import point

Instead of importing five different page classes in every test, tests import one object: `POManager`.

```typescript
// Inside a test — this is all you need
const login     = poManager.getLoginPage();
const dashboard = poManager.getDashboardPage();
```

`POManager` creates all page instances internally and exposes them through getters.
If you add a new page to the framework, you add it to `POManager` once and it is immediately available in all tests.

### Where page objects live

```
src/pages/
  BasePage.ts
  LoginPage.ts
  DashboardPage.ts
  CartPage.ts
  OrdersReviewPage.ts
  OrdersHistoryPage.ts
  POManager.ts          ← imports and holds all of the above
```

---

## API Helpers — How the API Layer Works

For API tests, there is no browser. Instead, Playwright sends HTTP requests directly using `APIRequestContext`.

Two helpers wrap this:

### ApiHelper (`src/helpers/ApiHelper.ts`)

Covers the **Ecom API** at `rahulshettyacademy.com/api/ecom`.
Methods: `login()`, `createOrder()`, `getOrders()`.

### EventHubApiHelper (`src/helpers/EventHubApiHelper.ts`)

Covers the **EventHub API** at `api.eventhub.rahulshettyacademy.com/api`.

This helper is stateful — it holds a `token` property that is set after login:

```typescript
await eventHubApi.loginAndSetToken({ email: '...', password: '...' });
// Now all subsequent calls automatically include the token
await eventHubApi.listEvents();     // Authorization header added internally
await eventHubApi.createBooking({}); // same
```

Every method accepts an optional token override — but in normal usage you just set it once and forget it.

#### Why it is designed this way

Playwright creates a **new fixture instance for each test**. This means the token is lost between tests.
The fix: call `loginAndSetToken()` inside `beforeEach` so each test starts with a fresh, valid token.

```typescript
test.beforeEach(async ({ eventHubApi }) => {
  await eventHubApi.loginAndSetToken(testUser);
});
```

---

## Fixtures — How Objects Get Into Tests

A **fixture** in Playwright is an object that is automatically created and injected into your test function.
You declare what you need in the function parameters — Playwright provides it.

```typescript
test('my test', async ({ poManager, eventHubApi }) => {
  //                      ↑             ↑
  //              Playwright injects these automatically
});
```

The custom fixtures defined in `src/fixtures/index.ts`:

| Fixture name | What it is | Used for |
|---|---|---|
| `poManager` | `POManager` instance | UI / browser tests |
| `apiHelper` | `ApiHelper` instance | Ecom API tests |
| `eventHubApi` | `EventHubApiHelper` instance | EventHub API tests |
| `testDataForOrder` | Object with username, password, product | E2E order flow |

Fixtures handle setup and teardown automatically. For example, the `eventHubApi` fixture creates an HTTP context before the test and disposes of it after — the test itself does not need to manage this.

---

## TypeScript Types — How Data Shapes Are Defined

`src/types/` contains interfaces that describe the shape of API requests and responses.
These give you autocompletion and catch mistakes at compile time.

```
src/types/
  index.ts        User, OrderTestData, LoginPayload, ApiResponse, EnvironmentConfig
  eventhub.ts     AuthResponse, Event, Booking, CreateEventInput, PaginatedResponse<T>, etc.
```

Example — when you get a `Booking` back from the API, TypeScript knows:

```typescript
const body = item<Booking>(await res.json());
body.bookingRef   // ✅ TypeScript knows this exists
body.ref          // ❌ TypeScript flags this as an error
```

---

## Test Files — How Tests Are Written

All tests live in `tests/` and are grouped by type:

```
tests/
  api/        REST and SOAP API tests
  e2e/        Full browser flows
  ui/         Component-level UI tests
```

### Anatomy of a test file

```typescript
import { test, expect } from '../../src/fixtures/index.js';  // always this import

// Tag the describe block so tests can be filtered by tag
test.describe('@API Auth', () => {

  // Runs once before all tests in this describe block
  test.beforeAll(async ({ eventHubApi }) => {
    await eventHubApi.register(testUser);
  });

  // Runs before each individual test
  test.beforeEach(async ({ eventHubApi }) => {
    await eventHubApi.loginAndSetToken(testUser);
  });

  test('valid login returns 200 with token', async ({ eventHubApi }) => {
    const res  = await eventHubApi.login(testUser);
    const body = await res.json();

    expect(res.status()).toBe(200);
    expect(body.token).toBeTruthy();
  });

});
```

### Test tags

Tags are strings in the describe block name. They allow you to run a subset of tests:

| Tag | What it selects |
|---|---|
| `@API` | All API tests (REST + SOAP) |
| `@Web` | All browser tests |
| `@E2E` | End-to-end flows |
| `@UI` | UI component tests |

Run by tag: `npx playwright test --grep @API`

---

## The EventHub API — What You Need to Know

This API wraps every response in an envelope:

```json
{
  "success": true,
  "data": { ... },
  "pagination": { "total": 10, "page": 1, "limit": 20, "totalPages": 1 },
  "message": "OK"
}
```

The actual data is always inside `data`. Two helper functions handle unwrapping:

```typescript
function item<T>(raw: any): T   { return raw.data ?? raw; }   // single object
function list<T>(raw: any): T[] { return Array.isArray(raw.data) ? raw.data : raw; }  // array
```

**Important field names to get right:**

- The booking reference field is `bookingRef` — not `ref`
- The event `price` comes back as a **string** (`"999"`), not a number. Use `Number(body.price)` to compare
- All endpoints require a Bearer token — even `GET /events`. No token = 401

---

## The SOAP API — How XML Testing Works

SOAP is an older protocol used in many enterprise and banking systems. Instead of JSON, it exchanges XML messages called **SOAP Envelopes**.

Playwright has no built-in SOAP support. The approach used here:

1. Build the XML envelope as a string
2. Send it with `request.post()` and the correct `Content-Type` header
3. Read the response body as text
4. Parse the XML using the `fast-xml-parser` library
5. Assert on the parsed values

**SOAP 1.1** uses `Content-Type: text/xml` with a separate `SOAPAction` header.
**SOAP 1.2** uses `Content-Type: application/soap+xml` with the action embedded inside it.

Both versions are tested against the Axis2 Version service at:
`http://216.10.245.166:8080/axis2/services/Version?wsdl`

The XML parser is configured with `removeNSPrefix: true` — this strips namespace prefixes like `soapenv:` and `ns:` from the parsed object, so you can navigate the response as clean `Envelope.Body.getVersionResponse.return` instead of dealing with prefix strings.

---

## Configuration — Environments and Settings

The master Playwright config is at `config/playwright.config.ts`.
It reads a JSON file from `config/environments/` based on the `TEST_ENV` environment variable.

```
TEST_ENV=dev      →  config/environments/dev.json
TEST_ENV=staging  →  config/environments/staging.json
TEST_ENV=prod     →  config/environments/prod.json
```

If `TEST_ENV` is not set, `dev` is used.

Each JSON file controls: base URL, API base URL, test timeout, retry count, and headless mode.
This means the same test can run against different targets without any code change.

---

## GitHub Actions — How the Team Triggers Tests

The workflow file at `.github/workflows/playwright.yml` defines a pipeline with a manual trigger form.

When someone goes to **Actions → Playwright Tests → Run workflow**, they see:

| Input | Purpose |
|---|---|
| Which tests to run | Dropdown — choose a spec file, all tests, or a tag |
| Parallel workers | 1, 2, or 4 — how many tests run at the same time |
| Login email | Override the default test user (optional) |
| Login password | Override the default test password (optional) |
| Product name | Override the default product to order (optional) |

The workflow then:
1. Checks out the code on a fresh Ubuntu machine
2. Installs Node.js and project dependencies
3. Installs Chromium browser
4. Runs the selected tests
5. Uploads the HTML report as a downloadable artifact (kept 30 days)

Tests also run automatically on every push or pull request to `main`.

---

## How to Add a New Test

### New REST API test

Create `tests/api/your-feature.spec.ts`. Import fixtures, add a `@API` tag, write tests.
If the endpoint needs auth, add `beforeEach` with `loginAndSetToken()`.

### New browser (E2E) test

Create `tests/e2e/your-flow.spec.ts`. Use `poManager` from the fixture.
If the page you need doesn't have a page object yet, create one in `src/pages/` and add it to `POManager`.

### New SOAP test

Add a test in `tests/api/` (either in the existing `soap-version.spec.ts` or a new file).
Fetch the WSDL with `curl http://<host>/service?wsdl` to understand the operation names and namespace.
Build the XML envelope, POST it, parse with `XMLParser`.

### New page object

1. Create `src/pages/YourPage.ts` extending `BasePage`
2. Add it to `src/pages/POManager.ts` — instantiate in the constructor, add a getter
3. Use it in tests via `poManager.getYourPage()`

### New API helper method

Add a method to `EventHubApiHelper.ts` or `ApiHelper.ts`.
Use `this.bearer()` (private method) to automatically attach the stored token.

---

## Key Technical Decisions

| Decision | Why |
|---|---|
| TypeScript with strict mode | Catches type errors at build time, not at runtime |
| `module: Node16` in tsconfig | Required by modern TypeScript — old `commonjs` setting is deprecated |
| `.js` extension in imports | TypeScript with Node16 requires this even for `.ts` source files |
| Fixtures over `beforeAll` setup | Fixtures handle disposal automatically; avoids resource leaks |
| `beforeEach` re-login | Each test gets a fresh fixture instance, so the token must be reset each time |
| `fast-xml-parser` for SOAP | Lightweight, no external dependencies, works in Node.js without a DOM |
| `item()` / `list()` helpers | The EventHub API wraps all responses — unwrapping inline in every test is noisy |
| Docker with official Playwright image | Browser dependencies are pre-installed — no `playwright install` needed in CI |
