import { module, test } from 'qunit';
import hbs from 'htmlbars-inline-precompile';
import { render } from '@ember/test-helpers';
import Fixtures from '@cardstack/test-support/fixtures';
import { setupURLs, setupCardTest } from '@cardstack/test-support/test-helpers';

const scenario = new Fixtures({
  create(factory) {
    factory.addResource('assets', '123')
      .withAttributes({
        title: 'Bitcoin',
        unit: 'BTC',
        logo: 'bitcoin',
      })
  }
});

module('Card | asset', function(hooks) {
  setupCardTest(hooks);
  setupURLs(hooks);
  scenario.setupTest(hooks);

  test('embedded format renders', async function(assert) {
    await render(hbs`{{cardstack-card-test "asset" "123" format="embedded"}}`);
    assert.dom('[data-test-asset-embedded-title]').hasText('Bitcoin');
    assert.dom('[data-test-asset-embedded-unit]').hasText('BTC');
  });

  test('isolated format renders', async function(assert) {
    await render(hbs`{{cardstack-card-test "asset" "123" format="isolated"}}`);
    assert.dom('[data-test-asset-isolated-title]').hasText('Bitcoin Asset Detail');
    assert.dom('[data-test-asset-isolated-unit]').hasText('BTC');
  });
});
