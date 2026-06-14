import { Page } from '@playwright/test';
import { BasePage } from './BasePage';
import { URLS } from '../constants';

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
}
