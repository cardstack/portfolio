import { module, test } from 'qunit';
import hbs from 'htmlbars-inline-precompile';
import { render } from '@ember/test-helpers';
import Fixtures from '@cardstack/test-support/fixtures';
import { setupURLs, setupCardTest } from '@cardstack/test-support/test-helpers';

const scenario = new Fixtures({
  create(factory) {
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
    factory.addResource('grants')
      .withRelated('who', [{ type: 'groups', id: 'everyone' }])
      .withRelated('types', [
        { type: 'content-types', id: 'ethereum-addresses' },
        { type: 'content-types', id: 'ethereum-transactions' }
      ])
      .withAttributes({
        'may-read-resource': true,
        'may-read-fields': true,
      });
  }
});

module('Card | transaction', function(hooks) {
  setupCardTest(hooks);
  setupURLs(hooks);
  scenario.setupTest(hooks);

  test('embedded format renders', async function(assert) {
    await render(hbs`{{cardstack-card-test "ethereum-transaction" "0x0c0b1a4b0ff5fbf2124f122b70b5c752e1289e60f376e13ab51865dee747f572" format="embedded"}}`);
    assert.dom('[data-test-transaction-embedded-link]').hasAttribute('href', '/ethereum-transactions/0x0c0b1a4b0ff5fbf2124f122b70b5c752e1289e60f376e13ab51865dee747f572')
    assert.dom('[data-test-transaction-embedded-date]').hasAnyText(); // avoiding testing timezone sensitive dates in CI
    // TODO add transaction value test after next UI design update
  });

  test('isolated format renders', async function(assert) {
    await render(hbs`{{cardstack-card-test "ethereum-transaction" "0x0c0b1a4b0ff5fbf2124f122b70b5c752e1289e60f376e13ab51865dee747f572" format="isolated"}}`);
    assert.dom('[data-test-transaction-isolated-date]').hasAnyText();
    // TODO add transaction value test after next UI design update
    assert.dom('[data-test-transaction-isolated-from]').hasText('From 0x0f4f2ac550a1b4e2280d04c21cea7ebd822934b5');
    assert.dom('[data-test-transaction-isolated-to]').hasText('To 0xc3d7fcfb69d168e9339ed18869b506c3b0f51fde');
    assert.dom('[data-test-transaction-isolated-status]').hasText('Status: Successful');
  });
});
