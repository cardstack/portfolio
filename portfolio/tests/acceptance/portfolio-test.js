
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

    let user = factory.addResource('portfolio-users', 'test-user').withAttributes({
      name: 'Hassan Abdel-Rahman',
      'email-address': 'hassan@example.com',
      'password-hash': "cb917855077883ac511f3d8c2610e72cccb12672cb56adc21cfde27865c0da57:675c2dc63b36aa0e3625e9490eb260ca" // hash for string "password"
    });

    factory.addResource('portfolios', 'test-portfolio').withAttributes({
      title: 'My Portfolio'
    })
      .withRelated('wallets', [
        factory.addResource('wallets', 'test-wallet').withAttributes({
          title: 'Test Wallet'
        })
          .withRelated('user', user)
      ])
      .withRelated('user', user);
  },
});

async function login() {
  await fillIn('[data-test-login-email]', 'hassan@example.com');
  await fillIn('[data-test-login-password]', 'password');
  await click('[data-test-login-button]');

  await waitFor('.portfolio-isolated');
}

module('Acceptance | portfolio', function(hooks) {
  setupApplicationTest(hooks);
  scenario.setupTest(hooks);

  hooks.beforeEach(function() {
    delete localStorage['cardstack-tools'];
  });

  hooks.afterEach(function() {
    delete localStorage['cardstack-tools'];
  });

  test('user sees their portfolio after they login from the index route', async function(assert) {
    await visit('/');
    assert.equal(currentURL(), '/');

    await login();

    assert.dom('[data-test-portfolio-isolated-title').hasText('My Portfolio');
  });

  test('user sees the login form when they log out from the portfolio page', async function(assert) {
    await visit('/');
    await login();
    await click('[data-test-signout-button]');

    assert.equal(currentURL(), '/');
    assert.dom('[data-test-login-form]').exists();
    assert.dom('[data-test-login-email]').exists();
    assert.dom('[data-test-login-password]').exists();
  });

  test('user sees isolated wallet card after clicking on the embedded wallet card', async function(assert) {
    await visit('/');
    await login();

    await click('[data-test-wallet-embedded-link]');

    assert.equal(currentURL(), '/wallets/test-wallet');
    assert.dom('[data-test-wallet-isolated]').exists();
    assert.dom('[data-test-wallet-isolated-title]').hasText('Test Wallet');
  });
});
