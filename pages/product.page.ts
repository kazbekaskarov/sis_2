import { expect, type Locator, type Page } from '@playwright/test';
import { BasePage } from './base.page';

export interface ProductDetails {
  name: string;
  price: number;
}

export class ProductPage extends BasePage {
  private readonly name: Locator;
  private readonly price: Locator;
  private readonly quantity: Locator;
  private readonly addToCartButton: Locator;
  private readonly addedToCartAlert: Locator;

  constructor(page: Page) {
    super(page);
    this.name = page.getByTestId('product-name');
    this.price = page.getByTestId('unit-price');
    this.quantity = page.getByTestId('quantity');
    this.addToCartButton = page.getByTestId('add-to-cart');
    this.addedToCartAlert = page.getByRole('alert').filter({ hasText: 'Product added to shopping cart' });
  }

  async getDetails(): Promise<ProductDetails> {
    await expect(this.name).toBeVisible();
    await expect(this.price).toBeVisible();
    const name = (await this.name.innerText()).trim();
    const price = BasePage.parsePrice(await this.price.innerText());
    return { name, price };
  }

  async addProductToCart(quantity = 1): Promise<void> {
    await this.quantity.fill(String(quantity));
    await this.addToCartButton.click();
    await expect(this.addedToCartAlert).toBeVisible();
  }
}
