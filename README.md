# SIS 2: Playwright test automation for Practice Software Testing

Automated tests (TypeScript, `@playwright/test`) for https://practicesoftwaretesting.com/.

## Install and run

Requires Node.js 20 or 22 LTS.

```bash
npm ci                              # installs the exact versions from package-lock.json
npx playwright install chromium     # downloads the browser (add --with-deps on Linux)
npx playwright test                 # runs all tests in parallel
npx playwright show-report   # opens the HTML report
```

Useful variants:

```bash
npx playwright test tests/login.spec.ts   # one spec
npx playwright test --headed              # watch the browser
npm run typecheck                         # TypeScript check only
```

## Test cases (one spec file each, one test each)

| # | Spec | What it proves |
|---|------|----------------|
| 1 | `tests/register.spec.ts` | A new customer registers, then signs in with the same credentials |
| 2 | `tests/login.spec.ts` | Valid login reaches the account page; invalid login shows an error and does not |
| 3 | `tests/buy-product.spec.ts` | Add a product with quantity 2, verify it in the cart, complete checkout |
| 4 | `tests/compare-products.spec.ts` | Capture name and price of two products and compare them |
| 5 | `tests/reset-password.spec.ts` | Known email shows confirmation; invalid email shows an error |

## Architecture

- `pages/`: Page Object Model. All locators live here and are private; pages expose business actions (`signIn`, `registerUser`, `addProductToCart`, `checkout`) and `expect*` assertions.
- `fixtures/pages.fixture.ts`: extends Playwright's `test` so specs receive page objects (`loginPage`, `cartPage`, ...). Specs import `test` and `expect` only from here.
- `data/user.factory.ts`: generates a new customer per call with a unique email (UUID based).
- `playwright.config.ts`: `baseURL`, `testIdAttribute: 'data-test'`, Chromium project, `fullyParallel`, retries only on CI, trace on first retry.

## Independence and parallelism

- Every test gets a fresh browser context.
- Registration and checkout use a freshly generated user, so no test depends on another test's data.
- Login registers its own user. Only the reset-password test uses the seeded demo email (`customer@practicesoftwaretesting.com`), and it only requests a reset.
- Products are selected by name, never by position, and no test asserts catalogue size.

## Known limitations

- The target is a public shared demo site; its data can be reset or changed by others, and it can be slow.
- Product stock is finite and shared: the purchase test buys the first in-stock product from a candidate list, and a product can run out after many orders.
- The order API validates the billing address through an external lookup that sometimes answers HTTP 422, so the checkout page object re-submits "Confirm" until the invoice confirmation appears.
- The site locks an account after repeated failed logins, so the login test registers its own user and never fails a login against a shared account.

## Verifying selectors with codegen

```bash
npx playwright codegen https://practicesoftwaretesting.com --test-id-attribute=data-test
```
