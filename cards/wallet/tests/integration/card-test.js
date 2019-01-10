import { module, test } from 'qunit';
import hbs from 'htmlbars-inline-precompile';
import { render } from '@ember/test-helpers';
import Fixtures from '@cardstack/test-support/fixtures';
import { setupURLs, setupCardTest } from '@cardstack/test-support/test-helpers';

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

module('Card | wallet', function(hooks) {
  setupCardTest(hooks);
  setupURLs(hooks);
  scenario.setupTest(hooks);

  test('embedded format renders', async function(assert) {
    await render(hbs`{{cardstack-card-test "wallet" "123" format="embedded"}}`);
    assert.dom('[data-test-wallet-embedded-title]').hasText('ING Wallet');
    assert.dom('[data-test-wallet-embedded-count]').hasText('2 Assets');
  });

  test('isolated format renders', async function(assert) {
    await render(hbs`{{cardstack-card-test "wallet" "123" format="isolated"}}`);
    assert.dom('[data-test-wallet-isolated-title]').hasText('ING Wallet');
    assert.dom('[data-test-wallet-isolated-assets-count]').hasText('2 Assets');
    assert.dom('[data-test-wallet-isolated-section-active-count]').hasText('2');
    assert.dom('[data-test-wallet-isolated-asset="0"] [data-test-asset-embedded-title]').hasText('Bitcoin');
    assert.dom('[data-test-wallet-isolated-asset="1"] [data-test-asset-embedded-title]').hasText('Ether');
  });
});
