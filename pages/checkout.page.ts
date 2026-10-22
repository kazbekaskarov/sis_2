import { expect, type Locator, type Page } from '@playwright/test';
import type { NewUser } from '../data/user.factory';
import { BasePage } from './base.page';

export class CheckoutPage extends BasePage {
  private readonly continueAfterSignIn: Locator;
  private readonly country: Locator;
  private readonly postalCode: Locator;
  private readonly houseNumber: Locator;
  private readonly street: Locator;
  private readonly city: Locator;
  private readonly state: Locator;
  private readonly continueAfterAddress: Locator;
  private readonly paymentMethod: Locator;
  private readonly finishButton: Locator;
  private readonly paymentSuccess: Locator;
  private readonly orderConfirmation: Locator;

  constructor(page: Page) {
    super(page);
    this.continueAfterSignIn = page.getByTestId('proceed-2');
    this.country = page.getByTestId('country');
    this.postalCode = page.getByTestId('postal_code');
    this.houseNumber = page.getByTestId('house_number');
    this.street = page.getByTestId('street');
    this.city = page.getByTestId('city');
    this.state = page.getByTestId('state');
    this.continueAfterAddress = page.getByTestId('proceed-3');
    this.paymentMethod = page.getByTestId('payment-method');
    this.finishButton = page.getByTestId('finish');
    this.paymentSuccess = page.getByTestId('payment-success-message');
    // The confirmation has no data-test attribute; it is plain text on the page.
    this.orderConfirmation = page.getByText(/Thanks for your order! Your invoice number is INV-/);
  }

  /** Signed-in checkout: sign-in step, billing address, cash-on-delivery payment, confirm. */
  async checkout(billing: NewUser): Promise<void> {
    await this.continueAfterSignIn.click();

    // The billing address is prefilled from the registered profile, except the house
    // number. Re-typing the prefilled fields races with the site's address lookup and
    // intermittently makes the order API reject the invoice (HTTP 422), so only the
    // missing field is filled, after the prefilled address has loaded.
    await expect(this.street).toHaveValue(billing.street);
    await expect(this.city).toHaveValue(billing.city);
    await this.houseNumber.fill(billing.houseNumber);
    await expect(this.street).toHaveValue(billing.street);
    await this.continueAfterAddress.click();

    await this.paymentMethod.selectOption('cash-on-delivery');
    await this.finishButton.click();
    await expect(this.paymentSuccess).toBeVisible();
    await expect(this.finishButton).toHaveText(/Confirm/);

    // The order API validates the address through an external lookup that intermittently
    // answers HTTP 422 (seen even for real addresses). Re-submitting is the documented
    // user action; the test still passes only once the invoice confirmation appears.
    await expect(async () => {
      if (await this.orderConfirmation.isVisible()) {
        return;
      }
      await this.finishButton.click();
      await expect(this.orderConfirmation).toBeVisible({ timeout: 8_000 });
    }).toPass({ timeout: 40_000 });
  }

  async expectOrderConfirmed(): Promise<void> {
    // Order creation is a server round trip and slows down under parallel load.
    await expect(this.orderConfirmation).toBeVisible({ timeout: 20_000 });
  }
}
