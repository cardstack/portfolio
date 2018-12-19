import { findAll, click, waitUntil, visit } from '@ember/test-helpers';
import { getContext } from '@ember/test-helpers';
import { run } from '@ember/runloop';

const timeout = 5000;

function setMockUser(userId) {
  let { owner } = getContext();
  let mockLogin = owner.lookup('service:mock-login');
  run(() => mockLogin.set('mockUserId', userId));
}

async function login(userId) {
  setMockUser(userId);
  await visit('/');

  await click('[data-test-contains="Sign in"]');

  await waitUntil(() => findAll('[data-test-contains="Sign out"]').length), { timeout };
}

export {
  setMockUser,
  login
}

