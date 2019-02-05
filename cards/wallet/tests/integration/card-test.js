import { module, test } from 'qunit';
import hbs from 'htmlbars-inline-precompile';
import { render } from '@ember/test-helpers';
import Fixtures from '@cardstack/test-support/fixtures';
import { setupURLs, setupCardTest } from '@cardstack/test-support/test-helpers';

const scenario = new Fixtures({
  create(factory) {
    let eth = factory.addResource('assets', '0xC3D7FcFb69D168e9339ed18869B506c3B0F51fDE')
      .withRelated('network', factory.addResource('networks', 'ether')
        .withAttributes({
          title: 'Ether',
          unit: 'ETH',
          'asset-type': 'ethereum-addresses',
          'address-field': 'ethereum-address'
        }));
    let btc = factory.addResource('assets', '1F1tAaz5x1HUXrCNLbtMDqcw6o5GNn4xqX')
      .withRelated('network', factory.addResource('networks', 'bitcoin')
        .withAttributes({
          title: 'Bitcoin',
          unit: 'BTC',
        }));

    factory.addResource('wallets', '123')
      .withAttributes({
        title: 'Test Wallet'
      })
      .withRelated('assets', [btc, eth]);

    factory.addResource('grants')
      .withRelated('who', [{ type: 'groups', id: 'everyone' }])
      .withRelated('types', [
        { type: 'content-types', id: 'wallets' }
      ])
      .withAttributes({
        'may-read-resource': true,
        'may-read-fields': true,
      })
  }
});

module('Card | wallet', function (hooks) {
  setupCardTest(hooks);
  setupURLs(hooks);
  scenario.setupTest(hooks);

  test('embedded format renders', async function (assert) {
    await render(hbs`{{cardstack-card-test "wallet" "123" format="embedded"}}`);
    assert.dom('[data-test-wallet-embedded-title]').hasText('Test Wallet');
    assert.dom('[data-test-wallet-embedded-count]').hasText('2 Assets');
    // TO DO: Total value calculation needed here!
    assert.dom('[data-test-wallet-embedded-value]').hasText('≈ $0.00');
    assert.dom('[data-test-wallet-embedded-asset="0"] [data-test-asset-embedded-title]').hasText('Bitcoin');
    assert.dom('[data-test-wallet-embedded-asset="1"] [data-test-asset-embedded-title]').hasText('Ether');
  });

  test('isolated format renders', async function (assert) {
    await render(hbs`{{cardstack-card-test "wallet" "123" format="isolated"}}`);
    assert.dom('[data-test-wallet-isolated-title]').hasText('Test Wallet');
    assert.dom('[data-test-wallet-isolated-count]').hasText('2 Assets');
    // TO DO: Total value calculation needed here!
    assert.dom('[data-test-wallet-isolated-value]').hasText('≈ $0.00');
    assert.dom('[data-test-wallet-isolated-section-active-count]').hasText('2');
    assert.dom('[data-test-wallet-isolated-asset="0"] [data-test-asset-embedded-title]').hasText('Bitcoin');
    assert.dom('[data-test-wallet-isolated-asset="1"] [data-test-asset-embedded-title]').hasText('Ether');
  });
});
