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

  async loginExpectingError(username: string, password: string): Promise<string> {
    await this.locator('#userEmail').fill(username);
    await this.locator('#userPassword').fill(password);
    // Start watching for the error toast BEFORE clicking — it appears and disappears
    // quickly, so waitFor + click must race together to avoid missing it.
    await Promise.all([
      this.page.locator('[style*="block"]').waitFor({ state: 'visible', timeout: 10000 }),
      this.locator('[value="Login"]').click(),
    ]);
    return (await this.page.locator('[style*="block"]').textContent()) ?? '';
  }
}
