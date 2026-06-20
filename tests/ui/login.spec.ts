import { test, expect } from '../../src/fixtures/index.js';

const HAS_CREDS = !!(process.env.TEST_USERNAME && process.env.TEST_PASSWORD);

test.describe('@UI Login Page', () => {

  test.beforeAll(() => {
    if (!HAS_CREDS) test.skip(true, 'UI tests require credentials — set TEST_USERNAME and TEST_PASSWORD (or store as ECOM_USERNAME / ECOM_PASSWORD secrets in GitHub)');
  });

  test('valid login navigates to dashboard', async ({ poManager, testDataForOrder }) => {
    const loginPage = poManager.getLoginPage();
    await loginPage.goTo();
    await loginPage.validLogin(testDataForOrder.username, testDataForOrder.password);
    await expect(poManager.getDashboardPage()['page']).toHaveURL(/dashboard/);
  });

  test('invalid login stays on login page', async ({ poManager }) => {
    const loginPage = poManager.getLoginPage();
    await loginPage.goTo();
    await loginPage.validLogin('wrong@email.com', 'wrongpassword');
    // Failed login must not navigate to dashboard — URL stays on /client
    await expect(poManager.getLoginPage()['page']).not.toHaveURL(/dashboard/);
    await expect(poManager.getLoginPage()['page']).toHaveURL(/client/);
  });

});
