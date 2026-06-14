import { test, expect } from '../../src/fixtures';

test.describe('@UI Login Page', () => {

  test('valid login navigates to dashboard', async ({ poManager, testDataForOrder }) => {
    const loginPage = poManager.getLoginPage();
    await loginPage.goTo();
    await loginPage.validLogin(testDataForOrder.username, testDataForOrder.password);
    await expect(poManager.getDashboardPage()['page']).toHaveURL(/dashboard/);
  });

  test('invalid login shows error', async ({ poManager }) => {
    const loginPage = poManager.getLoginPage();
    await loginPage.goTo();
    await loginPage.validLogin('wrong@email.com', 'wrongpassword');
    await expect(poManager.getLoginPage()['page'].locator('[style*="block"]')).toBeVisible();
  });

});
