import { Page } from '@playwright/test';
import { BasePage } from './BasePage.js';

export class OrdersHistoryPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  async searchOrderAndSelect(orderId: string): Promise<void> {
    await this.locator(`tr:has-text("${orderId}")`).locator('button').first().click();
    await this.waitForPageLoad();
  }

  async getOrderId(): Promise<string> {
    const id = await this.locator('.col-text').textContent();
    return id?.trim() ?? '';
  }
}
