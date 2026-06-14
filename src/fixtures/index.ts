import { test as base }          from '@playwright/test';
import { POManager }              from '../pages/POManager.js';
import { ApiHelper }              from '../helpers/ApiHelper.js';
import { EventHubApiHelper }      from '../helpers/EventHubApiHelper.js';
import { OrderTestData }          from '../types/index.js';

const defaultData: OrderTestData = require('../../data/order-test-data.json')[0];

type Fixtures = {
  poManager:        POManager;
  apiHelper:        ApiHelper;
  eventHubApi:      EventHubApiHelper;
  testDataForOrder: OrderTestData;
};

export const test = base.extend<Fixtures>({

  testDataForOrder: async ({}, use) => {
    const data: OrderTestData = {
      username:    process.env.TEST_USERNAME || defaultData.username,
      password:    process.env.TEST_PASSWORD || defaultData.password,
      productName: process.env.TEST_PRODUCT  || defaultData.productName,
    };
    await use(data);
  },

  poManager: async ({ page }, use) => {
    await use(new POManager(page));
  },

  apiHelper: async ({ playwright }, use) => {
    const ctx = await playwright.request.newContext();
    await use(new ApiHelper(ctx));
    await ctx.dispose();
  },

  eventHubApi: async ({ playwright }, use) => {
    const ctx = await playwright.request.newContext();
    await use(new EventHubApiHelper(ctx));
    await ctx.dispose();
  },
});

export { expect } from '@playwright/test';
