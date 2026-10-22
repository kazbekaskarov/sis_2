import { expect, type Locator, type Page } from '@playwright/test';
import { BasePage } from './base.page';

export class HomePage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  async goto(): Promise<void> {
    await this.page.goto('/');
  }

  async openProduct(name: string): Promise<void> {
    const productName = this.page.getByTestId('product-name').filter({ hasText: HomePage.exactName(name) });
    await expect(productName).toBeVisible();
    await productName.click();
  }

  /**
   * Opens the first product from `names` that is currently in stock. Stock on the shared
   * demo site is finite and changes as orders are placed, so a purchase test cannot rely
   * on one fixed product being available.
   */
  async openFirstInStockProduct(names: string[]): Promise<void> {
    await expect(this.page.getByTestId('product-name').first()).toBeVisible();
    for (const name of names) {
      const card = this.inStockCard(name);
      if ((await card.count()) > 0) {
        await card.click();
        return;
      }
    }
    throw new Error(`None of these products is in stock: ${names.join(', ')}`);
  }

  private inStockCard(name: string): Locator {
    return this.page
      .getByRole('link')
      .filter({ has: this.page.getByTestId('product-name').filter({ hasText: HomePage.exactName(name) }) })
      .filter({ hasNot: this.page.getByTestId('out-of-stock') });
  }

  // Exact match: "Pliers" must not match "Combination Pliers" or "Long Nose Pliers".
  private static exactName(name: string): RegExp {
    return new RegExp(`^\\s*${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*$`);
  }
}
