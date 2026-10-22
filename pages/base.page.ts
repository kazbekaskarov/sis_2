import { expect, type Locator, type Page } from '@playwright/test';

export abstract class BasePage {
  private readonly cartLink: Locator;
  private readonly userMenu: Locator;

  constructor(protected readonly page: Page) {
    this.cartLink = page.getByTestId('nav-cart');
    this.userMenu = page.getByTestId('nav-menu');
  }

  async openCart(): Promise<void> {
    await this.cartLink.click();
  }

  async expectSignedInAs(fullName: string): Promise<void> {
    await expect(this.userMenu).toContainText(fullName);
  }

  protected static parsePrice(text: string): number {
    const match = text.replace(/,/g, '').match(/\d+(\.\d+)?/);
    if (!match) {
      throw new Error(`Cannot parse a price from "${text}"`);
    }
    return Number(match[0]);
  }
}
