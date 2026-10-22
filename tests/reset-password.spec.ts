import { test } from '../fixtures/pages.fixture';

// Known account: the seeded demo customer.
const KNOWN_EMAIL = 'customer@practicesoftwaretesting.com';
// Malformed address, so the rejection does not depend on which accounts exist.
const INVALID_EMAIL = 'not-an-email';

test('reset password confirms a known email and rejects an invalid one', async ({
  forgotPasswordPage,
}) => {
  await test.step('known email shows the reset confirmation', async () => {
    await forgotPasswordPage.goto();
    await forgotPasswordPage.requestReset(KNOWN_EMAIL);

    await forgotPasswordPage.expectResetRequested();
  });

  await test.step('invalid email is rejected with an error', async () => {
    await forgotPasswordPage.goto();
    await forgotPasswordPage.requestReset(INVALID_EMAIL);

    await forgotPasswordPage.expectEmailRejected();
  });
});
