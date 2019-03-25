import { module, test, skip } from 'qunit';
import { visit, click } from '@ember/test-helpers';
import { setupApplicationTest } from 'ember-qunit';
import Fixtures from '@cardstack/test-support/fixtures';

// use the main:router location API to get the current URL since we are
// manipulating the URL using the location API
function currentURL(owner) {
  let router = owner.lookup('router:main');
  return router.get('location').getURL();
}

const address = '0xC3D7FcFb69D168e9339ed18869B506c3B0F51fDE';
const scenario = new Fixtures({
  create(factory) {
    factory.addResource('assets', address)
      .withRelated('network', factory.addResource('networks', 'ether')
      .withAttributes({
        title: 'Ether',
        unit: 'ETH',
        'asset-type': 'ethereum-addresses',
        'address-field': 'ethereum-address'
      }));

    factory.addResource('ethereum-addresses', address.toLowerCase())
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
            "transaction-to": address.toLowerCase(),
            "gas-price": "5000000000",
            "transaction-hash": "0x0c0b1a4b0ff5fbf2124f122b70b5c752e1289e60f376e13ab51865dee747f572",
            "gas": 90000,
            "transaction-value": "10010000000000000000"
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
            "transaction-from": address.toLowerCase(),
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
module('Acceptance | asset', function (hooks) {
  setupApplicationTest(hooks);
  scenario.setupTest(hooks);

  hooks.beforeEach(function () {
    delete localStorage['cardstack-tools'];
  });

  hooks.afterEach(function () {
    delete localStorage['cardstack-tools'];
  });

  function testAssetPage(assert) {
    assert.dom('[data-test-asset-isolated]').exists();
    assert.dom('[data-test-asset-isolated-title]').hasTextContaining('Ether');
    assert.dom('[data-test-asset-isolated-address]').hasText(`Address ${address}`);
    assert.dom('[data-test-portfolio-top-header]').exists();
    assert.dom('[data-test-portfolio-breadcrumbs]').doesNotExist();
  }

  test('user sees isolated asset card when directly navigating to the URL without logging in', async function(assert) {
    await visit(`/assets/${address}`);
    assert.equal(currentURL(this.owner), `/assets/${address}`);
    testAssetPage(assert);
  });

  test('user sees isolated asset card when using differently cased address', async function(assert) {
    await visit(`/assets/${address.toLowerCase()}`);
    testAssetPage(assert);
  });

  // This appears to be a flaky test... Need some other means of asserting that highcharts is being rendered
  skip('user sees asset history chart', async function(assert) {
    await visit(`/assets/${address}`);

    assert.dom('.highcharts-root').exists();
    let yAxisLabel = document.querySelector('.highcharts-yaxis-labels');
    let valueLabel = yAxisLabel.querySelectorAll('text')[1];
    assert.dom(valueLabel).hasText('$1.0k');
  });

  test('user can navigate to isolated transaction card', async function(assert) {
    await visit(`/assets/${address}`);

    await click('[data-test-asset-isolated-transaction="1"] [data-test-transaction-embedded-link]');

    assert.equal(currentURL(this.owner), `/ethereum-transactions/0x0c0b1a4b0ff5fbf2124f122b70b5c752e1289e60f376e13ab51865dee747f572`);
    assert.dom('[data-test-transaction-isolated]').exists();
  });

  test('users currency change is reflected in the URL', async function(assert) {
    await visit(`/assets/${address}`);

    assert.dom('[data-test-asset-isolated-currency-name').hasText('USD');

    await click('[data-test-asset-isolated-eur-button]');

    assert.dom('[data-test-asset-isolated-currency-name').hasText('EUR');
    assert.equal(currentURL(this.owner), `/assets/${address}?assets[currency]=EUR`);

    await click('[data-test-asset-isolated-btc-button]');

    assert.dom('[data-test-asset-isolated-currency-name').hasText('BTC');
    assert.equal(currentURL(this.owner), `/assets/${address}?assets[currency]=BTC`);
  });

  test('the EUR currency that is specified in the URL query params is honored', async function(assert) {
    await visit(`/assets/${address}?assets[currency]=EUR`);

    assert.equal(currentURL(this.owner), `/assets/${address}?assets[currency]=EUR`);
    assert.dom('[data-test-asset-isolated-currency-name').hasText('EUR');
  });

  test('the BTC currency that is specified in the URL query params is honored', async function(assert) {
    await visit(`/assets/${address}?assets[currency]=BTC`);

    assert.equal(currentURL(this.owner), `/assets/${address}?assets[currency]=BTC`);
    assert.dom('[data-test-asset-isolated-currency-name').hasText('BTC');
  });

});
