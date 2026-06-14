import { defineConfig, devices } from '@playwright/test';
import * as path from 'path';

const ENV = process.env.TEST_ENV || 'dev';
const envConfig = require(path.resolve(__dirname, `environments/${ENV}.json`));

export default defineConfig({
  testDir: '../tests',
  testMatch: '**/*.spec.ts',

  timeout:        envConfig.timeout,
  retries:        envConfig.retries,
  workers:        process.env.CI ? 2 : 1,
  fullyParallel:  false,

  reporter: [
    ['html',  { outputFolder: '../reports/html', open: 'never' }],
    ['list'],
  ],

  use: {
    baseURL:       envConfig.baseUrl,
    headless:      envConfig.headless,
    screenshot:    'only-on-failure',
    video:         'retain-on-failure',
    trace:         'retain-on-failure',
    ignoreHTTPSErrors: true,
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'webkit',
      use: { ...devices['iPhone 11'] },
    },
  ],
});
