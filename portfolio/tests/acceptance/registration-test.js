import { module, test, skip } from 'qunit';
import { visit, currentURL, click, fillIn, waitFor } from '@ember/test-helpers';
import { setupApplicationTest } from 'ember-qunit';
import Fixtures from '@cardstack/test-support/fixtures';
import { ciSessionId } from '@cardstack/test-support/environment';
import { hubURL } from '@cardstack/plugin-utils/environment';

const scenario = new Fixtures({
  create(factory) {
    factory.addResource('registers', 'portfolio-users');
  },
  destroy() {
    return [{ type: 'portfolio-users' }];
  }
});

async function searchForUser(email) {
  let url = `${hubURL}/api/portfolio-users?filter[email-address][exact]=${email}`;
  let response = await fetch(url, {
    headers: {
      authorization: `Bearer ${ciSessionId}`,
      "content-type": 'application/vnd.api+json'
    }
  });
  return (await response.json()).data;
}

module('Acceptance | register', function(hooks) {
  setupApplicationTest(hooks);
  scenario.setupTest(hooks);

  hooks.beforeEach(function() {
    delete localStorage['cardstack-tools'];
  });

  hooks.afterEach(function() {
    delete localStorage['cardstack-tools'];
  });

  test('register user', async function(assert) {
    await visit('/');
    assert.equal(currentURL(), '/');

    await click('[data-test-registration-page-link]');
    assert.equal(currentURL(), '/register');

    await fillIn('[data-test-registration-name]', 'Van Gogh');
    await fillIn('[data-test-registration-email]', 'vangogh@example.com');
    await fillIn('[data-test-registration-password]', 'password');
    await click('[data-test-registration-submit]');

    await waitFor('[data-test-registration-success]');

    let users = await searchForUser('vangogh@example.com');
    assert.equal(users.length, 1);
    assert.equal(users[0].attributes['email-address'], 'vangogh@example.com');

    await click('[data-test-registration-success-dismiss]');
    assert.equal(currentURL(), '/');
  });

  skip('TODO user is logged in after registration and transitioned to their portfolio card', async function(/*assert*/) {
  });

  test('cancel registration', async function(assert) {
    await visit('/');
    assert.equal(currentURL(), '/');

    await click('[data-test-registration-page-link]');
    assert.equal(currentURL(), '/register');

    await click('[data-test-registration-cancel]');
    assert.equal(currentURL(), '/');
  });
});