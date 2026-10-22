import { UserFactory } from '../data/user.factory';
import { test } from '../fixtures/pages.fixture';

test('registers a new customer who can then sign in', async ({
  registerPage,
  loginPage,
  accountPage,
}) => {
  const user = UserFactory.create();

  await registerPage.goto();
  await registerPage.registerUser(user);

  // ASSUMPTION (verify on the live site): a successful registration redirects
  // to the login page instead of signing the user in automatically.
  await registerPage.expectRegistrationSucceeded();

  // Proof the account really exists: the new credentials must work.
  await loginPage.signIn(user.email, user.password);
  await accountPage.expectLoaded();
  await accountPage.expectSignedInAs(`${user.firstName} ${user.lastName}`);
});
