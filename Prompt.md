# Prompts Used (SIS 2)

> This file covers the Playwright test suite. The prompts, model and error log for the CI pipeline are in [AI_USAGE_SIS2.md](AI_USAGE_SIS2.md).

## AI tool used

| Item | Value |
|------|-------|
| Tool | Claude Code (VS Code extension) |
| Model | Claude Sonnet 5.5 (`claude-sonnet-5-5`), as reported by the tool's own session information |
| Effort / thinking setting | [ADD YOUR RESULT HERE: the effort level you had selected, if any; it is not recorded in the session] |

The prompts below are reproduced verbatim, in the order they were sent, including original wording and typos. Nothing was added or removed.

---

## Prompt 1: Project structure

```text
I am doing a university SIS 2 assignment on Test Automation with Playwright.

Target website:
https://practicesoftwaretesting.com/

I need exactly 5 independent automated test cases:
1. Register a new customer
2. Login with valid and invalid credentials
3. Buy a product: add to cart, verify item and quantity, complete checkout
4. Compare two products by capturing their names and prices and asserting a meaningful comparison
5. Reset password: verify the expected UI result for a known email and an error for an invalid email

Use TypeScript and @playwright/test.

Required architecture:
- Page Object Model
- one spec file per test case
- pages/ folder
- fixtures/pages.fixture.ts
- data/user.factory.ts
- playwright.config.ts
- README.md

Important rules:
- no locators inside spec files
- no waitForTimeout
- no CSS class selectors
- no positional XPath
- tests must be independent
- tests must work in parallel and in any order
- use meaningful Playwright web-first assertions
- use data-test through testIdAttribute: 'data-test'
- generate a unique email for registration

First, do NOT write the full implementation.
Show me the proposed project structure and explain the responsibility of each file.
```

## Prompt 2: playwright.config.ts

```text
Now create playwright.config.ts for this project.

Requirements:
- baseURL: https://practicesoftwaretesting.com
- testIdAttribute: data-test
- trace: on-first-retry
- retries only in CI
- Chromium project
- tests should support parallel independent execution

Also explain each important configuration decision.
Do not use unnecessary settings.
```

## Prompt 3: Page Object Model classes

```text
Create the Page Object Model classes required for the five SIS 2 test cases.

Use TypeScript and Playwright.

Possible pages:
- BasePage
- LoginPage
- RegisterPage
- ProductPage
- CartPage
- CheckoutPage

Rules:
- locators must stay inside page objects
- spec files must never access locators directly
- expose business actions such as signIn(), registerUser(), addProductToCart(), checkout()
- do not create meaningless getters for every HTML element
- prefer getByTestId, getByRole, getByLabel and other resilient Playwright locators
- because the website uses data-test rather than data-testid, assume playwright.config.ts contains testIdAttribute: 'data-test'

Do not invent data-test values if they are unknown.
For any selector that must be verified on the live application, clearly mark it as TODO_VERIFY and explain how I can find it using Playwright codegen.
```

## Prompt 4: fixtures/pages.fixture.ts

```text
Create fixtures/pages.fixture.ts for the Page Object Model.

Extend Playwright's base test and expose all page objects needed by the test suite.

I want test files to be able to write code such as:

test('...', async ({ loginPage, productPage, cartPage, page }) => {
  ...
});

Do not instantiate page objects manually inside spec files.
Export expect from @playwright/test as well.
```

## Prompt 5: data/user.factory.ts

```text
Create data/user.factory.ts.

It must generate a fresh user for every registration test run.

Requirements:
- unique email every run
- readable first name and last name
- password that satisfies the application's likely password requirements
- no hard-coded reusable registration email
- TypeScript types/interfaces

Do not put test data generation logic inside the spec file.
```

## Prompt 6: tests/register.spec.ts

```text
Now write tests/register.spec.ts.

Requirement:
Register a new customer using a unique user from user.factory.ts.

The test must prove that:
- registration succeeds
- the user ends up signed in OR reaches the login page, depending on the actual application behavior

Rules:
- no locators in the spec
- use page objects and fixtures
- include at least one meaningful assertion that could fail
- no waitForTimeout
- test must be independent

If the exact post-registration behavior must be checked on the live website, clearly identify that assumption.
```

## Prompt 7: tests/login.spec.ts

```text
Write tests/login.spec.ts.

Cover both:
1. valid credentials
2. invalid credentials

For valid credentials, prove that the account page is reached.

For invalid credentials, prove that an error is shown and the account page is NOT reached.

Use the seeded account:
customer@practicesoftwaretesting.com
password: welcome01

Requirements:
- no locators in spec
- meaningful web-first assertions
- independent test behavior
- page objects via fixtures
```

## Prompt 8: tests/buy-product.spec.ts

```text
Write tests/buy-product.spec.ts.

Scenario:
- open the product catalogue
- select one specific product in a stable way
- capture or know its name
- add it to cart
- open cart
- assert the correct product is present
- assert the expected quantity
- proceed through checkout
- assert checkout completes successfully

Do not assert unstable global values such as "there are exactly 9 products".

Use Page Object Model, fixtures and Playwright web-first assertions.
No locators in the spec.
No waitForTimeout.
```

## Prompt 9: tests/compare-products.spec.ts

```text
Write tests/compare-products.spec.ts.

Important: the Toolshop does NOT have a built-in compare feature.

The test itself should:
- open product A
- capture its name and price
- open product B
- capture its name and price
- perform and assert a meaningful comparison

For example:
- assert that both products have different names
- assert both prices are positive
- assert which product is more expensive based on the captured numeric values

Keep interaction logic inside page objects.
The spec may contain the business comparison/assertion, but no locators.
```

## Prompt 10: tests/reset-password.spec.ts

```text
Write tests/reset-password.spec.ts.

Test both:
1. a known/valid email
2. an invalid email

The hosted application may not expose the actual reset email, so test only the observable UI outcome.

For the known email, assert the expected confirmation message/state.
For an invalid email, assert the appropriate error or rejection state.

Use page objects and fixtures.
No locators inside the spec.
No waitForTimeout.
Use web-first assertions.
```

## Prompt 11: Strict grader review

```text
Act as a strict university grader and review my complete Playwright project against these requirements:

- exactly five required test cases are covered
- every test has a meaningful assertion that can fail
- no locator appears in any spec file
- Page Object Model is used correctly
- at least one Playwright fixture is used
- registration generates unique data per run
- no waitForTimeout anywhere
- no CSS class selectors
- no positional XPath
- tests do not depend on execution order
- tests can run in parallel
- no test relies on unstable shared/global application state
- README explains how to install and run the project
- project should run after:
  npm install
  npx playwright test

For every problem you find:
1. show the file
2. explain the problem
3. explain why it violates the assignment
4. provide the corrected code

Do not silently rewrite everything. Clearly show what was wrong and what you changed.
```

## Prompt 12: Description.md

```text
Based on my Playwright SIS 2 project, write Description.md.

It should explain:
- the purpose of the project
- the website under test
- why Playwright and TypeScript are used
- the five test cases to be automated
- the intended Page Object Model + fixture architecture
- how test independence and unique data will be handled

Keep it concise and suitable for a university submission.
Do not claim that tests have passed unless I explicitly provide execution results.
```

## Prompt 13: Review.md

```text
Help me write Review.md for my SIS 2 submission.

This document must honestly explain:
- what code the AI initially generated
- what assumptions the AI made
- which selectors/data-test values I verified manually
- what errors or weak decisions I found
- what I changed myself
- why I made those changes
- how I verified meaningful assertions
- how I checked test independence and parallel execution
- whether any tests initially failed and why

Do not invent actions I did not perform.
Where information about my manual review is missing, insert [ADD YOUR RESULT HERE] placeholders.
```

## Prompt 14: Final grading review

```text
Review my final project one last time as if you are the instructor grading SIS 2.

Do not optimize or redesign it unless necessary.

Check only for grading risks:
- project installs on a clean machine
- correct Playwright commands
- five required cases
- assertions actually prove requirements
- no locators in specs
- fixtures are genuinely used
- unique registration data
- tests independent and parallel-safe
- no waitForTimeout
- no prohibited selectors
- README complete
- Description.md complete
- Prompt.md contains the actual prompts used
- Review.md explains AI output, manual review, modifications and justification

Return:
1. Critical issues that could cost marks
2. Minor issues
3. Final submission checklist
```

