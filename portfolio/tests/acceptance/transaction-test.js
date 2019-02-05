import { module, test } from 'qunit';
import { visit, currentURL } from '@ember/test-helpers';
import { setupApplicationTest } from 'ember-qunit';
import Fixtures from '@cardstack/test-support/fixtures';

const transactionHash = '0x0c0b1a4b0ff5fbf2124f122b70b5c752e1289e60f376e13ab51865dee747f572';
const scenario = new Fixtures({
  create(factory) {
    factory.addResource('ethereum-transactions', transactionHash)
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
      });
  },
});
module('Acceptance | transaction', function (hooks) {
  setupApplicationTest(hooks);
  scenario.setupTest(hooks);

  hooks.beforeEach(function () {
    delete localStorage['cardstack-tools'];
  });

  hooks.afterEach(function () {
    delete localStorage['cardstack-tools'];
  });

  test('user sees isolated transaction card when directly navigating to the URL without logging in', async function(assert) {
    await visit(`/ethereum-transactions/${transactionHash}`);

    assert.equal(currentURL(), `/ethereum-transactions/${transactionHash}`);
    assert.dom('[data-test-transaction-isolated]').exists();
    assert.dom('[data-test-transaction-isolated-title]').hasText('TX# 0x0c0b...f572');
    assert.dom('[data-test-transaction-isolated-hash]').hasText('0x0c0b1a4b0ff5fbf2124f122b70b5c752e1289e60f376e13ab51865dee747f572');
    assert.dom('[data-test-portfolio-top-header]').exists();
    assert.dom('[data-test-portfolio-breadcrumbs]').doesNotExist();
  });

  // TODO: add tests when breadcrumbs is not hardcoded on transaction page
});
