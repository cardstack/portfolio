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
            "transaction-index": 42,
            "cumulative-gas-used": 21000,
            "transaction-data": "0x0",
            "timestamp": 1547478615,
            "transaction-nonce": 3,
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
            "transaction-successful": false,
            "transaction-index": 37,
            "cumulative-gas-used": 21000,
            "transaction-data": "0x0",
            "timestamp": 1547478616,
            "transaction-nonce": 5,
            "gas-used": 21000,
            "transaction-from": "0xc3d7fcfb69d168e9339ed18869b506c3b0f51fde",
            "block-hash": "0x4abacac4089661d1ba407ff4286f768bdaa58a95a7db5770b15a6f6bb1843af6",
            "transaction-to": "0xaefa57a8b9ddb56229ae57d61559fc2a4c5af0cd",
            "gas-price": "5000000000",
            "transaction-hash": "0x3252a963fe90697240890b84d2a3fac45b756338027467e2788ad0bb82b1fdc2",
            "gas": 90000,
            "transaction-value": "1234000000000000000"
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

  test('embedded format renders successful transaction', async function(assert) {
    await render(hbs`{{cardstack-card-test "ethereum-transaction" "0x0c0b1a4b0ff5fbf2124f122b70b5c752e1289e60f376e13ab51865dee747f572" format="embedded"}}`);
    assert.dom('[data-test-transaction-embedded-link]').hasAttribute('href', '/ethereum-transactions/0x0c0b1a4b0ff5fbf2124f122b70b5c752e1289e60f376e13ab51865dee747f572')
    assert.dom('[data-test-transaction-embedded-title]').hasText('TX# 0x0c0b...f572');
    assert.dom('[data-test-transaction-embedded-date]').hasAnyText(); // avoiding testing timezone sensitive dates in CI
    assert.dom('[data-test-transaction-embedded-value]').hasText('0.1010 ETH');
    assert.dom('[data-test-transaction-embedded-from]').hasText('From 0x0f4f...34b5');
    assert.dom('[data-test-transaction-embedded-to]').hasText('To 0xc3d7...1fde');
    assert.dom('[data-test-transaction-embedded-status]').hasText('Status: Successful');
    assert.dom('[data-test-transaction-embedded-fiat]').hasText('≈ $10.10 USD');
  });

  test('embedded format renders failed transaction', async function(assert) {
    await render(hbs`{{cardstack-card-test "ethereum-transaction" "0x3252a963fe90697240890b84d2a3fac45b756338027467e2788ad0bb82b1fdc2" format="embedded"}}`);
    assert.dom('[data-test-transaction-embedded-link]').hasAttribute('href', '/ethereum-transactions/0x3252a963fe90697240890b84d2a3fac45b756338027467e2788ad0bb82b1fdc2')
    assert.dom('[data-test-transaction-embedded-title]').hasText('TX# 0x3252...fdc2');
    assert.dom('[data-test-transaction-embedded-date]').hasAnyText(); // avoiding testing timezone sensitive dates in CI
    assert.dom('[data-test-transaction-embedded-value]').hasText('1.2340 ETH');
    assert.dom('[data-test-transaction-embedded-from]').hasText('From 0xc3d7...1fde');
    assert.dom('[data-test-transaction-embedded-to]').hasText('To 0xaefa...f0cd');
    assert.dom('[data-test-transaction-embedded-status]').hasText('Status: Failed');
  });

  test('isolated format renders', async function(assert) {
    await render(hbs`{{cardstack-card-test "ethereum-transaction" "0x0c0b1a4b0ff5fbf2124f122b70b5c752e1289e60f376e13ab51865dee747f572" format="isolated"}}`);
    assert.dom('[data-test-portfolio-top-header]').exists();
    assert.dom('[data-test-transaction-isolated-title]').hasText('TX# 0x0c0b...f572');
    assert.dom('[data-test-transaction-isolated-hash]').hasText('0x0c0b1a4b0ff5fbf2124f122b70b5c752e1289e60f376e13ab51865dee747f572');
    assert.dom('[data-test-transaction-isolated-date]').hasAnyText(); // avoiding testing timezone sensitive dates in CI
    assert.dom('[data-test-transaction-isolated-value]').hasText('0.1010 ETH');
    assert.dom('[data-test-transaction-isolated-from]').hasText('From 0x0f4f2ac550a1b4e2280d04c21cea7ebd822934b5');
    assert.dom('[data-test-transaction-isolated-to]').hasText('To 0xc3d7fcfb69d168e9339ed18869b506c3b0f51fde');
    assert.dom('[data-test-transaction-isolated-status]').hasText('Status: Successful');
    assert.dom('[data-test-transaction-isolated-time]').hasAnyText();
    assert.dom('[data-test-transaction-isolated-block-height]').hasText('6');
    assert.dom('[data-test-transaction-isolated-gas-limit]').hasText('90000');
    assert.dom('[data-test-transaction-isolated-gas-used]').hasText('21000');
    assert.dom('[data-test-transaction-isolated-gas-price]').hasText('5 Gwei');
    assert.dom('[data-test-transaction-isolated-cost]').hasText('0.000105 Ethers');
    assert.dom('[data-test-transaction-isolated-nonce]').hasText('3');
    assert.dom('[data-test-transaction-isolated-position]').hasText('42');
    assert.dom('[data-test-transaction-isolated-fiat]').hasText('≈ $10.10 USD');
  });
});
