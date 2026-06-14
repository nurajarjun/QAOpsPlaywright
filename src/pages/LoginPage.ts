import { Page } from '@playwright/test';
import { BasePage } from './BasePage.js';
import { URLS } from '../constants/index.js';

export class LoginPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  async goTo(): Promise<void> {
    await this.page.goto(URLS.LOGIN);
  }

  async validLogin(username: string, password: string): Promise<void> {
    await this.locator('#userEmail').fill(username);
    await this.locator('#userPassword').fill(password);
    await this.locator('[value="Login"]').click();
    await this.waitForPageLoad();
  }

  async getErrorMessage(): Promise<string> {
    const el = this.locator('[style*="block"]');
    await el.waitFor({ timeout: 10000 });
    return (await el.textContent()) ?? '';
  }
}
