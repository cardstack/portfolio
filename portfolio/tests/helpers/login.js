import { click, fillIn, waitFor, visit } from '@ember/test-helpers';

async function login(email, password) {
  await visit('/');

  await fillIn('[data-test-login-email]', email)
  await fillIn('[data-test-login-password]', password);
  await click('[data-test-login-button]');

  await visit('/profile');
  await waitFor('[data-test-signout-button]');
}

export { login }

