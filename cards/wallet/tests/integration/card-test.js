import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';
import Fixtures from '@cardstack/test-support/fixtures';
import { setupURLs, renderCard } from '@cardstack/test-support/test-helpers';

const scenario = new Fixtures({
  create(factory) {
    let btc = factory.addResource('assets')
      .withAttributes({
        title: 'Bitcoin',
        unit: 'BTC'
      });

    let eth = factory.addResource('assets')
      .withAttributes({
        title: 'Ether',
        unit: 'ETH'
      });

    factory.addResource('wallets', '123')
      .withAttributes({
        title: 'ING Wallet'
      })
      .withRelated('assets', [ btc, eth ]);
  }
});

module('Card | wallet', function(hooks) {
  setupRenderingTest(hooks);
  setupURLs(hooks);
  scenario.setupTest(hooks);

  test('embedded format renders', async function(assert) {
    await renderCard('wallet', '123', 'embedded');
    assert.dom('[data-test-wallet-embedded-title]').hasText('ING Wallet');
    assert.dom('[data-test-wallet-embedded-asset-count]').hasText('2');
    assert.dom('[data-test-wallet-embedded-asset="0"] [data-test-asset-embedded-title]').hasText('Bitcoin');
    assert.dom('[data-test-wallet-embedded-asset="1"] [data-test-asset-embedded-title]').hasText('Ether');
  });

  test('isolated format renders', async function(assert) {
    await renderCard('wallet', '123', 'isolated');
    assert.dom('[data-test-wallet-isolated-title]').hasText('ING Wallet');
  });
});
