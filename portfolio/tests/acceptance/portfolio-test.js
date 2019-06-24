import { module, test } from 'qunit';
import { visit, currentURL, click, waitFor } from '@ember/test-helpers';
import { clickTrigger } from 'ember-power-select/test-support/helpers'
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
      title: 'My Cardfolio'
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

module('Acceptance | portfolio', function(hooks) {
  setupApplicationTest(hooks);
  scenario.setupTest(hooks);

  hooks.beforeEach(function() {
    delete localStorage['cardstack-tools'];
  });

  hooks.afterEach(function() {
    delete localStorage['cardstack-tools'];
  });

  test('user sees their portfolio', async function(assert) {
    await visit('/');
    assert.equal(currentURL(), '/');

    assert.dom('[data-test-portfolio-top-header]').exists();
    assert.dom('[data-test-portfolio-breadcrumbs]').doesNotExist();
    assert.dom('[data-test-portfolio-isolated-side-nav]').exists();
    assert.dom('[data-test-portfolio-isolated-side-nav] li:nth-of-type(1)').hasText('Show All');
    assert.dom('[data-test-portfolio-isolated-side-nav] li:nth-of-type(1) a').hasClass('active');
    assert.dom('[data-test-portfolio-isolated-intro]').exists();
    assert.dom('[data-test-portfolio-isolated-header] h1').hasText('overview');
    assert.dom('[data-test-portfolio-isolated-register-button]').doesNotExist();
    assert.dom('[data-test-portfolio-section="memberships"] h2').hasText('Most Active memberships');
    assert.dom('[data-test-portfolio-section="assets"] h2').hasText('Most Active assets');
    assert.dom('[data-test-portfolio-section="assets"] h3').hasText('Ethereum Mainnet');
    assert.dom('[data-test-grid-display-item]').exists({ count: 2 });
    assert.dom('[data-test-grid-display-item="0"]').containsText('Ether');
  });

  test('user can dismiss the welcome message box', async function(assert) {
    await visit('/');
    assert.equal(currentURL(), '/');

    await waitFor('[data-test-portfolio-isolated-intro]');

    assert.dom('[data-test-portfolio-isolated-intro]').exists();
    assert.dom('[data-test-portfolio-isolated-intro] h2').hasText('Welcome to your Personalized Wallet');

    await click('[data-test-portfolio-isolated-intro] button');
    assert.dom('[data-test-portfolio-isolated-intro]').doesNotExist();
  });

  test('user can filter sections using sidebar navigation', async function(assert) {
    await visit('/');
    assert.equal(currentURL(), '/');

    await waitFor('[data-test-portfolio-isolated-side-nav]');
    assert.dom('[data-test-portfolio-isolated-side-nav-item="show-all"]').hasClass('active');
    assert.dom('[data-test-portfolio-isolated-side-nav-item="assets"]').doesNotHaveClass('active');
    assert.dom('[data-test-portfolio-isolated-header] h1').hasText('overview');
    assert.dom('[data-test-portfolio-section]').exists({ count: 2 });

    await click('[data-test-portfolio-isolated-side-nav-item="memberships"]');
    assert.dom('[data-test-portfolio-isolated-header] h1').hasText('memberships');
    assert.dom('[data-test-portfolio-section]').doesNotExist();
    assert.dom('[data-test-portfolio-isolated-side-nav-item="show-all"]').doesNotHaveClass('active');
    assert.dom('[data-test-portfolio-isolated-side-nav-item="memberships"]').hasClass('active');

    await click('[data-test-portfolio-isolated-side-nav-item="assets"]');
    assert.dom('[data-test-portfolio-isolated-side-nav-item="assets"]').hasClass('active');
    assert.dom('[data-test-portfolio-isolated-header] h1').hasText('assets');
    assert.dom('[data-test-portfolio-section]').doesNotExist();

    await click('[data-test-portfolio-isolated-side-nav-item="show-all"]');
    assert.dom('[data-test-portfolio-isolated-header] h1').hasText('overview');
    assert.dom('[data-test-portfolio-section]').exists({ count: 2 });
  });

  test('asset-only view renders', async function(assert) {
    await visit('/');
    assert.equal(currentURL(), '/');

    await waitFor('[data-test-portfolio-isolated-side-nav]');
    await click('[data-test-portfolio-isolated-side-nav-item="assets"]');

    assert.dom('[data-test-portfolio-isolated-header] h1').hasText('assets');
    assert.dom('[data-test-portfolio-isolated-filter-bar]').exists();
    assert.dom('[data-test-portfolio-isolated-total-assets]').hasText('Showing 2 Assets');
    assert.dom('[data-test-portfolio-isolated-network-section]').exists({ count: 1 });
    assert.dom('[data-test-portfolio-isolated-network-title]').hasText('Ethereum Mainnet');
    assert.dom('[data-test-portfolio-isolated-network-asset-count]').hasText('2 Assets');
  });

  test('user can toggle between grid view and list view', async function(assert) {
    await visit('/');
    assert.equal(currentURL(), '/');

    await click('[data-test-portfolio-isolated-side-nav-item="assets"]');
    await waitFor('[data-test-portfolio-isolated-network-section]');

    assert.dom('[data-test-network-section-grid]').doesNotHaveClass('network-section--list');
    assert.dom('[data-test-grid-view-button]').hasClass('active');
    assert.dom('[data-test-list-view-button]').doesNotHaveClass('active');

    await click('[data-test-list-view-button]');

    assert.dom('[data-test-network-section-grid]').hasClass('grid-display--list-view');
    assert.dom('[data-test-network-section-grid]').hasClass('network-section--list');
    assert.dom('[data-test-list-view-button]').hasClass('active');
    assert.dom('[data-test-grid-view-button]').doesNotHaveClass('active');

    await click('[data-test-grid-view-button]');

    assert.dom('[data-test-network-section-grid]').doesNotHaveClass('network-section--list');
  });

  test('user can sort assets by balance in descending and ascending order', async function(assert) {
    await visit('/');
    assert.equal(currentURL(), '/');

    await click('[data-test-portfolio-isolated-side-nav-item="assets"]');
    await waitFor('[data-test-portfolio-isolated-filter-bar]');

    assert.dom('.ember-power-select-selected-item').hasText('Balance (Descending)');
    assert.dom('[data-test-grid-display-item="0"]').containsText('Ether');

    await clickTrigger('.cs-component-dropdown');
    await click('[data-option-index="1"]');
    assert.dom('.ember-power-select-selected-item').hasText('Balance (Ascending)');
    assert.dom('[data-test-grid-display-item="0"]').containsText('Bitcoin');

    await clickTrigger('.cs-component-dropdown');
    await click('[data-option-index="0"]');
    assert.dom('.ember-power-select-selected-item').hasText('Balance (Descending)');
    assert.dom('[data-test-grid-display-item="0"]').containsText('Ether');
  });
});
