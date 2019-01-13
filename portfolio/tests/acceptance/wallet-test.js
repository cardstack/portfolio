
import { module, test, skip } from 'qunit';
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
        factory.addResource('wallets', 'ing-wallet').withAttributes({
          title: 'ING Wallet',
          logo: 'ing-logo'
        })
          .withRelated('user', user)
          .withRelated('assets', [
            bitcoinAsset,
            ethereumAsset,
          ]),
      ])
      .withRelated('user', user);
  },
});

async function login() {
  await fillIn('[data-test-login-email]', 'hassan@example.com');
  await fillIn('[data-test-login-password]', 'password');
  await click('[data-test-login-button]');

  await waitFor('.wallet-isolated');
}

module('Acceptance | wallet', function (hooks) {
  setupApplicationTest(hooks);
  scenario.setupTest(hooks);

  hooks.beforeEach(function () {
    delete localStorage['cardstack-tools'];
  });

  hooks.afterEach(function () {
    delete localStorage['cardstack-tools'];
  });

  test('user sees their wallet after they login from the wallet route', async function (assert) {
    await visit('/wallets/ing-wallet');
    assert.equal(currentURL(), '/wallets/ing-wallet');

    await login();

    assert.dom('[data-test-wallet-isolated-title]').hasText('ING Wallet');
  });

  test('user sees the login form when they log out from the portfolio page', async function (assert) {
    await visit('/wallets/ing-wallet');
    await login();
    await click('[data-test-signout-button]');

    assert.equal(currentURL(), '/');
    assert.dom('[data-test-login-form]').exists();
    assert.dom('[data-test-login-email]').exists();
    assert.dom('[data-test-login-password]').exists();
  });

  test('user sees isolated asset card after clicking on the embedded asset card', async function(assert) {
    await visit('/wallets/ing-wallet');
    await login();

    await click('.asset-embedded--ether');

    assert.equal(currentURL(), '/assets/0xC3D7FcFb69D168e9339ed18869B506c3B0F51fDE');
    assert.dom('.asset-isolated').exists();
    assert.dom('[data-test-asset-isolated-title]').hasTextContaining('Ether');
  });

  skip('TODO user can navigate to isolated portfolio card from their isolated wallet card', async function(/*assert*/){
  });
});