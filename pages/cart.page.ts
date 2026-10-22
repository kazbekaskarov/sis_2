import { expect, type Locator, type Page } from '@playwright/test';
import { BasePage } from './base.page';

export class CartPage extends BasePage {
  private readonly proceedButton: Locator;

  constructor(page: Page) {
    super(page);
    this.proceedButton = page.getByTestId('proceed-1');
  }

  async expectItem(name: string, quantity: number): Promise<void> {
    const row = this.page.getByRole('row').filter({ hasText: name });
    await expect(row).toBeVisible();
    await expect(row.getByRole('spinbutton')).toHaveValue(String(quantity));
  }

  async proceedToCheckout(): Promise<void> {
    await this.proceedButton.click();
  }
}
