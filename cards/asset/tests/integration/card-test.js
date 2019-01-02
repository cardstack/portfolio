import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';
import Fixtures from '@cardstack/test-support/fixtures';
import { setupURLs, renderCard } from '@cardstack/test-support/test-helpers';

const scenario = new Fixtures({
  create(factory) {
    factory.addResource('assets', '123')
      .withAttributes({
        title: 'Bitcoin',
        unit: 'BTC'
      })
  }
});

module('Card | asset', function(hooks) {
  setupRenderingTest(hooks);
  setupURLs(hooks);
  scenario.setupTest(hooks);

  test('embedded format renders', async function(assert) {
    await renderCard('asset', '123', 'embedded');
    assert.dom('[data-test-asset-embedded-title]').hasText('Bitcoin');
    assert.dom('[data-test-asset-embedded-unit]').hasText('BTC');
  });

  test('isolated format renders', async function(assert) {
    await renderCard('asset', '123', 'isolated');
    assert.dom('[data-test-asset-isolated-title]').hasText('Bitcoin');
    assert.dom('[data-test-asset-isolated-unit]').hasText('BTC');
  });
});
