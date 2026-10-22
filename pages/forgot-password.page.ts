import { expect, type Locator, type Page } from '@playwright/test';
import { BasePage } from './base.page';

export class ForgotPasswordPage extends BasePage {
  private readonly emailInput: Locator;
  private readonly submitButton: Locator;
  private readonly successAlert: Locator;
  private readonly emailError: Locator;

  constructor(page: Page) {
    super(page);
    this.emailInput = page.getByTestId('email');
    this.submitButton = page.getByTestId('forgot-password-submit');
    // The success alert has no data-test attribute.
    this.successAlert = page.getByRole('alert');
    this.emailError = page.getByTestId('email-error');
  }

  async goto(): Promise<void> {
    await this.page.goto('/auth/forgot-password');
  }

  async requestReset(email: string): Promise<void> {
    await this.emailInput.fill(email);
    await this.submitButton.click();
  }

  async expectResetRequested(): Promise<void> {
    await expect(this.successAlert).toBeVisible();
  }

  async expectEmailRejected(): Promise<void> {
    await expect(this.emailError).toBeVisible();
    await expect(this.emailInput).toHaveAttribute('aria-invalid', 'true');
    await expect(this.successAlert).toHaveCount(0);
  }
}
