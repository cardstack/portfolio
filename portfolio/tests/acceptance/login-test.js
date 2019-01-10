import { module, test } from 'qunit';
import { visit, currentURL, click, fillIn, waitFor } from '@ember/test-helpers';
import { setupApplicationTest } from 'ember-qunit';
import Fixtures from '@cardstack/test-support/fixtures';

const scenario = new Fixtures({
  create(factory) {
    factory.addResource('data-sources', 'portfolio-user')
      .withAttributes({
        sourceType: 'portfolio-user',
      });

    factory.addResource('portfolios', 'test-portfolio').withAttributes({
      title: 'My Portfolio'
    }).withRelated('user', factory.addResource('portfolio-users', 'test-user').withAttributes({
      name: 'Hassan Abdel-Rahman',
      'email-address': 'hassan@example.com',
      'password-hash': "cb917855077883ac511f3d8c2610e72cccb12672cb56adc21cfde27865c0da57:675c2dc63b36aa0e3625e9490eb260ca" // hash for string "password"
    }));
  },
});

module('Acceptance | login', function(hooks) {
  setupApplicationTest(hooks);
  scenario.setupTest(hooks);

  hooks.beforeEach(function() {
    delete localStorage['cardstack-tools'];
  });

  hooks.afterEach(function() {
    delete localStorage['cardstack-tools'];
  });

  test('user can login with valid credentials', async function(assert) {
    await visit('/');
    assert.equal(currentURL(), '/');

    await fillIn('[data-test-login-email]', 'hassan@example.com');
    await fillIn('[data-test-login-password]', 'password');
    assert.dom('[data-test-login-button]').isNotDisabled();

    await click('[data-test-login-button]');

    await waitFor('[data-test-signout-button]');
  });

  test('user sees their portfolio after they login from the index route', async function(assert) {
    await visit('/');
    assert.equal(currentURL(), '/');

    await fillIn('[data-test-login-email]', 'hassan@example.com');
    await fillIn('[data-test-login-password]', 'password');
    await click('[data-test-login-button]');

    await waitFor('.portfolio-isolated');
    assert.dom('[data-test-portfolio-isolated-title').hasText('My Portfolio');
  });

  test('user sees error message when they login with invalid credentials', async function(assert) {
    await visit('/');
    assert.equal(currentURL(), '/');

    await fillIn('[data-test-login-email]', 'hassan@example.com');
    await fillIn('[data-test-login-password]', 'pas');
    await click('[data-test-login-button]');

    await waitFor('[data-test-login-error]');
  });

  test('login button is disabled when the email is missing', async function(assert) {
    await visit('/');
    assert.equal(currentURL(), '/');
    assert.dom('[data-test-login-button]').isDisabled();

    await fillIn('[data-test-login-password]', 'password');
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