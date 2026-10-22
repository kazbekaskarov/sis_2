import { test as base, expect } from '@playwright/test';
import { AccountPage } from '../pages/account.page';
import { CartPage } from '../pages/cart.page';
import { CheckoutPage } from '../pages/checkout.page';
import { ForgotPasswordPage } from '../pages/forgot-password.page';
import { HomePage } from '../pages/home.page';
import { LoginPage } from '../pages/login.page';
import { ProductPage } from '../pages/product.page';
import { RegisterPage } from '../pages/register.page';

interface PageFixtures {
  accountPage: AccountPage;
  cartPage: CartPage;
  checkoutPage: CheckoutPage;
  forgotPasswordPage: ForgotPasswordPage;
  homePage: HomePage;
  loginPage: LoginPage;
  productPage: ProductPage;
  registerPage: RegisterPage;
}

export const test = base.extend<PageFixtures>({
  accountPage: async ({ page }, use) => use(new AccountPage(page)),
  cartPage: async ({ page }, use) => use(new CartPage(page)),
  checkoutPage: async ({ page }, use) => use(new CheckoutPage(page)),
  forgotPasswordPage: async ({ page }, use) => use(new ForgotPasswordPage(page)),
  homePage: async ({ page }, use) => use(new HomePage(page)),
  loginPage: async ({ page }, use) => use(new LoginPage(page)),
  productPage: async ({ page }, use) => use(new ProductPage(page)),
  registerPage: async ({ page }, use) => use(new RegisterPage(page)),
});

export { expect };
