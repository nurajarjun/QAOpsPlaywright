import { test, expect } from '../../src/fixtures';

test.describe('@E2E Order Flow', () => {

  test('complete order journey — login to confirmation', async ({ poManager, testDataForOrder }) => {
    const { username, password, productName } = testDataForOrder;

    const loginPage     = poManager.getLoginPage();
    const dashboardPage = poManager.getDashboardPage();
    const cartPage      = poManager.getCartPage();
    const reviewPage    = poManager.getOrdersReviewPage();
    const historyPage   = poManager.getOrdersHistoryPage();

    await loginPage.goTo();
    await loginPage.validLogin(username, password);

    await dashboardPage.searchProductAddCart(productName);
    await dashboardPage.navigateToCart();

    await cartPage.verifyProductIsDisplayed(productName);
    await cartPage.checkout();

    await reviewPage.searchCountryAndSelect('ind', 'India');
    const orderId = await reviewPage.submitAndGetOrderId();

    await dashboardPage.navigateToOrders();
    await historyPage.searchOrderAndSelect(orderId);

    expect(orderId).toContain(await historyPage.getOrderId());
  });

});
