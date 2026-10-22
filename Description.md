# SIS 2: Test Automation with Playwright

## Purpose

This project applies automated end-to-end testing to a real web application. It covers five core user scenarios with a maintainable test suite. It demonstrates the Page Object Model, Playwright fixtures, independent test data and parallel-safe execution.

## Website under test

[Practice Software Testing (Toolshop)](https://practicesoftwaretesting.com/) is a public demo web shop built for testing practice. It has a product catalogue, a cart, a multi-step checkout, customer registration and login, and a password reset form.

## Why Playwright and TypeScript

- **Auto-waiting and web-first assertions.** Playwright retries actions and assertions until they pass or time out. This removes fixed sleeps and reduces flaky tests.
- **Resilient locators.** `getByTestId`, `getByRole` and `getByLabel` locate elements by purpose, not by layout or styling. The project sets `testIdAttribute: 'data-test'`, which is the attribute the site uses.
- **Isolation and parallelism.** Each test runs in a fresh browser context, so tests can run in parallel without sharing cookies or storage.
- **Built-in tooling.** Playwright provides a test runner, traces, an HTML report and codegen for locating elements.
- **TypeScript.** Static typing catches mistakes in page objects and test data at compile time, and gives editor autocompletion for the page-object API.

## Test cases

| # | Spec file | Scenario |
|---|-----------|----------|
| 1 | `tests/register.spec.ts` | Register a new customer with unique data, then sign in with the new credentials. |
| 2 | `tests/login.spec.ts` | Valid credentials reach the account page. Invalid credentials show an error and do not. |
| 3 | `tests/buy-product.spec.ts` | Add a product to the cart with quantity 2, verify the item and quantity, and complete checkout. |
| 4 | `tests/compare-products.spec.ts` | Capture the name and price of two products and assert a meaningful comparison. The site has no built-in compare feature. |
| 5 | `tests/reset-password.spec.ts` | A known email shows the expected confirmation. An invalid email shows an error. |

Each test case is one spec file containing one `test()`.

## Architecture

```
pages/      Page objects: all locators, business actions and page assertions
fixtures/   pages.fixture.ts: provides page objects to tests
data/       user.factory.ts: generates test users
tests/      One spec file per test case
```

- **Page Object Model.** Each page has a class in `pages/`. Locators are private. Pages expose business actions such as `signIn()`, `registerUser()`, `addProductToCart()` and `checkout()`. They also expose assertions such as `expectLoginRejected()`. Spec files contain no locators and read as a description of the scenario.
- **Fixtures.** `fixtures/pages.fixture.ts` extends Playwright's `test`, so a spec receives ready-made page objects (`loginPage`, `cartPage`, `productPage`, ...) from its parameters. Specs never construct page objects themselves, and they import `test` and `expect` from this file.
- **Configuration.** `playwright.config.ts` sets the base URL, the test-id attribute, a Chromium project, full parallelism, retries only on CI and a trace on the first retry.

## Independence and unique data

- **Isolated browser state.** Playwright gives every test a new browser context, so no session carries over between tests.
- **Unique registration data.** `UserFactory.create()` builds a new customer for each call. The email contains a random UUID fragment, so parallel workers and repeated runs do not collide. No reusable registration email is hard-coded.
- **No shared mutable accounts.** Tests that change server-side state, such as registration and checkout, use their own newly created user. The login and reset-password tests only read the seeded demo customer and do not modify it.
- **Stable product selection.** Products are chosen by name, not by position. No test depends on the number or order of products in the catalogue.
- **Order independence.** No test relies on another test's result, so the suite can run in any order and in parallel.

## Status

The project structure, page objects, fixtures, data factory and five specs are written, and the project compiles with TypeScript. Selectors and routes were checked against the live site. Test execution results are not part of this description.
