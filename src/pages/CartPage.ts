import { Page, expect } from '@playwright/test';
import { BasePage } from './BasePage.js';

export class CartPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  async verifyProductIsDisplayed(productName: string): Promise<void> {
    await expect(this.locator(`h3:has-text("${productName}")`)).toBeVisible();
  }

  async checkout(): Promise<void> {
    await this.locator('text=Checkout').click();
    await this.waitForPageLoad();
  }
}
