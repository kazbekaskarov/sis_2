import { UserFactory } from '../data/user.factory';
import { test } from '../fixtures/pages.fixture';

// The site locks an account after repeated failed logins, so this test uses its own
// freshly registered customer and never fails a login against a shared account.
test('login accepts valid credentials and rejects invalid ones', async ({
  registerPage,
  loginPage,
  accountPage,
}) => {
  const user = UserFactory.create();
  await registerPage.goto();
  await registerPage.registerUser(user);
  await registerPage.expectRegistrationSucceeded();

  await test.step('wrong password shows an error and does not reach the account page', async () => {
    await loginPage.signIn(user.email, `${user.password}-wrong`);

    await loginPage.expectLoginRejected();
    await accountPage.expectNotReached();
  });

  await test.step('valid credentials reach the account page', async () => {
    await loginPage.goto();
    await loginPage.signIn(user.email, user.password);

    await accountPage.expectLoaded();
    await accountPage.expectSignedInAs(`${user.firstName} ${user.lastName}`);
  });
});
