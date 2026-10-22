import { expect, type Locator, type Page } from '@playwright/test';
import type { NewUser } from '../data/user.factory';
import { BasePage } from './base.page';

export class RegisterPage extends BasePage {
  private readonly firstName: Locator;
  private readonly lastName: Locator;
  private readonly dateOfBirth: Locator;
  private readonly country: Locator;
  private readonly postalCode: Locator;
  private readonly houseNumber: Locator;
  private readonly street: Locator;
  private readonly city: Locator;
  private readonly state: Locator;
  private readonly phone: Locator;
  private readonly email: Locator;
  private readonly password: Locator;
  private readonly submitButton: Locator;

  constructor(page: Page) {
    super(page);
    this.firstName = page.getByTestId('first-name');
    this.lastName = page.getByTestId('last-name');
    this.dateOfBirth = page.getByTestId('dob');
    this.country = page.getByTestId('country');
    this.postalCode = page.getByTestId('postal_code');
    this.houseNumber = page.getByTestId('house_number');
    this.street = page.getByTestId('street');
    this.city = page.getByTestId('city');
    this.state = page.getByTestId('state');
    this.phone = page.getByTestId('phone');
    this.email = page.getByTestId('email');
    this.password = page.getByTestId('password');
    this.submitButton = page.getByTestId('register-submit');
  }

  async goto(): Promise<void> {
    await this.page.goto('/auth/register');
  }

  async registerUser(user: NewUser): Promise<void> {
    await this.firstName.fill(user.firstName);
    await this.lastName.fill(user.lastName);
    await this.dateOfBirth.fill(user.dateOfBirth);
    await this.country.selectOption(user.country);
    await this.postalCode.fill(user.postalCode);
    await this.houseNumber.fill(user.houseNumber);
    await this.street.fill(user.street);
    await this.city.fill(user.city);
    await this.state.fill(user.state);
    await this.phone.fill(user.phone);
    await this.email.fill(user.email);
    await this.password.fill(user.password);
    await this.submitButton.click();
  }

  async expectRegistrationSucceeded(): Promise<void> {
    await expect(this.page).toHaveURL(/\/auth\/login/);
  }
}
