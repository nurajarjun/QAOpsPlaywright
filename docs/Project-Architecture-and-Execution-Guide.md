# QAOpsPlaywright — Project Architecture & Execution Guide

**Framework:** Playwright  
**Language:** JavaScript / TypeScript  
**CI/CD:** GitHub Actions  
**Cloud Execution:** Azure Playwright Service  
**Repository:** https://github.com/nurajarjun/QAOpsPlaywright  

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Project Structure](#2-project-structure)
3. [Core Components Explained](#3-core-components-explained)
4. [Configuration Files](#4-configuration-files)
5. [How Tests Are Organized](#5-how-tests-are-organized)
6. [GitHub Actions — How It Works](#6-github-actions--how-it-works)
7. [Azure Playwright Service — How It Works](#7-azure-playwright-service--how-it-works)
8. [Execution Flow: Local vs GitHub vs Azure](#8-execution-flow-local-vs-github-vs-azure)
9. [Running Tests](#9-running-tests)

---

## 1. Project Overview

QAOpsPlaywright is an end-to-end test automation framework built on Playwright. It automates browser-based testing of a web application — validating user journeys like login, product search, cart operations, checkout, and order confirmation.

**What it tests:** E-commerce web application (Rahul Shetty Academy demo site)  
**Test types covered:** UI/E2E, API, Network mocking, File operations, BDD  
**Browsers:** Chromium (primary), WebKit/Safari (alternate config)  

---

## 2. Project Structure

```
QAOpsPlaywright/
│
├── .github/
│   └── workflows/
│       └── playwright.yml          ← GitHub Actions CI/CD pipeline
│
├── tests/                          ← All test specification files
│   ├── ClientAppPO.spec.js         ← Main E2E order flow
│   ├── UIBasicstest.spec.js        ← UI controls & interactions
│   ├── Calendar.spec.js            ← Date picker tests
│   ├── MoreValidations.spec.js     ← Popups, iframes, hover
│   ├── NetworkTest.spec.js         ← API mocking & interception
│   ├── NetworlTest2.spec.js        ← Security / request routing
│   ├── WebAPIPart1.spec.js         ← API-driven UI testing
│   ├── WebAPIPart2.spec.js         ← Session/storage state reuse
│   └── upload-download.spec.js     ← Excel file upload/download
│
├── pageobjects/                    ← JavaScript Page Object Model (POM)
│   ├── POManager.js                ← Central manager (entry point for all pages)
│   ├── LoginPage.js
│   ├── DashboardPage.js
│   ├── CartPage.js
│   ├── OrdersReviewPage.js
│   ├── OrdersHistoryPage.js
│   └── LoginPagePractise.js
│
├── pageobjects_ts/                 ← TypeScript version of same Page Objects
│   ├── POManager.ts
│   ├── LoginPage.ts
│   ├── DashboardPage.ts
│   ├── CartPage.ts
│   ├── OrdersReviewPage.ts
│   └── OrdersHistoryPage.ts
│
├── utils/                          ← JavaScript utilities & helpers
│   ├── test-base.js                ← Custom Playwright fixtures
│   ├── APiUtils.js                 ← API helper (login token, create order)
│   └── placeorderTestData.json     ← Test data
│
├── utils_ts/                       ← TypeScript versions of utilities
│   ├── test-base.ts
│   ├── APiUtils.ts
│   └── placeorderTestData.json
│
├── features/                       ← BDD / Cucumber feature files
│   ├── ErrorValidation.feature
│   ├── greeting.feature
│   ├── step_definitions/
│   │   ├── steps.js
│   │   └── steps.ts
│   └── support/
│       └── hooks.js
│
├── playwright.config.js            ← Default config (Chromium, headless)
├── playwright.config1.js           ← Multi-browser config (Chrome + Safari/iPhone)
├── playwright.service.config.js    ← Azure Playwright Service config
├── cucumber.js                     ← Cucumber BDD configuration
├── tsconfig.json                   ← TypeScript compiler settings
├── package.json                    ← Dependencies & npm scripts
├── Dockerfile                      ← Container execution
├── docker-compose.yml              ← Docker orchestration
└── postmanCollection.json          ← API endpoint reference
```

---

## 3. Core Components Explained

### 3.1 Page Object Model (POM)

The POM pattern separates **what to find on the page** (selectors) from **what the test does** (actions). Each page of the application has its own class.

```
Test file
   │
   └── POManager          ← single entry point, creates all page objects
         ├── LoginPage    ← selectors + actions for login page
         ├── DashboardPage
         ├── CartPage
         ├── OrdersReviewPage
         └── OrdersHistoryPage
```

**How POManager works:**

```javascript
// In the test:
const poManager = new POManager(page);
const loginPage = poManager.getLoginPage();
const dashboard = poManager.getDashboardPage();

// Instead of writing selectors directly in tests:
await loginPage.validLogin(username, password);
await dashboard.searchProductAddCart(productName);
```

This means if a selector changes in the app, you update it in **one place** (the page object), not across every test.

---

### 3.2 Custom Fixtures (test-base.js)

Playwright allows extending the base `test` object with your own pre-loaded data. This project uses it to inject test credentials and product data into tests automatically.

```javascript
// utils/test-base.js
exports.customtest = base.test.extend({
  testDataForOrder: {
    username: "anshikaw@gmail.com",
    password: "Learning@830$3mK3",
    productName: "ADIDAS ORIGINAL"
  }
});
```

Tests that import `customtest` get `testDataForOrder` available as a parameter — no need to hardcode data inside the test itself.

---

### 3.3 API Utilities (APiUtils.js)

Some tests use the application's REST API directly to set up state before the browser opens. `APiUtils` handles:
- **Authentication** — calling the login API to get a bearer token
- **Order creation** — placing orders via API so the UI test can verify them

This speeds up tests by skipping UI steps that aren't the focus of a particular test.

---

### 3.4 BDD / Cucumber

The `features/` folder contains tests written in **Gherkin** — plain English scenarios that non-technical stakeholders can read and understand.

```gherkin
Feature: Login Validation
  Scenario: User sees error on invalid login
    Given I open the login page
    When I enter invalid credentials
    Then I should see an error message
```

Step definitions in `step_definitions/steps.js` link each Gherkin line to real Playwright code.

---

## 4. Configuration Files

The project has three Playwright config files for different execution contexts.

### 4.1 playwright.config.js — Default (local / CI without Azure)

```
Browser:   Chromium
Mode:      Headless (no visible browser window)
Retries:   0
Timeout:   30 seconds per test
Reporter:  HTML report
Screenshot: On (every test)
Trace:     On (full trace for debugging)
```

Use this for: local development, Docker, GitHub Actions (non-Azure).

---

### 4.2 playwright.config1.js — Multi-browser

```
Projects:
  ├── safari   → WebKit browser, iPhone 11 emulation, headless
  └── chrome   → Chromium, headless OFF, video on failure, geolocation
Workers:   3 (parallel)
Retries:   1
```

Use this for: cross-browser testing, mobile emulation.

```bash
# Run only Safari tests:
npm run SafariNewConfig
```

---

### 4.3 playwright.service.config.js — Azure Playwright Service

Extends `playwright.config.js` with Azure-specific settings:

```
Base config:    playwright.config.js (inherits all settings)
OS:             Linux (Azure-hosted)
Connect timeout: 3 minutes
Network:        loopback exposed
Credential:     DefaultAzureCredential (uses logged-in Azure identity)
Reporter:       HTML + Azure Playwright Workspaces reporter
```

Use this for: cloud execution via Azure Playwright Service.

---

## 5. How Tests Are Organized

### Test Tags

Tests use `@` tags so you can run a specific subset:

| Tag | What it selects |
|-----|----------------|
| `@Web` | UI / browser tests |
| `@API` | API-driven tests |
| `@SP` | Specific scenario group |
| `@QW` | Another scenario group |
| `@Webs` | Parametrized web scenarios |

```bash
# Run only API tests:
npm run APITests

# Run only Web tests:
npm run webTests
```

### Test Coverage Map

| Spec File | What It Tests |
|-----------|--------------|
| `ClientAppPO.spec.js` | Full E2E order journey — login → search → cart → checkout → confirm |
| `UIBasicstest.spec.js` | Form inputs, dropdowns, checkboxes, radio buttons, child windows |
| `Calendar.spec.js` | Date picker — selecting specific dates |
| `MoreValidations.spec.js` | Popups, iframes, hover effects, visual screenshot comparison |
| `NetworkTest.spec.js` | Intercept API responses, mock data, verify UI reflects mocked data |
| `NetworlTest2.spec.js` | Block/redirect requests, security boundary testing |
| `WebAPIPart1.spec.js` | Use API to create an order, then verify it in the browser |
| `WebAPIPart2.spec.js` | Reuse logged-in session state across tests (avoid repeated login) |
| `upload-download.spec.js` | Download Excel file, read/modify cells, re-upload |

---

## 6. GitHub Actions — How It Works

### What GitHub Actions Does

GitHub Actions is a CI/CD platform built into GitHub. Every time code is pushed or a pull request is opened, it automatically runs your tests in the cloud — no manual trigger needed.

### Trigger Events

```yaml
on:
  push:
    branches: [ main, master ]     ← runs when code is pushed
  pull_request:
    branches: [ main, master ]     ← runs when a PR is opened/updated
```

### Pipeline Steps (what happens in order)

```
1. GitHub spins up a fresh Ubuntu Linux virtual machine (ubuntu-latest)
        │
2. Checkout code
   └── pulls your repository onto the VM
        │
3. Setup Node.js (LTS version)
   └── installs Node.js runtime
        │
4. Install dependencies
   └── npm ci  (installs exact versions from package-lock.json)
        │
5. Install Playwright browsers
   └── npx playwright install --with-deps chromium
       (downloads Chromium + all Linux OS dependencies)
        │
6. Run tests
   └── npx playwright test --config=playwright.config.js --workers=2
       (runs all spec files in parallel across 2 workers)
        │
7. Upload report artifact
   └── saves playwright-report/ folder to GitHub
       (accessible for 30 days under Actions → run → Artifacts)
```

### Where to See Results

1. Go to your GitHub repository
2. Click **Actions** tab
3. Click the latest workflow run
4. Green tick = all tests passed / Red cross = failures
5. Download **playwright-report** artifact to view the HTML report locally

### GitHub Actions Workflow File

Location: `.github/workflows/playwright.yml`

```yaml
name: Playwright Tests

on:
  push:
    branches: [ main, master ]
  pull_request:
    branches: [ main, master ]

jobs:
  test:
    timeout-minutes: 60
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: lts/*
          cache: 'npm'
      - name: Install dependencies
        run: npm ci
      - name: Install Playwright browsers
        run: npx playwright install --with-deps chromium
      - name: Run Playwright tests
        run: npx playwright test --config=playwright.config.js --workers=2
      - name: Upload HTML report
        uses: actions/upload-artifact@v4
        if: ${{ !cancelled() }}
        with:
          name: playwright-report
          path: playwright-report/
          retention-days: 30
```

### Key Points About GitHub Actions Execution

- **Fresh machine every run** — nothing carries over between runs (no cached browsers, no leftover state)
- **Headless only** — no display on CI servers, so `headless: true` in config is required
- **Free tier** — GitHub gives 2,000 minutes/month free on public repos; private repos have limits
- **No Azure needed** — this workflow runs entirely on GitHub infrastructure, no credentials required

---

## 7. Azure Playwright Service — How It Works

### What Azure Playwright Service Is

Azure Playwright Service is Microsoft's cloud offering that replaces the browser execution environment. Instead of running browsers on the GitHub Actions VM (limited CPU/RAM), browsers run on **dedicated Azure cloud machines** — faster, more scalable, and with better reporting.

### How It Differs from Standard GitHub Actions

| Aspect | GitHub Actions (standard) | Azure Playwright Service |
|--------|--------------------------|--------------------------|
| Where browsers run | GitHub's Ubuntu VM | Azure cloud machines |
| Parallelism | Limited by VM cores | Scale to many workers |
| Reporting | HTML file artifact | Azure dashboard + HTML |
| Cost | GitHub free minutes | Azure subscription required |
| Setup | No credentials needed | Azure login required |
| Speed | Moderate | Faster (dedicated infra) |

### Prerequisites for Azure Execution

1. **Azure subscription** with Playwright Service enabled
2. **`AZURE_CREDENTIALS`** secret added to GitHub repository settings
3. **`PLAYWRIGHT_SERVICE_URL`** variable set in GitHub repository settings
4. Azure CLI logged in (for local execution)

### How Authentication Works

```
GitHub Actions
     │
     ├── azure/login@v2 action
     │    └── uses AZURE_CREDENTIALS secret
     │         └── authenticates to Azure tenant
     │
     └── npx playwright test --config=playwright.service.config.js
          └── playwright.service.config.js
               └── createAzurePlaywrightConfig()
                    └── DefaultAzureCredential()
                         └── picks up the Azure login from step above
                              └── connects to PLAYWRIGHT_SERVICE_URL
                                   └── runs browsers on Azure machines
```

### Azure Config Deep Dive

```javascript
// playwright.service.config.js
createAzurePlaywrightConfig(config, {
  exposeNetwork: '<loopback>',   // allows container to reach localhost services
  connectTimeout: 3 * 60 * 1000, // 3 minutes to establish connection to Azure
  os: ServiceOS.LINUX,           // run on Linux Azure machines
  credential: new DefaultAzureCredential(), // use logged-in Azure identity
})
```

### Azure Pipeline Steps (original workflow)

```
1. GitHub VM spins up (ubuntu-latest)
        │
2. Checkout + Node setup + npm ci
        │
3. Azure Login
   └── authenticates GitHub runner to Azure using AZURE_CREDENTIALS secret
        │
4. Run tests with Azure config
   └── npx playwright test --config=playwright.service.config.js --workers=4
       ┌────────────────────────────────────────────────┐
       │  Playwright connects to Azure Playwright Service│
       │  Browsers launch on Azure cloud machines        │
       │  Test code runs on GitHub VM                    │
       │  Browser sessions hosted on Azure              │
       └────────────────────────────────────────────────┘
        │
5. Results reported to Azure Playwright Workspaces dashboard
6. HTML report uploaded as GitHub artifact
```

### Setting Up Azure Credentials in GitHub

1. In Azure Portal → Create a Service Principal:
   ```bash
   az ad sp create-for-rbac --name "playwright-ci" --sdk-auth
   ```
2. Copy the JSON output
3. In GitHub repo → **Settings → Secrets → Actions → New secret**
   - Name: `AZURE_CREDENTIALS`
   - Value: paste the JSON
4. In GitHub repo → **Settings → Variables → Actions → New variable**
   - Name: `PLAYWRIGHT_SERVICE_URL`
   - Value: your Azure Playwright Service endpoint URL

---

## 8. Execution Flow: Local vs GitHub vs Azure

```
                    ┌─────────────────────────────────────────────┐
                    │            WHERE DO BROWSERS RUN?           │
                    └─────────────────────────────────────────────┘

┌──────────────────┐    ┌──────────────────┐    ┌──────────────────────┐
│   LOCAL DEV      │    │  GITHUB ACTIONS  │    │  AZURE PLAYWRIGHT    │
│                  │    │  (standard)      │    │  SERVICE             │
├──────────────────┤    ├──────────────────┤    ├──────────────────────┤
│ Your machine     │    │ GitHub Ubuntu VM │    │ GitHub VM (control)  │
│                  │    │                  │    │ + Azure cloud (browser│
│ Config used:     │    │ Config used:     │    │ Config used:         │
│ playwright       │    │ playwright       │    │ playwright.service   │
│ .config.js       │    │ .config.js       │    │ .config.js           │
│                  │    │                  │    │                      │
│ Browsers:        │    │ Browsers:        │    │ Browsers:            │
│ installed locally│    │ installed by     │    │ provided by Azure    │
│                  │    │ npx pw install   │    │ (no install needed)  │
│                  │    │                  │    │                      │
│ Workers: default │    │ Workers: 2       │    │ Workers: 4           │
│                  │    │                  │    │                      │
│ Report: opens in │    │ Report: uploaded │    │ Report: Azure dash + │
│ browser auto     │    │ as artifact      │    │ GitHub artifact      │
│                  │    │                  │    │                      │
│ Trigger: manual  │    │ Trigger: push/PR │    │ Trigger: push/PR     │
│                  │    │                  │    │ (needs Azure secrets)│
└──────────────────┘    └──────────────────┘    └──────────────────────┘
```

---

## 9. Running Tests

### Local — Command Line

```bash
# Install dependencies (first time only)
npm ci

# Install browsers (first time only)
npx playwright install chromium

# Run all tests (default config)
npm run regression

# Run only Web-tagged tests
npm run webTests

# Run only API-tagged tests
npm run APITests

# Run Safari/iPhone tests (alternate config)
npm run SafariNewConfig

# Run with visible browser (headed mode)
npx playwright test --headed

# Run a single test file
npx playwright test tests/ClientAppPO.spec.js

# Open Playwright UI mode (interactive)
npx playwright test --ui

# View last HTML report
npx playwright show-report
```

### Docker — Container Execution

```bash
# Build and run (report saved to ./playwright-report on host)
docker compose up --build

# Run directly with Docker
docker build -t qaops-playwright .
docker run --rm -v $(pwd)/playwright-report:/app/playwright-report qaops-playwright
```

### GitHub Actions — Automatic

Push any commit to `main` or `master` branch — pipeline triggers automatically.

To run manually:
1. GitHub repo → **Actions** tab
2. Select **Playwright Tests** workflow
3. Click **Run workflow**

### Azure Playwright Service — Via GitHub Actions

Requires `AZURE_CREDENTIALS` and `PLAYWRIGHT_SERVICE_URL` configured in repo secrets/variables. Switch the workflow to use `playwright.service.config.js` and add the Azure login step.

---

## Quick Reference

| What | Command / Location |
|------|--------------------|
| All tests | `npm run regression` |
| Web tests only | `npm run webTests` |
| API tests only | `npm run APITests` |
| Safari/mobile | `npm run SafariNewConfig` |
| Docker run | `docker compose up --build` |
| View report | `npx playwright show-report` |
| CI pipeline | `.github/workflows/playwright.yml` |
| Default config | `playwright.config.js` |
| Multi-browser config | `playwright.config1.js` |
| Azure config | `playwright.service.config.js` |
| Page objects | `pageobjects/` |
| Test specs | `tests/` |
| BDD features | `features/` |
