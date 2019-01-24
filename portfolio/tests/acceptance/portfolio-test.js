
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

    let ethereumAsset = factory.addResource('assets', '0xC3D7FcFb69D168e9339ed18869B506c3B0F51fDE')
    .withRelated('network', factory.addResource('networks', 'ether')
      .withAttributes({
        title: 'Ether',
        unit: 'ETH',
        'asset-type': 'ethereum-addresses',
        'address-field': 'ethereum-address'
      }));
  let bitcoinAsset = factory.addResource('assets', '1F1tAaz5x1HUXrCNLbtMDqcw6o5GNn4xqX')
    .withRelated('network', factory.addResource('networks', 'bitcoin')
      .withAttributes({
        title: 'Bitcoin',
        unit: 'BTC',
      }));

    factory.addResource('portfolios', 'test-portfolio').withAttributes({
      title: 'My Portfolio'
    })
      .withRelated('wallets', [
        factory.addResource('wallets', 'test-wallet').withAttributes({
          title: 'Test Wallet'
        })
          .withRelated('user', user)
          .withRelated('assets', [
            bitcoinAsset,
            ethereumAsset,
          ])
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

  test('user sees the currency view of their portfolio', async function(assert) {
    await visit('/');
    await login();

    assert.dom('[data-test-portfolio-isolated-wallet="0"] [data-test-wallet-embedded-title]').hasText('Test Wallet');

    await click('.portfolio-isolated-filters__currencies');

    assert.equal(currentURL(), '/', 'url doesnt change');
    assert.dom('[data-test-portfolio-isolated-wallet="0"]').doesNotExist();
    assert.dom('.portfolio-isolated-section__currency').exists({ count: 2 });
    assert.dom('[data-test-portfolio-isolated-currency="0"]').hasTextContaining('Bitcoin');
    assert.dom('[data-test-portfolio-isolated-currency="0"] .currency-totals').hasText('1 Asset');
    assert.dom('[data-test-portfolio-isolated-currency="1"]').hasTextContaining('Ether');
    assert.dom('[data-test-portfolio-isolated-currency="1"] .currency-totals').hasText('1 Asset');

    await click('.portfolio-isolated-filters__wallets');

    assert.dom('[data-test-portfolio-isolated-wallet="0"] [data-test-wallet-embedded-title]').hasText('Test Wallet');
  });
});
