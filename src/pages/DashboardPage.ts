import { Page } from '@playwright/test';
import { BasePage } from './BasePage';
import { URLS } from '../constants';

export class DashboardPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  async searchProductAddCart(productName: string): Promise<void> {
    const allProducts = this.locator('.card-body');
    const count = await allProducts.count();
    for (let i = 0; i < count; i++) {
      const product = allProducts.nth(i);
      if ((await product.locator('b').textContent()) === productName) {
        await product.locator('text=Add To Cart').click();
        break;
      }
    }
  }

  async navigateToCart(): Promise<void> {
    await this.locator("[routerlink*='cart']").click();
    await this.waitForPageLoad();
  }

  async navigateToOrders(): Promise<void> {
    await this.page.goto(URLS.ORDERS_HISTORY);
    await this.waitForPageLoad();
  }
}
