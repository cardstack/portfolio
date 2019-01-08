import { module, test } from 'qunit';
import { visit, currentURL, click, fillIn, waitFor, getContext } from '@ember/test-helpers';
import { setupApplicationTest } from 'ember-qunit';
import Fixtures from '@cardstack/test-support/fixtures';
import { run } from '@ember/runloop';

const scenario = new Fixtures({
  create(factory) {
    // Note that the test user is actually created in the static model
    // since we can only hash the password for the user in node

    factory.addResource('data-sources', 'portfolio-user')
      .withAttributes({
        sourceType: 'portfolio-user',
      });
  },
});

module('Acceptance | login', function(hooks) {
  setupApplicationTest(hooks);
  scenario.setupTest(hooks);

  hooks.beforeEach(function() {
    let mockLogin =  getContext().owner.lookup('service:mock-login');
    // use password auth for these tests
    run(() => mockLogin.set('disabled', true));
  });

  test('user can login with valid credentials', async function(assert) {
    await visit('/');
    assert.equal(currentURL(), '/');

    await fillIn('[data-test-login-email]', 'hassan@example.com');
    await fillIn('[data-test-login-password]', 'password')
    assert.dom('[data-test-login-button]').isNotDisabled();

    await click('[data-test-login-button]');

    await waitFor('[data-test-signout-button]');
  });

  test('user sees error message when they login with invalid credentials', async function(assert) {
    await visit('/');
    assert.equal(currentURL(), '/');

    await fillIn('[data-test-login-email]', 'hassan@example.com');
    await fillIn('[data-test-login-password]', 'pas')
    await click('[data-test-login-button]');

    await waitFor('[data-test-login-error]');
  });

  test('login button is disabled when the email is missing', async function(assert) {
    await visit('/');
    assert.equal(currentURL(), '/');
    assert.dom('[data-test-login-button]').isDisabled();

    await fillIn('[data-test-login-password]', 'password')
    assert.dom('[data-test-login-button]').isDisabled();
  });

  test('login button is disabled when the password is missing', async function(assert) {
    await visit('/');
    assert.equal(currentURL(), '/');
    assert.dom('[data-test-login-button]').isDisabled();

    await fillIn('[data-test-login-email]', 'hassan@example.com');
    assert.dom('[data-test-login-button]').isDisabled();
  });
});