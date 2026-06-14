import { Page } from '@playwright/test';
import { BasePage } from './BasePage.js';

export class OrdersHistoryPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  async searchOrderAndSelect(orderId: string): Promise<void> {
    const rows = this.page.locator('tbody tr');
    await this.page.locator('tbody').waitFor();
    const count = await rows.count();
    for (let i = 0; i < count; i++) {
      const rowId = (await rows.nth(i).locator('th').textContent()) ?? '';
      if (orderId.includes(rowId.trim())) {
        await rows.nth(i).locator('button').first().click();
        await this.waitForPageLoad();
        return;
      }
    }
  }

  async getOrderId(): Promise<string> {
    const id = await this.locator('.col-text').textContent();
    return id?.trim() ?? '';
  }
}
