import { module, /*test,*/ skip } from 'qunit';
import { visit, currentURL, click, fillIn, waitFor } from '@ember/test-helpers';
import { setupApplicationTest } from 'ember-qunit';
import Fixtures from '@cardstack/test-support/fixtures';
import { setupAnimationTest, animationsSettled } from 'ember-animated/test-support';

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
      title: 'My Cardfolio'
    })
      .withRelated('wallets', [
        factory.addResource('wallets', 'demo-wallet').withAttributes({
          title: 'Demo Wallet'
        })
          .withRelated('user', user)
          .withRelated('assets', [
            bitcoinAsset,
            ethereumAsset,
          ]),
      ])
      .withRelated('user', user);

    factory.addResource('ethereum-addresses', '0xc3d7fcfb69d168e9339ed18869b506c3b0f51fde')
      .withAttributes({
        "balance": "200895000000000000",
        "ethereum-address": "0xC3D7FcFb69D168e9339ed18869B506c3B0F51fDE"
      })
      .withRelated('transactions', [
        factory.addResource('ethereum-transactions', '0x0c0b1a4b0ff5fbf2124f122b70b5c752e1289e60f376e13ab51865dee747f572')
          .withAttributes({
            "transaction-successful": true,
            "transaction-index": 0,
            "cumulative-gas-used": 21000,
            "transaction-data": "0x0",
            "timestamp": 1547478615,
            "transaction-nonce": 0,
            "block-number": 6,
            "gas-used": 21000,
            "transaction-from": "0x0f4f2ac550a1b4e2280d04c21cea7ebd822934b5",
            "block-hash": "0x62c48a107a96894248726dba13d114a1760fa9eef5370e98a0651ccb0ba0c41f",
            "transaction-to": "0xc3d7fcfb69d168e9339ed18869b506c3b0f51fde",
            "gas-price": "5000000000",
            "transaction-hash": "0x0c0b1a4b0ff5fbf2124f122b70b5c752e1289e60f376e13ab51865dee747f572",
            "gas": 90000,
            "transaction-value": "101000000000000000"
          }),
        factory.addResource('ethereum-transactions', '0x3252a963fe90697240890b84d2a3fac45b756338027467e2788ad0bb82b1fdc2')
          .withAttributes({
            "transaction-successful": true,
            "transaction-index": 0,
            "cumulative-gas-used": 21000,
            "transaction-data": "0x0",
            "timestamp": 1547478616,
            "transaction-nonce": 0,
            "block-number": 8,
            "gas-used": 21000,
            "transaction-from": "0xc3d7fcfb69d168e9339ed18869b506c3b0f51fde",
            "block-hash": "0x4abacac4089661d1ba407ff4286f768bdaa58a95a7db5770b15a6f6bb1843af6",
            "transaction-to": "0xaefa57a8b9ddb56229ae57d61559fc2a4c5af0cd",
            "gas-price": "5000000000",
            "transaction-hash": "0x3252a963fe90697240890b84d2a3fac45b756338027467e2788ad0bb82b1fdc2",
            "gas": 90000,
            "transaction-value": "100000000000000000"
          }),
      ]);
  },
});

async function login() {
  await fillIn('[data-test-login-email]', 'hassan@example.com');
  await fillIn('[data-test-login-password]', 'password');
  await click('[data-test-login-button]');

  await waitFor('[data-test-wallet-isolated]');
}

// these are flaky need to revist them
module('Acceptance | wallet', function (hooks) {
  setupApplicationTest(hooks);
  setupAnimationTest(hooks);
  scenario.setupTest(hooks);

  hooks.beforeEach(function () {
    delete localStorage['cardstack-tools'];
  });

  hooks.afterEach(function () {
    delete localStorage['cardstack-tools'];
  });

  skip('user sees their wallet after they login from the wallet route', async function (assert) {
    await visit('/wallets/demo-wallet');
    assert.equal(currentURL(), '/wallets/demo-wallet');

    assert.dom('[data-test-wallet-isolated-title]').hasText('Demo Wallet');
    assert.dom('[data-test-portfolio-top-header]').exists();
    assert.dom('[data-test-portfolio-breadcrumbs-portfolio-link]').hasText('My Cardfolio');
    assert.dom('[data-test-portfolio-breadcrumbs-wallet-link]').doesNotExist();
    assert.dom('[data-test-wallet-isolated-count]').hasText('2 Assets');
    assert.dom('[data-test-wallet-isolated-value]').hasText('≈ $20.09');
    assert.dom('[data-test-wallet-isolated-section-active-count]').hasText('2');
    assert.dom('[data-test-wallet-isolated-asset="0"] [data-test-asset-embedded-title]').hasText('Bitcoin');
    assert.dom('[data-test-wallet-isolated-asset="1"] [data-test-asset-embedded-title]').hasText('Ether');
  });

  skip('user sees the login form when they log out from the portfolio page', async function (assert) {
    await visit('/wallets/demo-wallet');
    await login();
    await visit('/profile');
    await click('[data-test-signout-button]');

    assert.equal(currentURL(), '/');
    assert.dom('[data-test-login-form]').exists();
    assert.dom('[data-test-login-email]').exists();
    assert.dom('[data-test-login-password]').exists();
    assert.dom('[data-test-portfolio-top-header]').doesNotExist();
    assert.dom('[data-test-portfolio-breadcrumbs]').doesNotExist();
  });

  skip('user sees isolated asset card after clicking on the embedded asset card', async function (assert) {
    await visit('/wallets/demo-wallet');
    await login();

    await click('[data-test-wallet-isolated-asset="1"] [data-test-asset-embedded-link]');
    await animationsSettled();

    assert.equal(currentURL(), '/assets/0xC3D7FcFb69D168e9339ed18869B506c3B0F51fDE');
    assert.dom('[data-test-asset-isolated]').exists();
    assert.dom('[data-test-asset-isolated-title]').hasTextContaining('Ether');
    assert.dom('[data-test-portfolio-top-header]').exists();
    assert.dom('[data-test-portfolio-breadcrumbs-portfolio-link]').hasText('My Cardfolio');
    assert.dom('[data-test-portfolio-breadcrumbs-wallet-link]').hasText('Demo Wallet');
  });

  skip('user can navigate to isolated portfolio card after clicking on page header link', async function (assert) {
    await visit('/wallets/demo-wallet');
    await login();

    await click('[data-test-portfolio-top-header-title]');
    await animationsSettled();

    assert.equal(currentURL(), '/');
  });

  skip('user can navigate to isolated portfolio card after clicking on breadcrumb link', async function (assert) {
    await visit('/wallets/demo-wallet');
    await login();

    await click('[data-test-portfolio-breadcrumbs-portfolio-link]');
    await animationsSettled();

    assert.equal(currentURL(), '/');
  });
});
