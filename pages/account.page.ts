import { expect } from '@playwright/test';
import { BasePage } from './base.page';

export class AccountPage extends BasePage {
  async expectLoaded(): Promise<void> {
    await expect(this.page).toHaveURL(/\/account/);
  }

  async expectNotReached(): Promise<void> {
    await expect(this.page).not.toHaveURL(/\/account/);
  }
}
