import { expect, test } from '../fixtures/pages.fixture';

// Two different products from the catalogue, selected by name, never by position.
const PRODUCT_A_NAME = 'Pliers';
const PRODUCT_B_NAME = 'Bolt Cutters';

test('compares two products by captured name and price', async ({ homePage, productPage }) => {
  await homePage.goto();
  await homePage.openProduct(PRODUCT_A_NAME);
  const productA = await productPage.getDetails();

  await homePage.goto();
  await homePage.openProduct(PRODUCT_B_NAME);
  const productB = await productPage.getDetails();

  // The captured data belongs to the products we asked for, and they are distinct.
  expect(productA.name).toBe(PRODUCT_A_NAME);
  expect(productB.name).toBe(PRODUCT_B_NAME);
  expect(productA.name).not.toBe(productB.name);

  // Captured prices are real, positive numbers.
  expect(productA.price).toBeGreaterThan(0);
  expect(productB.price).toBeGreaterThan(0);

  // The comparison itself: one product is strictly more expensive than the other.
  expect(productA.price).not.toBe(productB.price);
  const [cheaper, pricier] = [productA, productB].sort((a, b) => a.price - b.price);
  expect(pricier.price).toBeGreaterThan(cheaper.price);
});
