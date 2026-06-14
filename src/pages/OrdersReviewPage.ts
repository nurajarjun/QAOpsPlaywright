import { Page } from '@playwright/test';
import { BasePage } from './BasePage.js';

export class OrdersReviewPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  async searchCountryAndSelect(searchText: string, country: string): Promise<void> {
    await this.locator('[placeholder="Select Country"]').pressSequentially(searchText);
    await this.page.locator('.ta-results').waitFor();
    // Use filter with exact regex to avoid matching partial names (e.g. "British Indian Ocean" when searching "India")
    await this.page.locator('.ta-item').filter({ hasText: new RegExp(`^\\s*${country}\\s*$`) }).click();
  }

  async submitAndGetOrderId(): Promise<string> {
    await this.locator('.action__submit').click();
    await this.waitForPageLoad();
    const orderId = await this.locator('.em-spacer-1 .ng-star-inserted').textContent();
    return orderId?.trim() ?? '';
  }
}
