import { UserFactory } from '../data/user.factory';
import { expect, test } from '../fixtures/pages.fixture';

// Candidate products, selected by name, never by position. Stock on the shared demo
// site is finite and changes, so the first one that is in stock is bought.
const CANDIDATE_PRODUCTS = [
  'Slip Joint Pliers',
  'Bolt Cutters',
  'Hammer',
  'Claw Hammer',
  'Combination Pliers',
  'Thor Hammer',
];
const QUANTITY = 2;

test('buys a product: add to cart, verify item and quantity, complete checkout', async ({
  registerPage,
  loginPage,
  accountPage,
  homePage,
  productPage,
  cartPage,
  checkoutPage,
}) => {
  // Own account per run, so no cart or order state is shared with other tests.
  const user = UserFactory.create();
  await registerPage.goto();
  await registerPage.registerUser(user);
  await registerPage.expectRegistrationSucceeded();
  await loginPage.signIn(user.email, user.password);
  await accountPage.expectLoaded();

  await homePage.goto();
  await homePage.openFirstInStockProduct(CANDIDATE_PRODUCTS);

  const product = await productPage.getDetails();
  expect(CANDIDATE_PRODUCTS).toContain(product.name);

  await productPage.addProductToCart(QUANTITY);
  await productPage.openCart();

  await cartPage.expectItem(product.name, QUANTITY);
  await cartPage.proceedToCheckout();

  await checkoutPage.checkout(user);
  await checkoutPage.expectOrderConfirmed();
});
