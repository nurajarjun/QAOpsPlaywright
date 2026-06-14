import { test, expect } from '../../src/fixtures/index.js';

test.describe('@UI Login Page', () => {

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
